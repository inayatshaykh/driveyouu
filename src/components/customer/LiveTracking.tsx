import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { MapPin, Navigation, Phone, Share2, AlertCircle } from 'lucide-react';
import { SOSAlert } from './SOSAlert';
import type { Booking } from '../../types';

interface LiveTrackingProps {
  booking: Booking;
  onShare?: () => void;
}

export function LiveTracking({ booking, onShare }: LiveTrackingProps) {
  const [eta, setEta] = useState<string>('15 mins');
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  
  // Mock connection status for now
  const isConnected = false;
  const driverLocation = null;

  const getStatusBadge = () => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      pending: { label: 'Finding Driver', variant: 'secondary' },
      assigned: { label: 'Driver Assigned', variant: 'default' },
      driver_en_route: { label: 'Driver Arriving', variant: 'default' },
      in_progress: { label: 'Trip in Progress', variant: 'default' },
      completed: { label: 'Completed', variant: 'secondary' },
      cancelled: { label: 'Cancelled', variant: 'destructive' },
    };

    const status = statusMap[booking.status] || statusMap.pending;
    return <Badge variant={status.variant}>{status.label}</Badge>;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Live Tracking</CardTitle>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Map Placeholder */}
          <div className="h-[400px] w-full rounded-lg border bg-slate-100 flex items-center justify-center">
            <p className="text-slate-500">🗺️ Live map coming soon</p>
          </div>

          {/* ETA Info */}
          {driverLocation && (
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <Navigation className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">
                    {booking.status === 'driver_en_route'
                      ? 'Driver arriving in'
                      : 'Reaching destination in'}
                  </p>
                  <p className="text-2xl font-bold">{eta}</p>
                </div>
              </div>
              {isConnected && (
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-green-600" />
                  Live
                </div>
              )}
            </div>
          )}

          {/* Trip Details */}
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <MapPin className="mt-1 h-4 w-4 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Pickup</p>
                <p className="text-sm text-muted-foreground">
                  {booking.pickupLocation.address}
                </p>
              </div>
            </div>

            {booking.dropLocation && (
              <div className="flex items-start gap-2">
                <MapPin className="mt-1 h-4 w-4 text-red-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Drop</p>
                  <p className="text-sm text-muted-foreground">
                    {booking.dropLocation.address}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={onShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Share Trip
            </Button>
            <Button variant="destructive" onClick={() => setIsSOSOpen(true)}>
              <AlertCircle className="mr-2 h-4 w-4" />
              SOS
            </Button>
          </div>

          {/* Driver Contact (if assigned) */}
          {booking.driverId && (
            <Button variant="outline" className="w-full">
              <Phone className="mr-2 h-4 w-4" />
              Call Driver
            </Button>
          )}
        </CardContent>
      </Card>

      {/* SOS Alert Dialog */}
      <SOSAlert
        booking={booking}
        isOpen={isSOSOpen}
        onClose={() => setIsSOSOpen(false)}
      />
    </div>
  );
}
