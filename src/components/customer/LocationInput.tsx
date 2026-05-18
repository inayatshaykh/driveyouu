import { useState, useRef, useEffect, memo, useCallback } from 'react';
import { MapPin, Navigation, Loader2 } from 'lucide-react';

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

// Mock locations for demo (to avoid API rate limits and freezing)
const MOCK_LOCATIONS: LocationResult[] = [
  { name: 'Connaught Place, New Delhi', lat: 28.6315, lon: 77.2167 },
  { name: 'India Gate, New Delhi', lat: 28.6129, lon: 77.2295 },
  { name: 'Cyber City, Gurgaon', lat: 28.4950, lon: 77.0890 },
  { name: 'DLF Phase 3, Gurgaon', lat: 28.5021, lon: 77.0910 },
  { name: 'Sector 18, Noida', lat: 28.5706, lon: 77.3272 },
  { name: 'Greater Noida', lat: 28.4744, lon: 77.5040 },
  { name: 'Rajiv Chowk, Delhi', lat: 28.6328, lon: 77.2197 },
  { name: 'Saket, Delhi', lat: 28.5244, lon: 77.2066 },
  { name: 'Dwarka, Delhi', lat: 28.5921, lon: 77.0460 },
  { name: 'Rohini, Delhi', lat: 28.7496, lon: 77.0673 },
  { name: 'Karol Bagh, Delhi', lat: 28.6519, lon: 77.1909 },
  { name: 'Vasant Kunj, Delhi', lat: 28.5244, lon: 77.1580 },
  { name: 'Nehru Place, Delhi', lat: 28.5494, lon: 77.2501 },
  { name: 'IGI Airport, Delhi', lat: 28.5562, lon: 77.1000 },
  { name: 'Noida Sector 62', lat: 28.6271, lon: 77.3714 },
  { name: 'Ghaziabad', lat: 28.6692, lon: 77.4538 },
  { name: 'Faridabad', lat: 28.4089, lon: 77.3178 },
  { name: 'Chandni Chowk, Delhi', lat: 28.6506, lon: 77.2303 },
  { name: 'Lajpat Nagar, Delhi', lat: 28.5677, lon: 77.2431 },
  { name: 'Hauz Khas, Delhi', lat: 28.5494, lon: 77.2001 },
];

async function searchLocation(query: string): Promise<LocationResult[]> {
  if (query.length < 3) return [];
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Filter mock locations based on query
  const lowerQuery = query.toLowerCase();
  const filtered = MOCK_LOCATIONS.filter(loc => 
    loc.name.toLowerCase().includes(lowerQuery)
  );
  
  return filtered.slice(0, 5);
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
  placeholder = 'Enter 3 letters to search location',
  icon = 'pickup',
}: LocationInputProps) {
  const [suggestions, setSuggestions] = useState<LocationResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = useCallback((text: string) => {
    onValueChange(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchLocation(text);
        setSuggestions(results.slice(0, 5));
        setShowDropdown(results.length > 0);
      } catch {
        setSuggestions([]);
        setShowDropdown(false);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, [onValueChange]);

  const Icon = icon === 'drop' ? Navigation : MapPin;

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none transition-all text-base"
          autoComplete="off"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 animate-spin" />
        )}
      </div>
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-lg border border-gray-100 max-h-60 overflow-y-auto">
          {suggestions.map((s, idx) => (
            <button
              key={`${s.lat}-${s.lon}-${idx}`}
              type="button"
              onClick={() => {
                onSelect({ address: s.name, lat: s.lat, lon: s.lon });
                onValueChange(s.name);
                setShowDropdown(false);
              }}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
            >
              <span className="font-semibold text-sm text-gray-900">{s.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
});
