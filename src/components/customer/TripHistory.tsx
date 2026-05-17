import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { MapPin, Calendar, IndianRupee, Download } from 'lucide-react';
import { toast } from 'sonner';
import type { Booking } from '../../types';

export function TripHistory() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/customer/bookings', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch bookings');
      }

      setBookings(data.bookings);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch bookings');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      pending: { label: 'Pending', variant: 'secondary' },
      assigned: { label: 'Assigned', variant: 'default' },
      driver_en_route: { label: 'En Route', variant: 'default' },
      in_progress: { label: 'In Progress', variant: 'default' },
      completed: { label: 'Completed', variant: 'secondary' },
      cancelled: { label: 'Cancelled', variant: 'destructive' },
    };

    const statusInfo = statusMap[status] || statusMap.pending;
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading bookings...</p>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">No bookings yet</p>
          <p className="text-sm text-muted-foreground">
            Your trip history will appear here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Trip History</h2>

      <div className="space-y-4">
        {bookings.map((booking) => (
          <Card key={booking.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">
                    {formatBookingType(booking.bookingType)}
                  </CardTitle>
                  {getStatusBadge(booking.status)}
                </div>
                {booking.fare && (
                  <div className="flex items-center gap-1 text-lg font-semibold">
                    <IndianRupee className="h-4 w-4" />
                    {booking.fare.totalFare.toFixed(2)}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Date */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {formatDate(booking.createdAt)}
              </div>

              {/* Locations */}
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Pickup</p>
                    <p className="text-sm text-muted-foreground">
                      {booking.pickupLocation.address}
                    </p>
                  </div>
                </div>

                {booking.dropLocation && (
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 text-red-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Drop</p>
                      <p className="text-sm text-muted-foreground">
                        {booking.dropLocation.address}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Trip Details */}
              {booking.distance && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Distance</span>
                  <span className="font-medium">{booking.distance.toFixed(1)} km</span>
                </div>
              )}

              {booking.estimatedDuration && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium">{booking.estimatedDuration} mins</span>
                </div>
              )}

              {/* Fare Breakdown */}
              {booking.fare && booking.status === 'completed' && (
                <div className="space-y-1 border-t pt-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Base Fare</span>
                    <span>₹{booking.fare.baseFare.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Distance Charge</span>
                    <span>₹{booking.fare.distanceCharge.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Time Charge</span>
                    <span>₹{booking.fare.timeCharge.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">GST (18%)</span>
                    <span>₹{booking.fare.gst.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t pt-1 font-semibold">
                    <span>Total</span>
                    <span>₹{booking.fare.totalFare.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Actions */}
              {booking.status === 'completed' && (
                <Button variant="outline" size="sm" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Download Receipt
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
