import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { toast } from 'sonner';
import { MapPin, Calendar, Clock, Car, Loader2 } from 'lucide-react';
import type { BookingType, Location } from '../../types';

interface LocationSuggestion {
  name: string;
  lat: number;
  lon: number;
}

const bookingSchema = z.object({
  bookingType: z.enum(['on-demand', 'scheduled', 'hourly', 'outstation']),
  vehicleProfileId: z.string().uuid('Please select a vehicle'),
  pickupAddress: z.string().min(1, 'Pickup location is required'),
  dropAddress: z.string().optional(),
  scheduledTime: z.string().optional(),
  duration: z.number().optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface BookingFlowProps {
  onBookingCreated?: (bookingId: string) => void;
}

const SuggestionDropdown = memo(({ 
  suggestions, 
  onSelect 
}: { 
  suggestions: LocationSuggestion[]; 
  onSelect: (suggestion: LocationSuggestion) => void;
}) => (
  <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
    {suggestions.map((suggestion, idx) => (
      <button
        key={`${suggestion.lat}-${suggestion.lon}-${idx}`}
        type="button"
        onClick={() => onSelect(suggestion)}
        className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
      >
        <div className="font-semibold text-sm text-gray-900">{suggestion.name}</div>
      </button>
    ))}
  </div>
));

SuggestionDropdown.displayName = 'SuggestionDropdown';

export function BookingFlow({ onBookingCreated }: BookingFlowProps) {
  const [step, setStep] = useState<'type' | 'details' | 'confirm'>('type');
  const [isLoading, setIsLoading] = useState(false);
  const [estimatedFare, setEstimatedFare] = useState<number | null>(null);
  
  // Location autocomplete states
  const [pickupQuery, setPickupQuery] = useState('');
  const [dropQuery, setDropQuery] = useState('');
  const [pickupSuggestions, setPickupSuggestions] = useState<LocationSuggestion[]>([]);
  const [dropSuggestions, setDropSuggestions] = useState<LocationSuggestion[]>([]);
  const [showPickupDropdown, setShowPickupDropdown] = useState(false);
  const [showDropDropdown, setShowDropDropdown] = useState(false);
  const [isSearchingPickup, setIsSearchingPickup] = useState(false);
  const [isSearchingDrop, setIsSearchingDrop] = useState(false);
  
  // Refs for debouncing and abort control
  const pickupDebounceRef = useRef<NodeJS.Timeout>();
  const dropDebounceRef = useRef<NodeJS.Timeout>();
  const pickupAbortRef = useRef<AbortController>();
  const dropAbortRef = useRef<AbortController>();
  const pickupSearchIdRef = useRef(0);
  const dropSearchIdRef = useRef(0);
  const isMountedRef = useRef(true);

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      bookingType: 'on-demand',
    },
  });

  const bookingType = form.watch('bookingType');

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (pickupDebounceRef.current) clearTimeout(pickupDebounceRef.current);
      if (dropDebounceRef.current) clearTimeout(dropDebounceRef.current);
      if (pickupAbortRef.current) pickupAbortRef.current.abort();
      if (dropAbortRef.current) dropAbortRef.current.abort();
    };
  }, []);

  // Search locations using Nominatim API with AbortController
  const searchLocation = useCallback(async (query: string, signal: AbortSignal) => {
    if (query.length < 5) return [];
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=in`,
      { 
        headers: { 'Accept-Language': 'en' },
        signal 
      }
    );
    const data = await res.json();
    return data.map((item: any) => ({
      name: item.display_name.split(',').slice(0, 2).join(','),
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
    }));
  }, []);

  // Debounced search handlers with AbortController and RAF
  const handlePickupChange = useCallback((value: string) => {
    setPickupQuery(value);
    
    // Clear existing timeout
    if (pickupDebounceRef.current) {
      clearTimeout(pickupDebounceRef.current);
      pickupDebounceRef.current = undefined;
    }
    
    // Abort previous request
    if (pickupAbortRef.current) {
      pickupAbortRef.current.abort();
    }
    
    if (value.length < 5) {
      // Use RAF to batch state updates
      requestAnimationFrame(() => {
        if (isMountedRef.current) {
          setPickupSuggestions([]);
          setShowPickupDropdown(false);
          setIsSearchingPickup(false);
        }
      });
      return;
    }
    
    const currentSearchId = ++pickupSearchIdRef.current;
    setIsSearchingPickup(true);
    
    pickupDebounceRef.current = setTimeout(async () => {
      pickupAbortRef.current = new AbortController();
      
      try {
        const suggestions = await searchLocation(value, pickupAbortRef.current.signal);
        
        if (currentSearchId === pickupSearchIdRef.current && isMountedRef.current) {
          // Use RAF to batch dropdown updates
          requestAnimationFrame(() => {
            if (isMountedRef.current) {
              setPickupSuggestions(suggestions);
              setShowPickupDropdown(suggestions.length > 0);
              setIsSearchingPickup(false);
            }
          });
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Error searching location:', error);
        }
        if (currentSearchId === pickupSearchIdRef.current && isMountedRef.current) {
          requestAnimationFrame(() => {
            if (isMountedRef.current) {
              setIsSearchingPickup(false);
            }
          });
        }
      }
    }, 500);
  }, [searchLocation]);

  const handleDropChange = useCallback((value: string) => {
    setDropQuery(value);
    
    // Clear existing timeout
    if (dropDebounceRef.current) {
      clearTimeout(dropDebounceRef.current);
      dropDebounceRef.current = undefined;
    }
    
    // Abort previous request
    if (dropAbortRef.current) {
      dropAbortRef.current.abort();
    }
    
    if (value.length < 5) {
      // Use RAF to batch state updates
      requestAnimationFrame(() => {
        if (isMountedRef.current) {
          setDropSuggestions([]);
          setShowDropDropdown(false);
          setIsSearchingDrop(false);
        }
      });
      return;
    }
    
    const currentSearchId = ++dropSearchIdRef.current;
    setIsSearchingDrop(true);
    
    dropDebounceRef.current = setTimeout(async () => {
      dropAbortRef.current = new AbortController();
      
      try {
        const suggestions = await searchLocation(value, dropAbortRef.current.signal);
        
        if (currentSearchId === dropSearchIdRef.current && isMountedRef.current) {
          // Use RAF to batch dropdown updates
          requestAnimationFrame(() => {
            if (isMountedRef.current) {
              setDropSuggestions(suggestions);
              setShowDropDropdown(suggestions.length > 0);
              setIsSearchingDrop(false);
            }
          });
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Error searching location:', error);
        }
        if (currentSearchId === dropSearchIdRef.current && isMountedRef.current) {
          requestAnimationFrame(() => {
            if (isMountedRef.current) {
              setIsSearchingDrop(false);
            }
          });
        }
      }
    }, 500);
  }, [searchLocation]);

  // Memoized onFocus handlers to prevent rerender spam
  const handlePickupFocus = useCallback(() => {
    if (pickupSuggestions.length > 0) {
      requestAnimationFrame(() => {
        if (isMountedRef.current) {
          setShowPickupDropdown(true);
        }
      });
    }
  }, [pickupSuggestions.length]);

  const handleDropFocus = useCallback(() => {
    if (dropSuggestions.length > 0) {
      requestAnimationFrame(() => {
        if (isMountedRef.current) {
          setShowDropDropdown(true);
        }
      });
    }
  }, [dropSuggestions.length]);

  // Select location from suggestions - only update form on selection
  const selectPickup = useCallback((suggestion: LocationSuggestion) => {
    setPickupQuery(suggestion.name);
    form.setValue('pickupAddress', suggestion.name, { shouldValidate: true });
    setShowPickupDropdown(false);
  }, [form]);

  const selectDrop = useCallback((suggestion: LocationSuggestion) => {
    setDropQuery(suggestion.name);
    form.setValue('dropAddress', suggestion.name, { shouldValidate: true });
    setShowDropDropdown(false);
  }, [form]);

  const handleCreateBooking = async (data: BookingFormData) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      
      // Mock location data - in production, use Google Maps API
      const pickupLocation: Location = {
        latitude: 28.6139,
        longitude: 77.2090,
        address: data.pickupAddress,
      };

      const dropLocation: Location | undefined = data.dropAddress
        ? {
            latitude: 28.7041,
            longitude: 77.1025,
            address: data.dropAddress,
          }
        : undefined;

      const response = await fetch('/api/customer/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          vehicleProfileId: data.vehicleProfileId,
          bookingType: data.bookingType,
          pickupLocation,
          dropLocation,
          scheduledTime: data.scheduledTime,
          duration: data.duration,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create booking');
      }

      toast.success('Booking created successfully!');
      onBookingCreated?.(result.booking.id);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create booking');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step 1: Select Booking Type */}
      {step === 'type' && (
        <Card>
          <CardHeader>
            <CardTitle>Select Booking Type</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={bookingType}
              onValueChange={(value) =>
                form.setValue('bookingType', value as BookingType)
              }
              className="grid grid-cols-1 gap-4 sm:grid-cols-2"
            >
              <Label
                htmlFor="on-demand"
                className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-muted p-4 hover:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <RadioGroupItem value="on-demand" id="on-demand" className="sr-only" />
                <Car className="h-8 w-8" />
                <div className="text-center">
                  <div className="font-semibold">On-Demand</div>
                  <div className="text-sm text-muted-foreground">
                    Get a driver now
                  </div>
                </div>
              </Label>

              <Label
                htmlFor="scheduled"
                className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-muted p-4 hover:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <RadioGroupItem value="scheduled" id="scheduled" className="sr-only" />
                <Calendar className="h-8 w-8" />
                <div className="text-center">
                  <div className="font-semibold">Scheduled</div>
                  <div className="text-sm text-muted-foreground">
                    Book for later
                  </div>
                </div>
              </Label>

              <Label
                htmlFor="hourly"
                className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-muted p-4 hover:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <RadioGroupItem value="hourly" id="hourly" className="sr-only" />
                <Clock className="h-8 w-8" />
                <div className="text-center">
                  <div className="font-semibold">Hourly</div>
                  <div className="text-sm text-muted-foreground">
                    2hr / 4hr / 8hr
                  </div>
                </div>
              </Label>

              <Label
                htmlFor="outstation"
                className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-muted p-4 hover:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <RadioGroupItem value="outstation" id="outstation" className="sr-only" />
                <MapPin className="h-8 w-8" />
                <div className="text-center">
                  <div className="font-semibold">Outstation</div>
                  <div className="text-sm text-muted-foreground">
                    Long distance
                  </div>
                </div>
              </Label>
            </RadioGroup>

            <Button onClick={() => setStep('details')} className="mt-6 w-full">
              Continue
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Enter Details */}
      {step === 'details' && (
        <Card>
          <CardHeader>
            <CardTitle>Booking Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(handleCreateBooking)} className="space-y-4">
              {/* Pickup Location */}
              <div className="space-y-2 relative">
                <Label htmlFor="pickupAddress">Pickup Location</Label>
                <div className="flex gap-2 relative">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <input
                    id="pickupAddress"
                    type="text"
                    value={pickupQuery}
                    onChange={(e) => handlePickupChange(e.target.value)}
                    onFocus={handlePickupFocus}
                    placeholder="Enter 5 letters to search location"
                    className="flex-1 rounded-md border px-3 py-2"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    inputMode="search"
                  />
                  {isSearchingPickup && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground animate-spin pointer-events-none" />
                  )}
                </div>
                {form.formState.errors.pickupAddress && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.pickupAddress.message}
                  </p>
                )}
                
                {/* Pickup Suggestions Dropdown */}
                {showPickupDropdown && pickupSuggestions.length > 0 && (
                  <SuggestionDropdown 
                    suggestions={pickupSuggestions}
                    onSelect={selectPickup}
                  />
                )}
              </div>

              {/* Drop Location (not for hourly) */}
              {bookingType !== 'hourly' && (
                <div className="space-y-2 relative">
                  <Label htmlFor="dropAddress">Drop Location</Label>
                  <div className="flex gap-2 relative">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <input
                      id="dropAddress"
                      type="text"
                      value={dropQuery}
                      onChange={(e) => handleDropChange(e.target.value)}
                      onFocus={handleDropFocus}
                      placeholder="Enter 5 letters to search location"
                      className="flex-1 rounded-md border px-3 py-2"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      inputMode="search"
                    />
                    {isSearchingDrop && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground animate-spin pointer-events-none" />
                    )}
                  </div>
                  
                  {/* Drop Suggestions Dropdown */}
                  {showDropDropdown && dropSuggestions.length > 0 && (
                    <SuggestionDropdown 
                      suggestions={dropSuggestions}
                      onSelect={selectDrop}
                    />
                  )}
                </div>
              )}

              {/* Scheduled Time */}
              {bookingType === 'scheduled' && (
                <div className="space-y-2">
                  <Label htmlFor="scheduledTime">Scheduled Time</Label>
                  <input
                    id="scheduledTime"
                    type="datetime-local"
                    className="w-full rounded-md border px-3 py-2"
                    {...form.register('scheduledTime')}
                  />
                </div>
              )}

              {/* Duration for hourly */}
              {bookingType === 'hourly' && (
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (hours)</Label>
                  <select
                    id="duration"
                    className="w-full rounded-md border px-3 py-2"
                    {...form.register('duration', { valueAsNumber: true })}
                  >
                    <option value={120}>2 Hours</option>
                    <option value={240}>4 Hours</option>
                    <option value={480}>8 Hours</option>
                  </select>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('type')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? 'Creating...' : 'Create Booking'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
