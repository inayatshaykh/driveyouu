import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { MapPin, Navigation, Phone, Share2, AlertCircle } from 'lucide-react';
import { useBookingTracking } from '../../hooks/useWebSocket';
import { SOSAlert } from './SOSAlert';
import type { Booking, Coordinates } from '../../types';

interface LiveTrackingProps {
  booking: Booking;
  onShare?: () => void;
}

export function LiveTracking({ booking, onShare }: LiveTrackingProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [driverMarker, setDriverMarker] = useState<google.maps.Marker | null>(null);
  const [eta, setEta] = useState<string>('Calculating...');
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  
  // Use WebSocket hook for real-time updates
  const { driverLocation, bookingStatus, isConnected } = useBookingTracking(booking.id);

  // Initialize Google Maps
  useEffect(() => {
    if (!mapRef.current || map) return;

    const initMap = () => {
      const googleMap = new google.maps.Map(mapRef.current!, {
        center: {
          lat: booking.pickupLocation.latitude,
          lng: booking.pickupLocation.longitude,
        },
        zoom: 14,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      });

      // Add pickup marker
      new google.maps.Marker({
        position: {
          lat: booking.pickupLocation.latitude,
          lng: booking.pickupLocation.longitude,
        },
        map: googleMap,
        title: 'Pickup Location',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#22c55e',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
        },
      });

      // Add drop marker if exists
      if (booking.dropLocation) {
        new google.maps.Marker({
          position: {
            lat: booking.dropLocation.latitude,
            lng: booking.dropLocation.longitude,
          },
          map: googleMap,
          title: 'Drop Location',
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#ef4444',
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 2,
          },
        });
      }

      setMap(googleMap);
    };

    // Load Google Maps script if not already loaded
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY'}&libraries=geometry`;
      script.async = true;
      script.onload = initMap;
      document.head.appendChild(script);
    } else {
      initMap();
    }
  }, [booking, map]);

  // WebSocket connection status indicator
  useEffect(() => {
    if (isConnected) {
      console.log('✅ Real-time tracking active');
    }
  }, [isConnected]);

  // Update driver marker when location changes
  useEffect(() => {
    if (driverLocation && map) {
      updateDriverMarker({
        latitude: driverLocation.latitude,
        longitude: driverLocation.longitude,
      });
      calculateETA({
        latitude: driverLocation.latitude,
        longitude: driverLocation.longitude,
      });
    }
  }, [driverLocation, map]);

  const updateDriverMarker = (location: Coordinates) => {
    if (!map) return;

    if (driverMarker) {
      driverMarker.setPosition({
        lat: location.latitude,
        lng: location.longitude,
      });
    } else {
      const marker = new google.maps.Marker({
        position: {
          lat: location.latitude,
          lng: location.longitude,
        },
        map,
        title: 'Driver Location',
        icon: {
          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 5,
          fillColor: '#3b82f6',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
        },
      });
      setDriverMarker(marker);
    }

    // Center map on driver
    map.panTo({
      lat: location.latitude,
      lng: location.longitude,
    });
  };

  const calculateETA = (driverLoc: Coordinates) => {
    if (!window.google) return;

    const targetLocation =
      booking.status === 'driver_en_route'
        ? booking.pickupLocation
        : booking.dropLocation || booking.pickupLocation;

    const service = new google.maps.DistanceMatrixService();
    service.getDistanceMatrix(
      {
        origins: [{ lat: driverLoc.latitude, lng: driverLoc.longitude }],
        destinations: [
          { lat: targetLocation.latitude, lng: targetLocation.longitude },
        ],
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (response, status) => {
        if (status === 'OK' && response) {
          const result = response.rows[0].elements[0];
          if (result.status === 'OK') {
            setEta(result.duration.text);
          }
        }
      }
    );
  };

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
          {/* Map */}
          <div
            ref={mapRef}
            className="h-[400px] w-full rounded-lg border bg-muted"
          />

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
