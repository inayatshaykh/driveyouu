import { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { LocationInput, type SelectedLocation } from './LocationInput';
import {
  VehicleSelector,
  CARS_BY_CATEGORY,
  type CarCategory,
  type CarOption,
} from './VehicleSelector';
import { AuthModal } from './AuthModal';
import { BookingSummaryModal, type BookingSummaryData } from './BookingSummaryModal';
import { getUrsUser, inr } from '@/utils/ursSession';

type TabType = 'hourly' | 'multiday' | 'outstation';

const HOURLY_RATES: Record<number, number> = {
  4: 500,
  6: 700,
  8: 900,
  10: 1000,
  12: 1100,
};

const NIGHT_CHARGE = 200;
const MULTIDAY_RATE = 1250;

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
  const [selectedCategory, setSelectedCategory] = useState<CarCategory>('MPV');
  const [selectedCar, setSelectedCar] = useState<CarOption>(CARS_BY_CATEGORY.MPV[0]);
  const [selectedHours, setSelectedHours] = useState(4);

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

  const [showAuth, setShowAuth] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [user, setUser] = useState(() => getUrsUser());

  const multidayDays = useMemo(
    () => daysBetween(startDate, endDate),
    [startDate, endDate]
  );

  const nightCharge = hasNightCharge(startTime) ? NIGHT_CHARGE : 0;
  const hourlyBase = HOURLY_RATES[selectedHours] ?? 500;
  const hourlyTotal = hourlyBase + nightCharge;
  const multidayTotal = multidayDays * MULTIDAY_RATE;

  useEffect(() => {
    setUser(getUrsUser());
  }, [showAuth, showSummary]);

  const buildSummaryData = (): BookingSummaryData => {
    const base: BookingSummaryData = {
      tab: activeTab,
      pickup: selectedPickup?.address ?? pickupQuery,
      car: selectedCar,
      date:
        activeTab === 'hourly'
          ? formatDateLabel(bookingDate)
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
        nightCharge,
        total: hourlyTotal,
      };
    }
    if (activeTab === 'multiday') {
      return { ...base, days: multidayDays, total: multidayTotal };
    }
    return {
      ...base,
      destination: selectedDrop?.address ?? dropQuery,
      time: outstationTime,
    };
  };

  const validate = (): boolean => {
    if (!selectedPickup) {
      toast.error('Please select pickup location');
      return false;
    }
    if (activeTab === 'hourly') {
      if (!bookingDate) {
        toast.error('Please select a date');
        return false;
      }
      if (!startTime) {
        toast.error('Please select start time');
        return false;
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
          <h2 className="text-2xl font-bold">Book Your Ride</h2>
          <p className="text-sm text-emerald-50 mt-1">
            We provide the vehicle + driver — you just show up.
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
          {activeTab === 'hourly' && (
            <>
              <LocationInput
                label="Pickup Location"
                value={pickupQuery}
                onValueChange={(v) => {
                  setPickupQuery(v);
                  if (!v) setSelectedPickup(null);
                }}
                onSelect={setSelectedPickup}
              />
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
                    + {inr.format(NIGHT_CHARGE)} Night Charge
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Duration</label>
                <div className="flex gap-2 flex-wrap">
                  {Object.keys(HOURLY_RATES).map((hours) => (
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
                <p className="text-xs text-gray-500 mt-2">Minimum booking: 4 hours</p>
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
                  {nightCharge > 0 && (
                    <div className="flex justify-between text-orange-600">
                      <span>Night Charge</span>
                      <span className="font-semibold">{inr.format(nightCharge)}</span>
                    </div>
                  )}
                  <div className="border-t border-emerald-300 pt-2 flex justify-between font-bold text-emerald-700">
                    <span>Total</span>
                    <span>{inr.format(hourlyTotal)}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'multiday' && (
            <>
              <LocationInput
                label="Pickup Location"
                value={pickupQuery}
                onValueChange={(v) => {
                  setPickupQuery(v);
                  if (!v) setSelectedPickup(null);
                }}
                onSelect={setSelectedPickup}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
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
                <p className="text-sm text-gray-600">
                  <span className="font-semibold text-emerald-700">{multidayDays}</span>{' '}
                  {multidayDays === 1 ? 'day' : 'days'} · {inr.format(MULTIDAY_RATE)}/day ={' '}
                  <span className="font-bold text-emerald-700">{inr.format(multidayTotal)}</span>
                </p>
              )}
            </>
          )}

          {activeTab === 'outstation' && (
            <>
              <LocationInput
                label="Pickup Location"
                value={pickupQuery}
                onValueChange={(v) => {
                  setPickupQuery(v);
                  if (!v) setSelectedPickup(null);
                }}
                onSelect={setSelectedPickup}
              />
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
                </div>
              </div>
              <p className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-sm text-gray-700">
                Starting from {inr.format(600)}, final fare confirmed after booking.
              </p>
            </>
          )}

          <VehicleSelector
            selectedCategory={selectedCategory}
            selectedCar={selectedCar}
            onCategoryChange={setSelectedCategory}
            onCarChange={setSelectedCar}
          />

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-800 hover:to-emerald-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg mt-2"
          >
            Book Now
          </button>
          <p className="text-xs text-gray-400 text-center">
            🔒 Car + Driver Included · Online/Offline Payment
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
