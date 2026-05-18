import { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { LocationInput, type SelectedLocation } from './LocationInput';
import {
  VehicleSelector,
  type CarCategory,
  type TransmissionType,
} from './VehicleSelector';
import { AuthModal } from './AuthModal';
import { BookingSummaryModal, type BookingSummaryData } from './BookingSummaryModal';
import { getUrsUser, inr } from '@/utils/ursSession';

type TabType = 'hourly' | 'multiday' | 'outstation';

// Base rates for local (4 hours minimum)
const LOCAL_HOURLY_RATES: Record<number, number> = {
  4: 500,
  6: 700,
  8: 900,
  10: 1000,
  12: 1100,
};

// Outstation base rates (4 hours minimum)
const OUTSTATION_HOURLY_RATES: Record<number, number> = {
  4: 600,
  6: 800,
  8: 1000,
  10: 1200,
  12: 1400,
};

const NIGHT_CHARGE = 200; // After 9 PM
const MULTIDAY_RATE = 1250; // Per day
const CANCELLATION_CHARGE = 500;

// Car multipliers based on category (customer's own car)
const CAR_MULTIPLIERS: Record<string, number> = {
  Hatchback: 1.0,
  Sedan: 1.1,
  SUV: 1.2,
  Luxury: 1.5,
};

// Transmission multiplier (automatic requires specialized drivers)
const TRANSMISSION_MULTIPLIERS: Record<TransmissionType, number> = {
  Manual: 1.0,
  Automatic: 1.1,
};

function hasNightCharge(time: string): boolean {
  if (!time) return false;
  const [h] = time.split(':').map(Number);
  return h >= 21;
}

function daysBetween(start: string, end: string): number {
  if (!start || !end) return 1;
  const s = new Date(start);
  const e = new Date(end);
  const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(1, diff + 1);
}

function formatDateLabel(iso: string): string {
  if (!iso) return '—';
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function NewBookingForm() {
  const [activeTab, setActiveTab] = useState<TabType>('hourly');
  const [selectedCategory, setSelectedCategory] = useState<CarCategory>('Sedan');
  const [selectedTransmission, setSelectedTransmission] = useState<TransmissionType>('Manual');
  const [selectedHours, setSelectedHours] = useState(4);
  const [driverNeeded, setDriverNeeded] = useState<'now' | 'schedule'>('now');

  const [pickupQuery, setPickupQuery] = useState('');
  const [dropQuery, setDropQuery] = useState('');
  const [selectedPickup, setSelectedPickup] = useState<SelectedLocation | null>(null);
  const [selectedDrop, setSelectedDrop] = useState<SelectedLocation | null>(null);

  const [bookingDate, setBookingDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [outstationDate, setOutstationDate] = useState('');
  const [outstationTime, setOutstationTime] = useState('');
  const [outstationDays, setOutstationDays] = useState(1);
  const [outstationHours, setOutstationHours] = useState(4);

  const [showAuth, setShowAuth] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [user, setUser] = useState(() => getUrsUser());

  const multidayDays = useMemo(
    () => daysBetween(startDate, endDate),
    [startDate, endDate]
  );

  // Get car and transmission multipliers
  const carMultiplier = CAR_MULTIPLIERS[selectedCategory] || 1.0;
  const transmissionMultiplier = TRANSMISSION_MULTIPLIERS[selectedTransmission] || 1.0;
  const totalMultiplier = carMultiplier * transmissionMultiplier;

  // Hourly calculations (local)
  const nightChargeHourly = hasNightCharge(startTime) ? NIGHT_CHARGE : 0;
  const hourlyBaseRate = LOCAL_HOURLY_RATES[selectedHours] ?? 500;
  const hourlyBase = Math.round(hourlyBaseRate * totalMultiplier);
  const hourlyTotal = hourlyBase + nightChargeHourly;

  // Multi-day calculations
  const multidayBaseRate = MULTIDAY_RATE * multidayDays;
  const multidayTotal = Math.round(multidayBaseRate * totalMultiplier);

  // Outstation calculations
  const nightChargeOutstation = hasNightCharge(outstationTime) ? NIGHT_CHARGE : 0;
  const outstationBaseRate = outstationDays === 1 
    ? (OUTSTATION_HOURLY_RATES[outstationHours] ?? 600)
    : (MULTIDAY_RATE * outstationDays);
  const outstationBase = Math.round(outstationBaseRate * totalMultiplier);
  const outstationTotal = outstationBase + nightChargeOutstation;

  useEffect(() => {
    setUser(getUrsUser());
  }, [showAuth, showSummary]);

  const buildSummaryData = (): BookingSummaryData => {
    const base: BookingSummaryData = {
      tab: activeTab,
      pickup: selectedPickup?.address ?? pickupQuery,
      carCategory: selectedCategory,
      transmission: selectedTransmission,
      driverNeeded,
      date:
        activeTab === 'hourly'
          ? driverNeeded === 'now' ? 'Now (within 30 min)' : formatDateLabel(bookingDate)
          : activeTab === 'multiday'
            ? `${formatDateLabel(startDate)} – ${formatDateLabel(endDate)}`
            : formatDateLabel(outstationDate),
    };

    if (activeTab === 'hourly') {
      return {
        ...base,
        time: startTime,
        duration: `${selectedHours} hours`,
        baseFare: hourlyBase,
        nightCharge: nightChargeHourly,
        total: hourlyTotal,
        cancellationCharge: CANCELLATION_CHARGE,
      };
    }
    if (activeTab === 'multiday') {
      return { 
        ...base, 
        days: multidayDays, 
        total: multidayTotal,
        cancellationCharge: CANCELLATION_CHARGE,
      };
    }
    return {
      ...base,
      destination: selectedDrop?.address ?? dropQuery,
      time: outstationTime,
      days: outstationDays,
      duration: outstationDays === 1 ? `${outstationHours} hours` : undefined,
      baseFare: outstationBase,
      nightCharge: nightChargeOutstation,
      total: outstationTotal,
      cancellationCharge: CANCELLATION_CHARGE,
    };
  };

  const validate = (): boolean => {
    if (!selectedPickup) {
      toast.error('Please select pickup location');
      return false;
    }
    if (activeTab === 'hourly') {
      if (driverNeeded === 'schedule') {
        if (!bookingDate) {
          toast.error('Please select a date');
          return false;
        }
        if (!startTime) {
          toast.error('Please select start time');
          return false;
        }
      }
    }
    if (activeTab === 'multiday') {
      if (!startDate || !endDate) {
        toast.error('Please select start and end dates');
        return false;
      }
      if (new Date(endDate) < new Date(startDate)) {
        toast.error('End date must be on or after start date');
        return false;
      }
    }
    if (activeTab === 'outstation') {
      if (!selectedDrop) {
        toast.error('Please select destination from suggestions');
        return false;
      }
      if (!outstationDate) {
        toast.error('Please select date');
        return false;
      }
      if (!outstationTime) {
        toast.error('Please select time');
        return false;
      }
    }
    return true;
  };

  const handleBookNow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (user) {
      setShowSummary(true);
    } else {
      setShowAuth(true);
    }
  };

  const handleConfirm = () => {
    setShowSummary(false);
    toast.success('Booking confirmed! Our team will contact you shortly.');
  };

  return (
    <>
      <div className="w-full max-w-2xl mx-auto bg-gray-50 rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-800 to-emerald-800 text-white px-6 py-6 text-center">
          <h2 className="text-2xl font-bold">Book Your Driver</h2>
          <p className="text-sm text-emerald-50 mt-1">
            We provide the driver — you use your own vehicle.
          </p>
        </div>

        <div className="flex border-b border-gray-200 bg-white">
          {(['hourly', 'multiday', 'outstation'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 text-sm font-semibold transition-all ${
                activeTab === tab
                  ? 'border-b-2 border-emerald-600 text-emerald-700'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab === 'hourly' ? 'Hourly' : tab === 'multiday' ? 'Multi-Day' : 'Outstation'}
            </button>
          ))}
        </div>

        <form onSubmit={handleBookNow} className="p-6 space-y-5 bg-white rounded-b-2xl">
          <LocationInput
            label="Pickup Location"
            value={pickupQuery}
            onValueChange={(v) => {
              setPickupQuery(v);
              if (!v) setSelectedPickup(null);
            }}
            onSelect={setSelectedPickup}
          />

          {/* When is driver needed - Dropdown */}
          <div>
            <h3 className="text-base font-bold text-gray-700 mb-3">When is driver needed?</h3>
            <div className="relative">
              <select
                value={driverNeeded}
                onChange={(e) => setDriverNeeded(e.target.value as 'now' | 'schedule')}
                className="w-full px-4 py-4 pr-10 text-base text-gray-700 bg-white border border-gray-300 rounded-xl appearance-none focus:ring-2 focus:ring-emerald-600 focus:outline-none cursor-pointer"
              >
                <option value="now">Now</option>
                <option value="schedule">Schedule</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {activeTab === 'hourly' && (
            <>
              {driverNeeded === 'schedule' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Calendar className="inline h-4 w-4 mr-1" />
                      Date
                    </label>
                    <input
                      type="date"
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Clock className="inline h-4 w-4 mr-1" />
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                    {hasNightCharge(startTime) && (
                      <p className="text-orange-600 text-sm mt-2 font-semibold">
                        + {inr.format(NIGHT_CHARGE)} Night Charge (after 9 PM)
                      </p>
                    )}
                  </div>
                </>
              )}
              {driverNeeded === 'now' && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                  <p className="text-sm text-emerald-800">
                    <span className="font-semibold">⚡ Instant Booking:</span> Driver will be assigned immediately and arrive within 30 minutes
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Duration</label>
                <div className="flex gap-2 flex-wrap">
                  {Object.keys(LOCAL_HOURLY_RATES).map((hours) => (
                    <button
                      key={hours}
                      type="button"
                      onClick={() => setSelectedHours(parseInt(hours, 10))}
                      className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                        selectedHours === parseInt(hours, 10)
                          ? 'bg-emerald-700 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {hours} hrs
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">Minimum booking: 4 hours (Local)</p>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mt-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Duration</span>
                    <span className="font-semibold">{selectedHours} Hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Base Fare</span>
                    <span className="font-semibold">{inr.format(hourlyBase)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{selectedCategory} · {selectedTransmission}</span>
                    <span></span>
                  </div>
                  {nightChargeHourly > 0 && (
                    <div className="flex justify-between text-orange-600">
                      <span>Night Charge (after 9 PM)</span>
                      <span className="font-semibold">{inr.format(nightChargeHourly)}</span>
                    </div>
                  )}
                  <div className="border-t border-emerald-300 pt-2 flex justify-between font-bold text-emerald-700">
                    <span>Total</span>
                    <span>{inr.format(hourlyTotal)}</span>
                  </div>
                  <div className="border-t border-emerald-200 pt-2 flex justify-between text-xs text-gray-600">
                    <span>Cancellation Charge</span>
                    <span className="font-semibold">{inr.format(CANCELLATION_CHARGE)}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'multiday' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">📅 Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">📅 End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>
              {startDate && endDate && (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                    <p className="text-sm font-semibold text-blue-800">
                      ⏱️ Duration: {multidayDays} {multidayDays === 1 ? 'Day' : 'Days'}
                    </p>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-700">Duration</span>
                        <span className="font-semibold">{multidayDays} {multidayDays === 1 ? 'day' : 'days'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Rate per day</span>
                        <span className="font-semibold">{inr.format(Math.round(MULTIDAY_RATE * totalMultiplier))}/day</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{selectedCategory} · {selectedTransmission}</span>
                        <span></span>
                      </div>
                      <div className="border-t border-emerald-300 pt-2 flex justify-between font-bold text-emerald-700">
                        <span>Total</span>
                        <span>{inr.format(multidayTotal)}</span>
                      </div>
                      <div className="border-t border-emerald-200 pt-2 flex justify-between text-xs text-gray-600">
                        <span>Cancellation Charge</span>
                        <span className="font-semibold">{inr.format(CANCELLATION_CHARGE)}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {activeTab === 'outstation' && (
            <>
              <LocationInput
                label="Destination"
                value={dropQuery}
                onValueChange={(v) => {
                  setDropQuery(v);
                  if (!v) setSelectedDrop(null);
                }}
                onSelect={setSelectedDrop}
                icon="drop"
                placeholder="Enter destination"
              />
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Trip Duration</label>
                <div className="relative">
                  <select
                    value={outstationDays}
                    onChange={(e) => setOutstationDays(parseInt(e.target.value, 10))}
                    className="w-full px-4 py-4 pr-10 text-base text-gray-700 bg-white border border-gray-300 rounded-xl appearance-none focus:ring-2 focus:ring-emerald-600 focus:outline-none cursor-pointer"
                  >
                    <option value={1}>Single Day</option>
                    {[2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 30].map((days) => (
                      <option key={days} value={days}>
                        {days} Days
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
              {outstationDays === 1 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Duration (Hours)</label>
                  <div className="flex gap-2 flex-wrap">
                    {Object.keys(OUTSTATION_HOURLY_RATES).map((hours) => (
                      <button
                        key={hours}
                        type="button"
                        onClick={() => setOutstationHours(parseInt(hours, 10))}
                        className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                          outstationHours === parseInt(hours, 10)
                            ? 'bg-emerald-700 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {hours} hrs
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Minimum booking: 4 hours (Outstation)</p>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={outstationDate}
                    onChange={(e) => setOutstationDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Time</label>
                  <input
                    type="time"
                    value={outstationTime}
                    onChange={(e) => setOutstationTime(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                  {hasNightCharge(outstationTime) && (
                    <p className="text-orange-600 text-sm mt-2 font-semibold">
                      + {inr.format(NIGHT_CHARGE)} Night Charge (after 9 PM)
                    </p>
                  )}
                </div>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Duration</span>
                    <span className="font-semibold">
                      {outstationDays === 1 ? `${outstationHours} Hours` : `${outstationDays} Days`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Base Fare</span>
                    <span className="font-semibold">{inr.format(outstationBase)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{selectedCategory} · {selectedTransmission}</span>
                    <span></span>
                  </div>
                  {nightChargeOutstation > 0 && (
                    <div className="flex justify-between text-orange-600">
                      <span>Night Charge (after 9 PM)</span>
                      <span className="font-semibold">{inr.format(nightChargeOutstation)}</span>
                    </div>
                  )}
                  <div className="border-t border-emerald-300 pt-2 flex justify-between font-bold text-emerald-700">
                    <span>Total</span>
                    <span>{inr.format(outstationTotal)}</span>
                  </div>
                  <div className="border-t border-emerald-200 pt-2 flex justify-between text-xs text-gray-600">
                    <span>Cancellation Charge</span>
                    <span className="font-semibold">{inr.format(CANCELLATION_CHARGE)}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  * Fooding & Lodging from customer side
                </p>
              </div>
            </>
          )}

          <VehicleSelector
            selectedCategory={selectedCategory}
            selectedTransmission={selectedTransmission}
            onCategoryChange={setSelectedCategory}
            onTransmissionChange={setSelectedTransmission}
          />

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-800 hover:to-emerald-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg mt-2"
          >
            Book Now
          </button>
          <p className="text-xs text-gray-400 text-center">
            🔒 Professional Driver · Your Own Vehicle · Online/Offline Payment
          </p>
        </form>
      </div>

      <AuthModal
        open={showAuth}
        onClose={() => setShowAuth(false)}
        onVerified={() => {
          setUser(getUrsUser());
          setShowAuth(false);
          setShowSummary(true);
        }}
      />

      <BookingSummaryModal
        open={showSummary}
        data={buildSummaryData()}
        onEdit={() => setShowSummary(false)}
        onConfirm={handleConfirm}
      />
    </>
  );
}
