import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { toast } from 'sonner';
import { MapPin, Calendar, Clock, Car } from 'lucide-react';
import type { BookingType, Location } from '../../types';

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

export function BookingFlow({ onBookingCreated }: BookingFlowProps) {
  const [step, setStep] = useState<'type' | 'details' | 'confirm'>('type');
  const [isLoading, setIsLoading] = useState(false);
  const [estimatedFare, setEstimatedFare] = useState<number | null>(null);

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      bookingType: 'on-demand',
    },
  });

  const bookingType = form.watch('bookingType');

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
              <div className="space-y-2">
                <Label htmlFor="pickupAddress">Pickup Location</Label>
                <div className="flex gap-2">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <input
                    id="pickupAddress"
                    type="text"
                    placeholder="Enter pickup address"
                    className="flex-1 rounded-md border px-3 py-2"
                    {...form.register('pickupAddress')}
                  />
                </div>
                {form.formState.errors.pickupAddress && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.pickupAddress.message}
                  </p>
                )}
              </div>

              {/* Drop Location (not for hourly) */}
              {bookingType !== 'hourly' && (
                <div className="space-y-2">
                  <Label htmlFor="dropAddress">Drop Location</Label>
                  <div className="flex gap-2">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <input
                      id="dropAddress"
                      type="text"
                      placeholder="Enter drop address"
                      className="flex-1 rounded-md border px-3 py-2"
                      {...form.register('dropAddress')}
                    />
                  </div>
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
