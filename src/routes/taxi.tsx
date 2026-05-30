import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowRight, ArrowLeftRight, MapPin, Navigation, Loader2, X, AlertCircle, LocateFixed, Car, Calendar, Clock } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { toast } from 'sonner';
import { inr } from '@/utils/ursSession';
import { supabase } from '@/lib/supabase';

export const Route = createFileRoute('/taxi')({
  head: () => ({
    meta: [
      { title: "Taxi Services — UR's Chauffeur" },
      { name: 'description', content: 'Book a taxi for one-way drop or round trip. Automatic fare calculation based on distance and vehicle type.' },
    ],
  }),
  component: TaxiPage,
});

// ─── Types ────────────────────────────────────────────────────────────────────
type TripMode = 'oneway' | 'roundtrip';
type TaxiCategory = 'Hatchback' | 'Sedan' | 'SUV' | 'Luxury';

interface SelectedLocation {
  address: string;
  lat: number;
  lon: number;
}

interface LocationResult {
  name: string;
  lat: number;
  lon: number;
}

// ─── Pricing config ───────────────────────────────────────────────────────────
// Base rate per km (₹) by category
const RATE_PER_KM: Record<TaxiCategory, number> = {
  Hatchback: 12,
  Sedan: 14,
  SUV: 18,
  Luxury: 28,
};

// Minimum fare (₹) by category
const MIN_FARE: Record<TaxiCategory, number> = {
  Hatchback: 100,
  Sedan: 100,
  SUV: 100,
  Luxury: 100,
};

// Night surcharge multiplier (10 PM – 6 AM)
const NIGHT_SURCHARGE = 0.15; // +15%

// Toll/state tax estimate per 100 km (₹)
const TOLL_PER_100KM = 80;

// Driver allowance for trips > 300 km
const DRIVER_ALLOWANCE_LONG = 300;

const CAR_INFO: Record<TaxiCategory, { emoji: string; seats: number; desc: string }> = {
  Hatchback: { emoji: '🚗', seats: 4, desc: 'Swift, i20, Baleno' },
  Sedan:     { emoji: '🚘', seats: 4, desc: 'City, Verna, Ciaz' },
  SUV:       { emoji: '🚙', seats: 6, desc: 'Creta, Fortuner, XUV' },
  Luxury:    { emoji: '🏎️', seats: 4, desc: 'BMW, Mercedes, Audi' },
};

// ─── Haversine distance (km) ──────────────────────────────────────────────────
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Road distance ≈ straight-line × 1.35 factor
function estimateRoadKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  return Math.round(haversineKm(lat1, lon1, lat2, lon2) * 1.35);
}

function isNightTime(time: string): boolean {
  if (!time) return false;
  const [h] = time.split(':').map(Number);
  return h >= 22 || h < 6;
}

function calcFare(km: number, cat: TaxiCategory, mode: TripMode, time: string) {
  const effectiveKm = mode === 'roundtrip' ? km * 2 : km;
  const base = Math.max(effectiveKm * RATE_PER_KM[cat], MIN_FARE[cat]);
  const night = isNightTime(time) ? Math.round(base * NIGHT_SURCHARGE) : 0;
  const toll = Math.round((effectiveKm / 100) * TOLL_PER_100KM);
  const driverAllowance = effectiveKm > 300 ? DRIVER_ALLOWANCE_LONG : 0;
  const total = base + night + toll + driverAllowance;
  return { base, night, toll, driverAllowance, total, effectiveKm };
}

// ─── Photon geocoding helpers ─────────────────────────────────────────────────
async function fetchPhoton(query: string): Promise<LocationResult[]> {
  const params = new URLSearchParams({ q: query, limit: '6', lang: 'en', lat: '20.5937', lon: '78.9629' });
  const res = await fetch(`https://photon.komoot.io/api/?${params}`, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error('Photon error');
  const json = await res.json();
  return (json.features ?? []).map((f: any) => {
    const p = f.properties ?? {};
    const parts = [p.name, p.street, p.district, p.city, p.state, p.country].filter(Boolean);
    const [lon, lat] = f.geometry?.coordinates ?? [0, 0];
    return { name: parts.slice(0, 4).join(', '), lat, lon } as LocationResult;
  }).filter((r: LocationResult) => r.name && r.lat && r.lon);
}

async function reverseGeocode(lat: number, lon: number): Promise<string> {
  const res = await fetch(`https://photon.komoot.io/reverse/?lat=${lat}&lon=${lon}&limit=1`, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error('Reverse geocode failed');
  const json = await res.json();
  const f = json.features?.[0];
  if (!f) throw new Error('No result');
  const p = f.properties ?? {};
  return [p.name, p.street, p.district, p.city, p.state, p.country].filter(Boolean).slice(0, 4).join(', ');
}

// ─── Reusable location input ──────────────────────────────────────────────────
interface LocInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onSelect: (loc: SelectedLocation) => void;
  icon?: 'pickup' | 'drop';
  placeholder?: string;
}

function LocInput({ label, value, onChange, onSelect, icon = 'pickup', placeholder = 'Type to search...' }: LocInputProps) {
  const [inputVal, setInputVal] = useState(value);
  const [suggestions, setSuggestions] = useState<LocationResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locErr, setLocErr] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Sync if parent clears the value externally
  useEffect(() => {
    if (value === '') setInputVal('');
  }, [value]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setInputVal(v);
    onChange(v);
    setErr(false);
    clearTimeout(debounceRef.current);
    if (v.length < 3) { setSuggestions([]); setOpen(false); setLoading(false); return; }
    setLoading(true); setOpen(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const r = await fetchPhoton(v);
        setSuggestions(r); setErr(r.length === 0);
      } catch { setSuggestions([]); setErr(true); }
      finally { setLoading(false); }
    }, 350);
  };

  const handleSelect = (s: LocationResult) => {
    const addr = s.name;
    setInputVal(addr);
    onChange(addr);
    onSelect({ address: addr, lat: s.lat, lon: s.lon });
    setSuggestions([]); setOpen(false); setLoading(false); setErr(false);
  };

  const handleClear = () => {
    setInputVal('');
    onChange('');
    setSuggestions([]); setOpen(false); setLoading(false); setErr(false);
  };

  const handleLocate = () => {
    if (!navigator.geolocation) { setLocErr('Geolocation not supported'); return; }
    setLocating(true); setLocErr(null);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const addr = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        setInputVal(addr);
        onChange(addr);
        onSelect({ address: addr, lat: pos.coords.latitude, lon: pos.coords.longitude });
      } catch {
        const fb = `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`;
        setInputVal(fb); onChange(fb);
        onSelect({ address: fb, lat: pos.coords.latitude, lon: pos.coords.longitude });
      } finally { setLocating(false); }
    }, () => { setLocating(false); setLocErr('Could not get location. Please type manually.'); }, { timeout: 10000 });
  };

  const Icon = icon === 'drop' ? Navigation : MapPin;

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
        <input type="text" value={inputVal} onChange={handleChange} placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none text-base text-gray-900 placeholder-gray-400 bg-white"
          autoComplete="off" autoCorrect="off" spellCheck={false}
          onFocus={() => { if (inputVal.length >= 3 && suggestions.length > 0) setOpen(true); }}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {loading ? <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
            : inputVal.length > 0 ? <button type="button" onClick={handleClear} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
            : null}
        </div>
      </div>
      {icon !== 'drop' && (
        <button type="button" onClick={handleLocate} disabled={locating}
          className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-800 disabled:opacity-50 transition-colors">
          {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LocateFixed className="h-3.5 w-3.5" />}
          {locating ? 'Getting location...' : 'Use current location'}
        </button>
      )}
      {locErr && <p className="mt-1 flex items-center gap-1 text-xs text-red-500"><AlertCircle className="h-3.5 w-3.5" />{locErr}</p>}
      {open && inputVal.length >= 3 && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden" style={{ zIndex: 9999 }}>
          {loading && suggestions.length === 0 ? (
            <div className="px-4 py-3 flex items-center gap-2 text-sm text-gray-400"><Loader2 className="h-4 w-4 animate-spin text-blue-500" />Searching...</div>
          ) : err ? (
            <div className="px-4 py-3 flex items-center gap-2 text-sm text-gray-400"><AlertCircle className="h-4 w-4 text-amber-400" />No results found.</div>
          ) : (
            <div className="max-h-56 overflow-y-auto">
              {suggestions.map((s, i) => (
                <button key={`${s.lat}-${s.lon}-${i}`} type="button"
                  onMouseDown={e => { e.preventDefault(); handleSelect(s); }}
                  className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-600 shrink-0" />
                  <span className="text-sm text-gray-900 leading-snug">{s.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main page component ──────────────────────────────────────────────────────
function TaxiPage() {
  const [mode, setMode] = useState<TripMode>('oneway');
  const [category, setCategory] = useState<TaxiCategory>('Sedan');

  const [pickupQuery, setPickupQuery] = useState('');
  const [dropQuery, setDropQuery] = useState('');
  const [pickup, setPickup] = useState<SelectedLocation | null>(null);
  const [drop, setDrop] = useState<SelectedLocation | null>(null);

  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [returnDate, setReturnDate] = useState('');

  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Auto-calculate distance whenever both locations are set
  useEffect(() => {
    if (pickup && drop && pickup.lat && drop.lat) {
      const km = estimateRoadKm(pickup.lat, pickup.lon, drop.lat, drop.lon);
      setDistanceKm(km > 0 ? km : null);
    } else {
      setDistanceKm(null);
    }
  }, [pickup, drop]);

  const fare = distanceKm && distanceKm > 0
    ? calcFare(distanceKm, category, mode, time)
    : null;

  const handlePickupChange = useCallback((v: string) => { setPickupQuery(v); if (!v) setPickup(null); }, []);
  const handleDropChange = useCallback((v: string) => { setDropQuery(v); if (!v) { setDrop(null); setDistanceKm(null); } }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickup) { toast.error('Please select pickup location'); return; }
    if (!drop) { toast.error('Please select destination'); return; }
    if (!date) { toast.error('Please select travel date'); return; }
    if (!time) { toast.error('Please select departure time'); return; }
    if (mode === 'roundtrip' && !returnDate) { toast.error('Please select return date'); return; }

    setSubmitting(true);
    try {
      const session = (() => {
        try {
          const r = localStorage.getItem('app_session') || localStorage.getItem('urs_user');
          return r ? JSON.parse(r) : null;
        } catch { return null; }
      })();

      const payload = {
        customer_id: session?.mobile ?? 'guest',
        customer_name: session?.name ?? 'Guest',
        customer_phone: session?.mobile ?? '',
        booking_type: `taxi_${mode}`,
        status: 'pending',
        pickup_address: pickup.address,
        drop_address: drop.address,
        scheduled_date: date,
        scheduled_time: time,
        duration: mode === 'roundtrip' ? `Return: ${returnDate}` : null,
        days: null,
        car_category: category,
        transmission: 'Any',
        driver_needed: 'schedule',
        base_fare: fare?.base ?? 0,
        night_charge: fare?.night ?? 0,
        total_fare: fare?.total ?? 0,
        cancellation_charge: 500,
        assigned_driver: null,
        admin_notes: `Taxi ${mode} | ${distanceKm} km | Toll est: ₹${fare?.toll ?? 0}${fare?.driverAllowance ? ` | Driver allowance: ₹${fare.driverAllowance}` : ''}`,
      };

      const { error } = await supabase.from('bookings').insert(payload);
      if (error) throw new Error(error.message);
      setSubmitted(true);
      toast.success('Taxi booked! Our team will confirm shortly.');
    } catch (err: any) {
      toast.error(`Booking failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-black text-white mb-3">Booking Confirmed!</h2>
          <p className="text-slate-400 max-w-sm mb-8">Our team will call you shortly to confirm your taxi. Check your bookings for updates.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/taxi" onClick={() => setSubmitted(false)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors">
              Book Another
            </Link>
            <Link to="/" className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-colors">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      {/* Hero removed */}

      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-r from-blue-800 to-blue-600 text-white px-6 py-5 text-center">
            <h2 className="text-xl font-bold">Taxi Booking</h2>
            <p className="text-sm text-blue-100 mt-1">Fare auto-calculated from your locations</p>
          </div>

          {/* Trip mode tabs */}
          <div className="flex border-b border-gray-200 bg-white">
            {(['oneway', 'roundtrip'] as TripMode[]).map(m => (
              <button key={m} type="button" onClick={() => setMode(m)}
                className={`flex-1 py-4 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  mode === m ? 'border-b-2 border-blue-600 text-blue-700' : 'text-gray-400 hover:text-gray-600'
                }`}>
                {m === 'oneway' ? <><ArrowRight size={16} /> One-Way Drop</> : <><ArrowLeftRight size={16} /> Round Trip (Up & Down)</>}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-white">

            {/* Locations — wrapped so dropdowns don't overlap each other */}
            <div className="space-y-5" style={{ isolation: 'isolate' }}>
              <LocInput label="Pickup Location" value={pickupQuery} onChange={handlePickupChange}
                onSelect={loc => setPickup(loc)} icon="pickup" placeholder="Enter pickup city or address" />

              <LocInput label="Destination" value={dropQuery} onChange={handleDropChange}
                onSelect={loc => setDrop(loc)} icon="drop" placeholder="Enter destination city or address" />
            </div>

            {/* Distance badge — only shown after both locations confirmed */}
            {distanceKm !== null && distanceKm > 0 && (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                <span className="text-blue-600 font-bold text-sm">📍 Estimated Distance:</span>
                <span className="text-blue-800 font-black text-base">{distanceKm} km</span>
                {mode === 'roundtrip' && <span className="text-blue-500 text-xs">(× 2 = {distanceKm * 2} km total)</span>}
              </div>
            )}

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />Travel Date
                </label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Clock className="inline h-4 w-4 mr-1" />Departure Time
                </label>
                <input type="time" value={time} onChange={e => setTime(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none" />
              </div>
            </div>

            {/* Return date for round trip */}
            {mode === 'roundtrip' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />Return Date
                </label>
                <input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)}
                  min={date || new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none" />
              </div>
            )}

            {/* Night surcharge notice */}
            {isNightTime(time) && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
                <p className="text-sm text-orange-700 font-semibold">🌙 Night surcharge applies (10 PM – 6 AM): +15%</p>
              </div>
            )}

            {/* Vehicle selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <Car className="inline h-4 w-4 mr-1" />Vehicle Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(CAR_INFO) as TaxiCategory[]).map(cat => (
                  <button key={cat} type="button" onClick={() => setCategory(cat)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      category === cat ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}>
                    <div className="font-bold text-sm text-gray-800">{cat}</div>
                    <div className="text-xs text-gray-500">{CAR_INFO[cat].desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Fare breakdown */}
            {fare && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
                <h4 className="font-bold text-blue-800 mb-3 text-sm">💰 Fare Estimate</h4>
                <div className="space-y-2 text-sm">
                  {fare.night > 0 && (
                    <div className="flex justify-between text-orange-600">
                      <span>Night Surcharge (+15%)</span>
                      <span className="font-semibold">{inr.format(fare.night)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Toll / State Tax (est.)</span>
                    <span className="font-semibold">{inr.format(fare.toll)}</span>
                  </div>
                  {fare.driverAllowance > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Driver Allowance (long trip)</span>
                      <span className="font-semibold">{inr.format(fare.driverAllowance)}</span>
                    </div>
                  )}
                  <div className="border-t border-blue-300 pt-2 flex justify-between font-black text-blue-800 text-base">
                    <span>Total Estimate</span>
                    <span>{inr.format(fare.total)}</span>
                  </div>
                  <p className="text-xs text-gray-500 pt-1">* Final fare may vary slightly based on actual route & tolls. Min fare: {inr.format(MIN_FARE[category])}</p>
                </div>
              </div>
            )}

            {/* No fare yet */}
            {!fare && pickup && drop && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500 text-center">
                Select both locations to see fare estimate
              </div>
            )}

            <button type="submit" disabled={submitting}
              className="w-full bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-800 hover:to-blue-700 disabled:opacity-60 text-white font-bold py-4 rounded-2xl transition-all shadow-lg mt-2 flex items-center justify-center gap-2">
              {submitting ? <><Loader2 className="h-5 w-5 animate-spin" />Booking...</> : <>Confirm Taxi Booking <ArrowRight size={18} /></>}
            </button>
            <p className="text-xs text-gray-400 text-center">🔒 Verified drivers · Transparent pricing · Online/Offline payment</p>
          </form>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
          {[
            { icon: '📍', title: 'One-Way Drop', desc: 'Pay only for the distance to your destination. No return charges.' },
            { icon: '🔄', title: 'Round Trip', desc: 'Driver waits and brings you back. Total distance × 2 fare.' },
            { icon: '💰', title: 'Auto Pricing', desc: 'Fare calculated instantly from GPS distance. No surprises.' },
          ].map(c => (
            <div key={c.title} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center">
              <div className="text-3xl mb-2">{c.icon}</div>
              <h3 className="font-bold text-white text-sm mb-1">{c.title}</h3>
              <p className="text-xs text-slate-400">{c.desc}</p>
            </div>
          ))}
        </div>

        {/* Pricing table */}
        <div className="mt-8 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Rate Card</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-2 text-slate-400 font-semibold">Vehicle</th>
                  <th className="text-right py-2 text-slate-400 font-semibold">Rate/km</th>
                  <th className="text-right py-2 text-slate-400 font-semibold">Min Fare</th>
                  <th className="text-right py-2 text-slate-400 font-semibold">Seats</th>
                </tr>
              </thead>
              <tbody>
                {(Object.keys(CAR_INFO) as TaxiCategory[]).map(cat => (
                  <tr key={cat} className="border-b border-slate-800 last:border-0">
                    <td className="py-3 text-white font-semibold">{CAR_INFO[cat].emoji} {cat}</td>
                    <td className="py-3 text-right text-emerald-400 font-bold">₹{RATE_PER_KM[cat]}</td>
                    <td className="py-3 text-right text-slate-300">{inr.format(MIN_FARE[cat])}</td>
                    <td className="py-3 text-right text-slate-400">{CAR_INFO[cat].seats}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 space-y-1 text-xs text-slate-500">
            <p>• Night surcharge +15% applies between 10 PM – 6 AM</p>
            <p>• Toll & state taxes estimated at ₹{TOLL_PER_100KM}/100 km</p>
            <p>• Driver allowance ₹{DRIVER_ALLOWANCE_LONG} added for trips over 300 km</p>
            <p>• Round trip fare = one-way distance × 2</p>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <section className="px-6 py-12 bg-slate-950 border-t border-slate-800 text-center">
        <p className="text-slate-400 text-sm mb-3">Need help? Call or WhatsApp us directly.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href="tel:+919988440119" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors">
            📞 +91 99884 40119
          </a>
          <a href="https://wa.me/919988440119" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600/20 hover:bg-green-600/30 text-green-400 font-bold rounded-xl text-sm border border-green-500/30 transition-colors">
            💬 WhatsApp Us
          </a>
        </div>
      </section>
    </div>
  );
}
