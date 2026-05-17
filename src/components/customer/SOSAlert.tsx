import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { AlertCircle, Phone, MapPin, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { Booking } from '../../types';

interface SOSAlertProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
}

export function SOSAlert({ booking, isOpen, onClose }: SOSAlertProps) {
  const [isTriggering, setIsTriggering] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [sosTriggered, setSosTriggered] = useState(false);
  const [sosId, setSosId] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Get current location
  useEffect(() => {
    if (isOpen && !currentLocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Failed to get location:', error);
          toast.error('Failed to get your location');
        }
      );
    }
  }, [isOpen, currentLocation]);

  // Countdown timer
  useEffect(() => {
    if (isTriggering && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (isTriggering && countdown === 0) {
      triggerSOS();
    }
  }, [isTriggering, countdown]);

  const handleSOSClick = () => {
    setIsTriggering(true);
    setCountdown(5);
  };

  const handleCancel = () => {
    setIsTriggering(false);
    setCountdown(5);
  };

  const triggerSOS = async () => {
    try {
      const token = localStorage.getItem('auth_token');

      if (!currentLocation) {
        throw new Error('Location not available');
      }

      const response = await fetch('/api/customer/sos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookingId: booking.id,
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to trigger SOS');
      }

      setSosId(data.sosAlert.id);
      setSosTriggered(true);
      setIsTriggering(false);

      toast.success('SOS Alert Triggered!', {
        description: 'Emergency contacts and authorities have been notified.',
      });

      // Notify emergency contacts
      notifyEmergencyContacts();
    } catch (error: any) {
      console.error('SOS trigger error:', error);
      toast.error(error.message || 'Failed to trigger SOS');
      setIsTriggering(false);
    }
  };

  const notifyEmergencyContacts = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      await fetch('/api/customer/sos/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookingId: booking.id,
          sosId,
        }),
      });
    } catch (error) {
      console.error('Failed to notify emergency contacts:', error);
    }
  };

  const handleResolveSOS = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/customer/sos/${sosId}/resolve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resolve SOS');
      }

      toast.success('SOS Alert Resolved');
      setSosTriggered(false);
      setSosId(null);
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to resolve SOS');
    }
  };

  const callEmergency = () => {
    // Get emergency contacts from customer profile
    // For now, show a message to add emergency contacts
    toast.info('Please add emergency contacts in your profile settings');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-6 w-6" />
            Emergency SOS
          </DialogTitle>
          <DialogDescription>
            {sosTriggered
              ? 'Your emergency alert is active'
              : 'Trigger an emergency alert to notify authorities and your emergency contacts'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!sosTriggered && !isTriggering && (
            <>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Only use this feature in case of a real emergency. False alarms may result in
                  account suspension.
                </AlertDescription>
              </Alert>

              <div className="space-y-2 rounded-lg border p-4">
                <h4 className="font-medium">What happens when you trigger SOS?</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 text-green-600" />
                    <span>Your emergency contacts will be notified via SMS</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 text-green-600" />
                    <span>Your live location will be shared</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 text-green-600" />
                    <span>Admin team will be alerted immediately</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 text-green-600" />
                    <span>Trip details will be recorded</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <Button
                  variant="destructive"
                  className="w-full"
                  size="lg"
                  onClick={handleSOSClick}
                >
                  <AlertCircle className="mr-2 h-5 w-5" />
                  Trigger SOS Alert
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  Make sure you have added emergency contacts in your profile
                </p>
              </div>
            </>
          )}

          {isTriggering && (
            <div className="space-y-4 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="h-32 w-32 animate-pulse rounded-full bg-red-100 flex items-center justify-center">
                    <AlertCircle className="h-16 w-16 text-red-600" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl font-bold text-red-600">{countdown}</span>
                  </div>
                </div>

                <div>
                  <p className="text-lg font-semibold">Triggering SOS Alert...</p>
                  <p className="text-sm text-muted-foreground">
                    Cancel within {countdown} seconds
                  </p>
                </div>
              </div>

              <Button variant="outline" className="w-full" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          )}

          {sosTriggered && (
            <div className="space-y-4">
              <Alert className="border-red-600 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-900">
                  <strong>SOS Alert Active</strong>
                  <br />
                  Emergency contacts and authorities have been notified.
                </AlertDescription>
              </Alert>

              <div className="space-y-2 rounded-lg border p-4">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Triggered: {new Date().toLocaleTimeString()}
                  </span>
                </div>

                {currentLocation && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Your Location:</p>
                      <p className="font-mono text-xs">
                        {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                      </p>
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <p className="text-sm font-medium">Booking Details:</p>
                  <p className="text-xs text-muted-foreground">ID: {booking.id}</p>
                  <p className="text-xs text-muted-foreground">
                    Status: {booking.status.replace('-', ' ')}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Button variant="default" className="w-full" onClick={handleResolveSOS}>
                  Mark as Safe / Resolve Alert
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  Your emergency contacts have been notified
                </p>
              </div>

              <p className="text-center text-xs text-muted-foreground">
                Help is on the way. Stay safe and keep your phone with you.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
