import { useState, useEffect, useRef } from 'react';
import { MapPin, Calendar, Car, Loader2, Navigation, Clock } from 'lucide-react';
import { toast } from 'sonner';

type TabType = 'oneway' | 'roundtrip' | 'outstation';
type WhenNeeded = 'now' | 'schedule';

interface DemoCar {
  id: number;
  name: string;
  type: string;
  seats: number;
  transmission: string;
  emoji: string;
  hourlyRates: { [hours: number]: number };
  multiDayRate: number;
  outstationBase: number;
}

interface LocationSuggestion {
  name: string;
  city: string;
  lat: number;
  lon: number;
  distance?: number;
}

interface SelectedLocation {
  address: string;
  lat: number;
  lon: number;
}

// Demo cars - later admin will manage these
const DEMO_CARS: DemoCar[] = [
  {
    id: 1,
    name: "Maruti Ertiga",
    type: "MPV",
    seats: 7,
    transmission: "Manual",
    emoji: "🚐",
    hourlyRates: { 4: 500, 6: 700, 8: 900, 10: 1000, 12: 1100 },
    multiDayRate: 1250,
    outstationBase: 600,
  },
  {
    id: 2,
    name: "Toyota Fortuner",
    type: "SUV",
    seats: 7,
    transmission: "Automatic",
    emoji: "🚙",
    hourlyRates: { 4: 800, 6: 1100, 8: 1400, 10: 1700, 12: 2000 },
    multiDayRate: 2000,
    outstationBase: 1000,
  },
  {
    id: 3,
    name: "Maruti Swift",
    type: "Hatchback",
    seats: 5,
    transmission: "Manual",
    emoji: "🚗",
    hourlyRates: { 4: 500, 6: 700, 8: 900, 10: 1000, 12: 1100 },
    multiDayRate: 1250,
    outstationBase: 600,
  },
  {
    id: 4,
    name: "Honda City",
    type: "Sedan",
    seats: 5,
    transmission: "Automatic",
    emoji: "🚘",
    hourlyRates: { 4: 600, 6: 850, 8: 1050, 10: 1250, 12: 1400 },
    multiDayRate: 1500,
    outstationBase: 750,
  },
];

// Pricing constants
const BASE_FARE = 50;
const PER_KM_RATE = 14;
const ROUND_TRIP_MULTIPLIER = 1.8;
const OUTSTATION_PER_DAY = 2500;

// Haversine formula to calculate distance between two coordinates
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Round price to nearest ₹10
function roundPrice(price: number): number {
  return Math.round(price / 10) * 10;
}

// Get lowest hourly rate for a car
function getLowestHourlyRate(car: DemoCar): number {
  return Math.min(...Object.values(car.hourlyRates));
}

export function NewBookingForm() {
  const [activeTab, setActiveTab] = useState<TabType>('oneway');
  const [selectedCar, setSelectedCar] = useState<DemoCar>(DEMO_CARS[0]); // Default: Maruti Ertiga
  const [whenNeeded, setWhenNeeded] = useState<WhenNeeded>('now');
  const [numberOfDays, setNumberOfDays] = useState(1);
  const [selectedHours, setSelectedHours] = useState(4);

  // Location states
  const [pickupQuery, setPickupQuery] = useState('');
  const [dropQuery, setDropQuery] = useState('');
  const [pickupSuggestions, setPickupSuggestions] = useState<LocationSuggestion[]>([]);
  const [dropSuggestions, setDropSuggestions] = useState<LocationSuggestion[]>([]);
  const [selectedPickup, setSelectedPickup] = useState<SelectedLocation | null>(null);
  const [selectedDrop, setSelectedDrop] = useState<SelectedLocation | null>(null);
  const [showPickupDropdown, setShowPickupDropdown] = useState(false);
  const [showDropDropdown, setShowDropDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Date/time states
  const [departureDateTime, setDepartureDateTime] = useState('');
  const [returnDateTime, setReturnDateTime] = useState('');
  const [departureDate, setDepartureDate] = useState('');

  // Calculation states
  const [distance, setDistance] = useState<number | null>(null);
  const [price, setPrice] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Refs for debouncing
  const pickupDebounceRef = useRef<NodeJS.Timeout>();
  const dropDebounceRef = useRef<NodeJS.Timeout>();

  // Search locations using OpenStreetMap Nominatim API
  const searchLocation = async (query: string, isPickup: boolean) => {
    if (query.length < 4) {
      if (isPickup) setPickupSuggestions([]);
      else setDropSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          query
        )}&format=json&limit=5&countrycodes=in`
      );
      const data = await response.json();

      const suggestions: LocationSuggestion[] = data.map((item: any) => ({
        name: item.display_name.split(',')[0],
        city: item.display_name.split(',').slice(1).join(',').trim(),
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
      }));

      if (isPickup) {
        setPickupSuggestions(suggestions);
        setShowPickupDropdown(true);
      } else {
        setDropSuggestions(suggestions);
        setShowDropDropdown(true);
      }
    } catch (error) {
      console.error('Error searching location:', error);
      toast.error('Failed to search location');
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search handlers
  const handlePickupChange = (value: string) => {
    setPickupQuery(value);
    if (pickupDebounceRef.current) clearTimeout(pickupDebounceRef.current);
    pickupDebounceRef.current = setTimeout(() => {
      searchLocation(value, true);
    }, 500);
  };

  const handleDropChange = (value: string) => {
    setDropQuery(value);
    if (dropDebounceRef.current) clearTimeout(dropDebounceRef.current);
    dropDebounceRef.current = setTimeout(() => {
      searchLocation(value, false);
    }, 500);
  };

  // Select location from suggestions
  const selectPickup = (suggestion: LocationSuggestion) => {
    setSelectedPickup({
      address: `${suggestion.name}, ${suggestion.city}`,
      lat: suggestion.lat,
      lon: suggestion.lon,
    });
    setPickupQuery(`${suggestion.name}, ${suggestion.city}`);
    setShowPickupDropdown(false);
  };

  const selectDrop = (suggestion: LocationSuggestion) => {
    setSelectedDrop({
      address: `${suggestion.name}, ${suggestion.city}`,
      lat: suggestion.lat,
      lon: suggestion.lon,
    });
    setDropQuery(`${suggestion.name}, ${suggestion.city}`);
    setShowDropDropdown(false);
  };

  // Calculate distance and price when both locations are selected
  useEffect(() => {
    if (selectedPickup && selectedDrop && activeTab !== 'outstation') {
      setIsCalculating(true);
      
      // Calculate distance
      const dist = haversineKm(
        selectedPickup.lat,
        selectedPickup.lon,
        selectedDrop.lat,
        selectedDrop.lon
      );
      setDistance(dist);

      // Calculate price based on selected car
      let calculatedPrice = 0;
      if (activeTab === 'oneway') {
        calculatedPrice = selectedCar.outstationBase + dist * PER_KM_RATE;
      } else if (activeTab === 'roundtrip') {
        calculatedPrice = selectedCar.outstationBase + dist * PER_KM_RATE * ROUND_TRIP_MULTIPLIER;
      }
      setPrice(roundPrice(calculatedPrice));
      
      setTimeout(() => setIsCalculating(false), 300);
    } else if (activeTab === 'outstation') {
      // For outstation, price is per day based on selected car
      setDistance(null);
      setPrice(roundPrice(selectedCar.multiDayRate * numberOfDays));
    } else {
      setDistance(null);
      setPrice(null);
    }
  }, [selectedPickup, selectedDrop, activeTab, numberOfDays, selectedCar, selectedHours]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!selectedPickup) {
      toast.error('Please select pickup location');
      return;
    }
    
    if (activeTab !== 'outstation' && !selectedDrop) {
      toast.error('Please select drop location');
      return;
    }

    toast.success('Booking request submitted!');
    // Here you would normally send the booking data to your API
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-gray-50 rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-emerald-800 text-white px-6 py-6 text-center">
        <h2 className="text-2xl font-bold">Book Your Ride</h2>
        <p className="text-sm text-emerald-50 mt-1">
          We provide the vehicle + driver — you just show up.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white">
        <button
          onClick={() => setActiveTab('oneway')}
          className={`flex-1 py-4 text-sm font-semibold transition-all ${
            activeTab === 'oneway'
              ? 'border-b-2 border-emerald-600 text-emerald-700'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          One Way
        </button>
        <button
          onClick={() => setActiveTab('roundtrip')}
          className={`flex-1 py-4 text-sm font-semibold transition-all ${
            activeTab === 'roundtrip'
              ? 'border-b-2 border-emerald-600 text-emerald-700'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Round Trip
        </button>
        <button
          onClick={() => setActiveTab('outstation')}
          className={`flex-1 py-4 text-sm font-semibold transition-all ${
            activeTab === 'outstation'
              ? 'border-b-2 border-emerald-600 text-emerald-700'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Outstation
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-white shadow-sm border border-gray-100 rounded-b-2xl">
        {/* ONE WAY */}
        {activeTab === 'oneway' && (
          <>
            {/* Pickup Location */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Pickup Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={pickupQuery}
                  onChange={(e) => handlePickupChange(e.target.value)}
                  onFocus={() => pickupSuggestions.length > 0 && setShowPickupDropdown(true)}
                  placeholder="Enter 4 letters to search location"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none transition-all"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 animate-spin" />
                )}
              </div>
              
              {/* Pickup Suggestions Dropdown */}
              {showPickupDropdown && pickupSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-lg border border-gray-100 max-h-60 overflow-y-auto">
                  {pickupSuggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => selectPickup(suggestion)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                    >
                      <div className="font-semibold text-sm text-gray-900">{suggestion.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{suggestion.city}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Drop Location */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Drop Location
              </label>
              <div className="relative">
                <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={dropQuery}
                  onChange={(e) => handleDropChange(e.target.value)}
                  onFocus={() => dropSuggestions.length > 0 && setShowDropDropdown(true)}
                  placeholder="Enter 4 letters to search location"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none transition-all"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 animate-spin" />
                )}
              </div>
              
              {/* Drop Suggestions Dropdown */}
              {showDropDropdown && dropSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-lg border border-gray-100 max-h-60 overflow-y-auto">
                  {dropSuggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => selectDrop(suggestion)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                    >
                      <div className="font-semibold text-sm text-gray-900">{suggestion.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{suggestion.city}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* When is driver needed */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                When is driver needed?
              </label>
              <select
                value={whenNeeded}
                onChange={(e) => setWhenNeeded(e.target.value as WhenNeeded)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none transition-all"
              >
                <option value="now">Now</option>
                <option value="schedule">Schedule for later</option>
              </select>
            </div>

            {whenNeeded === 'schedule' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Schedule Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={departureDateTime}
                  onChange={(e) => setDepartureDateTime(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none transition-all"
                />
              </div>
            )}

            {/* Select Vehicle */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Vehicle
              </label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {DEMO_CARS.map((car) => (
                  <button
                    key={car.id}
                    type="button"
                    onClick={() => setSelectedCar(car)}
                    className={`border-2 rounded-2xl p-3 cursor-pointer transition-all text-left ${
                      selectedCar.id === car.id
                        ? 'border-emerald-600 bg-emerald-50/60'
                        : 'border-gray-200 bg-white hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-2xl">{car.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-gray-900 truncate">{car.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {car.type} · {car.seats} seats · {car.transmission}
                        </div>
                        <div className="text-emerald-600 font-semibold text-sm mt-1">
                          From ₹{getLowestHourlyRate(car)}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                More vehicles available. Final car assigned based on availability.
              </p>
            </div>
          </>
        )}

        {/* ROUND TRIP */}
        {activeTab === 'roundtrip' && (
          <>
            {/* Pickup Location */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Pickup Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={pickupQuery}
                  onChange={(e) => handlePickupChange(e.target.value)}
                  onFocus={() => pickupSuggestions.length > 0 && setShowPickupDropdown(true)}
                  placeholder="Enter 4 letters to search location"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none transition-all"
                />
              </div>
              
              {showPickupDropdown && pickupSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-lg border border-gray-100 max-h-60 overflow-y-auto">
                  {pickupSuggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => selectPickup(suggestion)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                    >
                      <div className="font-semibold text-sm text-gray-900">{suggestion.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{suggestion.city}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Drop Location */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Drop Location
              </label>
              <div className="relative">
                <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={dropQuery}
                  onChange={(e) => handleDropChange(e.target.value)}
                  onFocus={() => dropSuggestions.length > 0 && setShowDropDropdown(true)}
                  placeholder="Enter 4 letters to search location"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none transition-all"
                />
              </div>
              
              {showDropDropdown && dropSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-lg border border-gray-100 max-h-60 overflow-y-auto">
                  {dropSuggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => selectDrop(suggestion)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                    >
                      <div className="font-semibold text-sm text-gray-900">{suggestion.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{suggestion.city}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Departure Date & Time */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Departure Date & Time
              </label>
              <input
                type="datetime-local"
                value={departureDateTime}
                onChange={(e) => setDepartureDateTime(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none transition-all"
              />
            </div>

            {/* Return Date & Time */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Return Date & Time
              </label>
              <input
                type="datetime-local"
                value={returnDateTime}
                onChange={(e) => setReturnDateTime(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none transition-all"
              />
            </div>

            {/* Select Vehicle */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Vehicle
              </label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {DEMO_CARS.map((car) => (
                  <button
                    key={car.id}
                    type="button"
                    onClick={() => setSelectedCar(car)}
                    className={`border-2 rounded-2xl p-3 cursor-pointer transition-all text-left ${
                      selectedCar.id === car.id
                        ? 'border-emerald-600 bg-emerald-50/60'
                        : 'border-gray-200 bg-white hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-2xl">{car.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-gray-900 truncate">{car.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {car.type} · {car.seats} seats · {car.transmission}
                        </div>
                        <div className="text-emerald-600 font-semibold text-sm mt-1">
                          From ₹{getLowestHourlyRate(car)}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                More vehicles available. Final car assigned based on availability.
              </p>
            </div>
          </>
        )}

        {/* OUTSTATION */}
        {activeTab === 'outstation' && (
          <>
            {/* Pickup City */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Pickup City
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={pickupQuery}
                  onChange={(e) => handlePickupChange(e.target.value)}
                  onFocus={() => pickupSuggestions.length > 0 && setShowPickupDropdown(true)}
                  placeholder="Enter 4 letters to search city"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none transition-all"
                />
              </div>
              
              {showPickupDropdown && pickupSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-lg border border-gray-100 max-h-60 overflow-y-auto">
                  {pickupSuggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => selectPickup(suggestion)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                    >
                      <div className="font-semibold text-sm text-gray-900">{suggestion.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{suggestion.city}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Destination City */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Destination City
              </label>
              <div className="relative">
                <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Enter destination city"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Departure Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Departure Date
              </label>
              <input
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none transition-all"
              />
            </div>

            {/* Number of Days */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Number of Days
              </label>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setNumberOfDays(Math.max(1, numberOfDays - 1))}
                  className="w-12 h-12 rounded-xl border-2 border-gray-300 font-bold text-xl hover:bg-gray-50 transition-colors"
                >
                  −
                </button>
                <div className="flex-1 text-center">
                  <div className="text-3xl font-bold text-gray-900">{numberOfDays}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {numberOfDays === 1 ? 'day' : 'days'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setNumberOfDays(numberOfDays + 1)}
                  className="w-12 h-12 rounded-xl border-2 border-gray-300 font-bold text-xl hover:bg-gray-50 transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Select Vehicle */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Vehicle
              </label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {DEMO_CARS.map((car) => (
                  <button
                    key={car.id}
                    type="button"
                    onClick={() => setSelectedCar(car)}
                    className={`border-2 rounded-2xl p-3 cursor-pointer transition-all text-left ${
                      selectedCar.id === car.id
                        ? 'border-emerald-600 bg-emerald-50/60'
                        : 'border-gray-200 bg-white hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-2xl">{car.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-gray-900 truncate">{car.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {car.type} · {car.seats} seats · {car.transmission}
                        </div>
                        <div className="text-emerald-600 font-semibold text-sm mt-1">
                          From ₹{getLowestHourlyRate(car)}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                More vehicles available. Final car assigned based on availability.
              </p>
            </div>
          </>
        )}

        {/* Distance & Price Display */}
        {((distance !== null && price !== null) || (activeTab === 'outstation' && price !== null)) && (
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 mt-4 shadow-sm">
            {isCalculating ? (
              <div className="flex items-center justify-center gap-2 text-emerald-700">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm font-semibold">Calculating...</span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 text-gray-700 mb-3">
                  <span className="text-xl">{selectedCar.emoji}</span>
                  <span className="font-bold text-gray-900">{selectedCar.name}</span>
                </div>
                {distance !== null && (
                  <div className="flex items-center gap-2 text-gray-700 mb-2">
                    <span className="text-lg">📍</span>
                    <span className="font-semibold">Distance:</span>
                    <span className="font-bold">{distance.toFixed(1)} km</span>
                    {activeTab === 'roundtrip' && (
                      <span className="text-xs text-gray-500">(2x one way)</span>
                    )}
                  </div>
                )}
                {activeTab === 'outstation' && (
                  <div className="flex items-center gap-2 text-gray-700 mb-2">
                    <span className="text-lg">⏱️</span>
                    <span className="font-semibold">{numberOfDays} {numberOfDays === 1 ? 'Day' : 'Days'}</span>
                  </div>
                )}
                <div className="border-t border-emerald-200 my-2"></div>
                <div className="flex items-center justify-between text-gray-700">
                  <span className="font-semibold">✅ Total:</span>
                  <span className="font-bold text-emerald-700 text-2xl">₹{price}</span>
                </div>
                <div className="text-xs text-gray-600 mt-2">
                  Car + Driver included
                </div>
              </>
            )}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-800 hover:to-emerald-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg hover:shadow-xl mt-6"
        >
          Book Now
        </button>

        {/* Trust Line */}
        <div className="text-xs text-gray-400 text-center mt-2">
          🔒 Verified drivers · Your safety is our priority · GST included
        </div>
      </form>
    </div>
  );
}

