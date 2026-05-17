import { useState, useRef, useEffect } from 'react';
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

async function searchLocation(query: string): Promise<LocationResult[]> {
  if (query.length < 4) return [];
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=in`,
    { headers: { 'Accept-Language': 'en' } }
  );
  const data = await res.json();
  return data.map((item: { display_name: string; lat: string; lon: string }) => ({
    name: item.display_name.split(',').slice(0, 2).join(','),
    lat: parseFloat(item.lat),
    lon: parseFloat(item.lon),
  }));
}

interface LocationInputProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  onSelect: (location: SelectedLocation) => void;
  placeholder?: string;
  icon?: 'pickup' | 'drop';
}

export function LocationInput({
  label,
  value,
  onValueChange,
  onSelect,
  placeholder = 'Enter 4 letters to search location',
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

  const handleChange = (text: string) => {
    onValueChange(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.length < 4) {
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
    }, 500);
  };

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
}
