import { useState, useRef, useEffect, memo, useCallback } from 'react';
import { MapPin, Navigation, Loader2, X, AlertCircle, LocateFixed } from 'lucide-react';

export interface LocationResult {
  name: string;
  lat: number;
  lon: number;
}

export interface SelectedLocation {
  address: string;
  lat: number;
  lon: number;
}

// ── Photon API (photon.komoot.io) ─────────────────────────────────────────────
// Free, no API key, OpenStreetMap-based geocoding.
// Biased toward India using lat/lon bbox center.
async function fetchPhoton(query: string): Promise<LocationResult[]> {
  const params = new URLSearchParams({
    q: query,
    limit: '6',
    lang: 'en',
    // Bias results toward India (center ~20.5937, 78.9629)
    lat: '20.5937',
    lon: '78.9629',
  });
  const res = await fetch(
    `https://photon.komoot.io/api/?${params.toString()}`,
    { signal: AbortSignal.timeout(5000) }
  );
  if (!res.ok) throw new Error('Photon API error');
  const json = await res.json();

  return (json.features ?? []).map((f: any) => {
    const p = f.properties ?? {};
    // Build a readable address string
    const parts = [
      p.name,
      p.street,
      p.district,
      p.city,
      p.state,
      p.country,
    ].filter(Boolean);
    const name = parts.slice(0, 4).join(', ');
    const [lon, lat] = f.geometry?.coordinates ?? [0, 0];
    return { name, lat, lon } as LocationResult;
  }).filter((r: LocationResult) => r.name && r.lat && r.lon);
}

// ── Photon reverse geocode ────────────────────────────────────────────────────
async function reverseGeocode(lat: number, lon: number): Promise<string> {
  const res = await fetch(
    `https://photon.komoot.io/reverse?lat=${lat}&lon=${lon}&limit=1`,
    { signal: AbortSignal.timeout(5000) }
  );
  if (!res.ok) throw new Error('Reverse geocode failed');
  const json = await res.json();
  const f = json.features?.[0];
  if (!f) throw new Error('No result');
  const p = f.properties ?? {};
  const parts = [p.name, p.street, p.district, p.city, p.state, p.country].filter(Boolean);
  return parts.slice(0, 4).join(', ');
}

interface LocationInputProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  onSelect: (location: SelectedLocation) => void;
  placeholder?: string;
  icon?: 'pickup' | 'drop';
}

export const LocationInput = memo(function LocationInput({
  label,
  value,
  onValueChange,
  onSelect,
  placeholder = 'Type to search location...',
  icon = 'pickup',
}: LocationInputProps) {
  const [suggestions, setSuggestions] = useState<LocationResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const abortRef = useRef<AbortController>();

  const Icon = icon === 'drop' ? Navigation : MapPin;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    onValueChange(text);
    setError(false);

    // Clear previous debounce + abort in-flight request
    clearTimeout(debounceRef.current);
    abortRef.current?.abort();

    if (text.length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setShowDropdown(true);

    // Debounce 350ms
    debounceRef.current = setTimeout(async () => {
      abortRef.current = new AbortController();
      try {
        const results = await fetchPhoton(text);
        setSuggestions(results);
        setError(results.length === 0);
        setShowDropdown(true);
      } catch {
        setSuggestions([]);
        setError(true);
        setShowDropdown(true);
      } finally {
        setLoading(false);
      }
    }, 350);
  }, [onValueChange]);

  const handleSelect = useCallback((s: LocationResult) => {
    onSelect({ address: s.name, lat: s.lat, lon: s.lon });
    onValueChange(s.name);
    setSuggestions([]);
    setShowDropdown(false);
    setLoading(false);
    setError(false);
  }, [onSelect, onValueChange]);

  const handleUseCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocateError('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    setLocateError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const address = await reverseGeocode(latitude, longitude);
          onValueChange(address);
          onSelect({ address, lat: latitude, lon: longitude });
          setSuggestions([]);
          setShowDropdown(false);
        } catch {
          setLocateError('Could not fetch address. Please type manually.');
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocateError('Location permission denied. Please allow access.');
        } else {
          setLocateError('Unable to get your location. Please type manually.');
        }
      },
      { timeout: 8000, maximumAge: 60000 }
    );
  }, [onValueChange, onSelect]);

  const handleClear = useCallback(() => {
    clearTimeout(debounceRef.current);
    abortRef.current?.abort();
    onValueChange('');
    setSuggestions([]);
    setShowDropdown(false);
    setLoading(false);
    setError(false);
  }, [onValueChange]);

  const showList = showDropdown && value.length >= 3;

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none text-base bg-white"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />
        {/* Right icon: spinner while loading, clear button otherwise */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 className="h-4 w-4 text-emerald-500 animate-spin" />
          ) : value.length > 0 ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Use Current Location button — only show for pickup, not drop */}
      {icon !== 'drop' && (
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={locating}
          className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {locating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <LocateFixed className="h-3.5 w-3.5" />
          )}
          {locating ? 'Getting location...' : 'Use current location'}
        </button>
      )}
      {locateError && (
        <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {locateError}
        </p>
      )}

      {/* Dropdown */}
      {showList && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
          {loading && suggestions.length === 0 ? (
            // Skeleton while first results load
            <div className="px-4 py-3 flex items-center gap-2 text-sm text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
              Searching...
            </div>
          ) : error ? (
            // Error / no results fallback
            <div className="px-4 py-3 flex items-center gap-2 text-sm text-gray-400">
              <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
              No results found. Try a different search.
            </div>
          ) : (
            <div className="max-h-56 overflow-y-auto">
              {suggestions.map((s, idx) => (
                <button
                  key={`${s.lat}-${s.lon}-${idx}`}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault(); // prevent input blur before select
                    handleSelect(s);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-emerald-50 border-b border-gray-100 last:border-b-0 transition-colors flex items-center gap-2"
                >
                  <MapPin className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="text-sm text-gray-900 leading-snug">{s.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
