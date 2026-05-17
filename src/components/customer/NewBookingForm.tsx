import { useState, useEffect, useRef } from 'react';
import { MapPin, Calendar, Car, Loader2, Navigation } from 'lucide-react';
import { toast } from 'sonner';

type TabType = 'oneway' | 'roundtrip' | 'outstation';
type CarType = 'sedan' | 'suv' | 'hatchback';
type WhenNeeded = 'now' | 'schedule';

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

export function NewBookingForm() {
  const [activeTab, setActiveTab] = useState<TabType>('oneway');
  const [carType, setCarType] = useState<CarType>('sedan');
  const [whenNeeded, setWhenNeeded] = useState<WhenNeeded>('now');
  const [numberOfDays, setNumberOfDays] = useState(1);

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

      // Calculate price
      let calculatedPrice = 0;
      if (activeTab === 'oneway') {
        calculatedPrice = BASE_FARE + dist * PER_KM_RATE;
      } else if (activeTab === 'roundtrip') {
        calculatedPrice = BASE_FARE + dist * PER_KM_RATE * ROUND_TRIP_MULTIPLIER;
      }
      setPrice(roundPrice(calculatedPrice));
      
      setTimeout(() => setIsCalculating(false), 300);
    } else if (activeTab === 'outstation') {
      // For outstation, price is per day
      setDistance(null);
      setPrice(roundPrice(OUTSTATION_PER_DAY * numberOfDays));
    } else {
      setDistance(null);
      setPrice(null);
    }
  }, [selectedPickup, selectedDrop, activeTab, numberOfDays]);

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
    <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-6 text-center">
        <h2 className="text-2xl font-bold">Book Your Ride</h2>
        <p className="text-sm text-green-50 mt-1">
          We provide the vehicle + driver — you just show up.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('oneway')}
          className={`flex-1 py-4 text-sm font-semibold transition-all ${
            activeTab === 'oneway'
              ? 'border-b-2 border-green-600 text-green-600'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          One Way
        </button>
        <button
          onClick={() => setActiveTab('roundtrip')}
          className={`flex-1 py-4 text-sm font-semibold transition-all ${
            activeTab === 'roundtrip'
              ? 'border-b-2 border-green-600 text-green-600'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Round Trip
        </button>
        <button
          onClick={() => setActiveTab('outstation')}
          className={`flex-1 py-4 text-sm font-semibold transition-all ${
            activeTab === 'outstation'
              ? 'border-b-2 border-green-600 text-green-600'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Outstation
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
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
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none transition-all"
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
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none transition-all"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none transition-all"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none transition-all"
                />
              </div>
            )}

            {/* Car Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Car Type
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['sedan', 'suv', 'hatchback'] as CarType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setCarType(type)}
                    className={`py-3 px-4 rounded-xl border-2 font-semibold text-sm capitalize transition-all ${
                      carType === type
                        ? 'border-green-600 bg-green-50 text-green-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
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
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none transition-all"
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
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none transition-all"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none transition-all"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none transition-all"
              />
            </div>

            {/* Car Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Car Type
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['sedan', 'suv', 'hatchback'] as CarType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setCarType(type)}
                    className={`py-3 px-4 rounded-xl border-2 font-semibold text-sm capitalize transition-all ${
                      carType === type
                        ? 'border-green-600 bg-green-50 text-green-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
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
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none transition-all"
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
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none transition-all"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none transition-all"
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

            {/* Car Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Car Type
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['sedan', 'suv', 'hatchback'] as CarType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setCarType(type)}
                    className={`py-3 px-4 rounded-xl border-2 font-semibold text-sm capitalize transition-all ${
                      carType === type
                        ? 'border-green-600 bg-green-50 text-green-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Distance & Price Display */}
        {((distance !== null && price !== null) || (activeTab === 'outstation' && price !== null)) && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mt-4">
            {isCalculating ? (
              <div className="flex items-center justify-center gap-2 text-green-700">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm font-semibold">Calculating...</span>
              </div>
            ) : (
              <>
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
                <div className="flex items-center gap-2 text-gray-700">
                  <span className="text-lg">💰</span>
                  <span className="font-semibold">Estimated Fare:</span>
                  <span className="font-bold text-green-700 text-xl">₹{price}</span>
                </div>
                <div className="text-xs text-gray-600 mt-2">
                  (Inclusive of driver + vehicle)
                </div>
              </>
            )}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl mt-6"
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
