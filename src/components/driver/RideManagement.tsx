import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { MapPin, Navigation, Phone, IndianRupee } from 'lucide-react';
import { toast } from 'sonner';
import type { Booking } from '../../types';

export function RideManagement() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/driver/bookings', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch bookings');
      }

      setBookings(data.bookings);

      // Find active booking
      const active = data.bookings.find(
        (b: Booking) =>
          b.status === 'assigned' ||
          b.status === 'driver_en_route' ||
          b.status === 'in_progress'
      );
      setActiveBooking(active || null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch bookings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptBooking = async (bookingId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/driver/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bookingId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept booking');
      }

      toast.success('Booking accepted successfully');
      fetchBookings();
    } catch (error: any) {
      toast.error(error.message || 'Failed to accept booking');
    }
  };

  const formatBookingType = (type: string) => {
    const typeMap: Record<string, string> = {
      'on-demand': 'On-Demand',
      scheduled: 'Scheduled',
      hourly: 'Hourly',
      outstation: 'Outstation',
    };
    return typeMap[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      assigned: { label: 'Assigned', variant: 'default' },
      driver_en_route: { label: 'En Route', variant: 'default' },
      in_progress: { label: 'In Progress', variant: 'default' },
      completed: { label: 'Completed', variant: 'secondary' },
    };

    const statusInfo = statusMap[status] || statusMap.assigned;
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading rides...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Ride */}
      {activeBooking && (
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Active Ride</CardTitle>
              {getStatusBadge(activeBooking.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Booking Type</span>
              <span className="font-medium">
                {formatBookingType(activeBooking.bookingType)}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <MapPin className="mt-1 h-4 w-4 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Pickup</p>
                  <p className="text-sm text-muted-foreground">
                    {activeBooking.pickupLocation.address}
                  </p>
                </div>
              </div>

              {activeBooking.dropLocation && (
                <div className="flex items-start gap-2">
                  <MapPin className="mt-1 h-4 w-4 text-red-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Drop</p>
                    <p className="text-sm text-muted-foreground">
                      {activeBooking.dropLocation.address}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {activeBooking.fare && (
              <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-3">
                <span className="text-sm font-medium">Your Earnings</span>
                <div className="flex items-center gap-1 text-lg font-bold text-green-600">
                  <IndianRupee className="h-4 w-4" />
                  {activeBooking.fare.driverEarnings.toFixed(2)}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline">
                <Navigation className="mr-2 h-4 w-4" />
                Navigate
              </Button>
              <Button variant="outline">
                <Phone className="mr-2 h-4 w-4" />
                Call Customer
              </Button>
            </div>

            {activeBooking.status === 'assigned' && (
              <Button className="w-full">Start Trip</Button>
            )}

            {activeBooking.status === 'in_progress' && (
              <Button className="w-full">Complete Trip</Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Rides */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Recent Rides</h2>

        {bookings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Navigation className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No rides yet</p>
              <p className="text-sm text-muted-foreground">
                Your ride history will appear here
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {bookings
              .filter((b) => b.status === 'completed')
              .slice(0, 10)
              .map((booking) => (
                <Card key={booking.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {formatBookingType(booking.bookingType)}
                          </span>
                          {getStatusBadge(booking.status)}
                        </div>

                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {booking.pickupLocation.address}
                          </div>
                          {booking.dropLocation && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {booking.dropLocation.address}
                            </div>
                          )}
                        </div>

                        {booking.distance && (
                          <p className="text-sm text-muted-foreground">
                            {booking.distance.toFixed(1)} km
                          </p>
                        )}
                      </div>

                      {booking.fare && (
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-lg font-bold">
                            <IndianRupee className="h-4 w-4" />
                            {booking.fare.driverEarnings.toFixed(2)}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Your earnings
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
