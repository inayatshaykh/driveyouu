import { useState, useRef, useEffect, memo, useCallback } from 'react';
import { MapPin, Navigation, Loader2, X } from 'lucide-react';

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

// ── MOCK DATA (instant, no API, no freeze) ──────────────────────
const MOCK_LOCATIONS: LocationResult[] = [
  { name: 'Connaught Place, New Delhi', lat: 28.6315, lon: 77.2167 },
  { name: 'India Gate, New Delhi', lat: 28.6129, lon: 77.2295 },
  { name: 'IGI Airport T3, New Delhi', lat: 28.5562, lon: 77.1000 },
  { name: 'Cyber City, Gurugram', lat: 28.4950, lon: 77.0890 },
  { name: 'DLF Phase 3, Gurugram', lat: 28.5021, lon: 77.0910 },
  { name: 'Sector 18, Noida', lat: 28.5706, lon: 77.3272 },
  { name: 'Rajiv Chowk Metro, New Delhi', lat: 28.6328, lon: 77.2197 },
  { name: 'Saket, New Delhi', lat: 28.5244, lon: 77.2066 },
  { name: 'Dwarka Sector 21, New Delhi', lat: 28.5921, lon: 77.0460 },
  { name: 'Rohini, New Delhi', lat: 28.7496, lon: 77.0673 },
  { name: 'Karol Bagh, New Delhi', lat: 28.6519, lon: 77.1909 },
  { name: 'Vasant Kunj, New Delhi', lat: 28.5244, lon: 77.1580 },
  { name: 'Nehru Place, New Delhi', lat: 28.5494, lon: 77.2501 },
  { name: 'Chandigarh Railway Station', lat: 30.7333, lon: 76.7794 },
  { name: 'Sector 17, Chandigarh', lat: 30.7400, lon: 76.7840 },
  { name: 'Mohali Airport, Chandigarh', lat: 30.6735, lon: 76.7885 },
  { name: 'Sector 35, Chandigarh', lat: 30.7218, lon: 76.7780 },
  { name: 'Panchkula Sector 5', lat: 30.6942, lon: 76.8606 },
  { name: 'Aerocity, New Delhi', lat: 28.5562, lon: 77.1167 },
  { name: 'Noida Sector 62', lat: 28.6271, lon: 77.3714 },
  { name: 'Greater Noida', lat: 28.4744, lon: 77.5040 },
  { name: 'Ghaziabad Railway Station', lat: 28.6692, lon: 77.4538 },
  { name: 'Faridabad Old Station', lat: 28.4089, lon: 77.3178 },
  { name: 'Chandni Chowk, New Delhi', lat: 28.6506, lon: 77.2303 },
  { name: 'Lajpat Nagar, New Delhi', lat: 28.5677, lon: 77.2431 },
  { name: 'Hauz Khas, New Delhi', lat: 28.5494, lon: 77.2001 },
  { name: 'Gurugram Bus Stand', lat: 28.4595, lon: 77.0266 },
  { name: 'Manesar, Gurugram', lat: 28.3590, lon: 76.9350 },
  { name: 'Ambala City', lat: 30.3782, lon: 76.7767 },
  { name: 'Ludhiana Railway Station', lat: 30.9010, lon: 75.8573 },
];

// Pure sync filter — zero async, zero API, zero freeze
function filterLocations(query: string): LocationResult[] {
  if (query.length < 3) return [];
  const q = query.toLowerCase();
  return MOCK_LOCATIONS
    .filter(loc => loc.name.toLowerCase().includes(q))
    .slice(0, 6);
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
  placeholder = 'Type 3+ letters to search',
  icon = 'pickup',
}: LocationInputProps) {
  const [suggestions, setSuggestions] = useState<LocationResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
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

  // Pure sync change — no async, no API, no freeze
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    onValueChange(text);
    const results = filterLocations(text);
    setSuggestions(results);
    setShowDropdown(results.length > 0);
  }, [onValueChange]);

  const handleSelect = useCallback((s: LocationResult) => {
    onSelect({ address: s.name, lat: s.lat, lon: s.lon });
    onValueChange(s.name);
    setSuggestions([]);
    setShowDropdown(false);
  }, [onSelect, onValueChange]);

  const handleClear = useCallback(() => {
    onValueChange('');
    setSuggestions([]);
    setShowDropdown(false);
  }, [onValueChange]);

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
        {value.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 max-h-56 overflow-y-auto">
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
              <span className="text-sm text-gray-900">{s.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
});
