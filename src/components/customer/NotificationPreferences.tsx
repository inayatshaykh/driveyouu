import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Button } from '../ui/button';
import { Bell, Mail, MessageSquare, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface NotificationPreference {
  id: string;
  name: string;
  description: string;
  channels: {
    push: boolean;
    sms: boolean;
    email: boolean;
  };
}

export function NotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/customer/notification-preferences', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch preferences');
      }

      setPreferences(data.preferences || getDefaultPreferences());
    } catch (error: any) {
      console.error('Fetch preferences error:', error);
      // Use default preferences on error
      setPreferences(getDefaultPreferences());
    } finally {
      setIsLoading(false);
    }
  };

  const getDefaultPreferences = (): NotificationPreference[] => {
    return [
      {
        id: 'booking_updates',
        name: 'Booking Updates',
        description: 'Notifications about your booking status',
        channels: { push: true, sms: true, email: false },
      },
      {
        id: 'driver_updates',
        name: 'Driver Updates',
        description: 'Driver assignment and arrival notifications',
        channels: { push: true, sms: true, email: false },
      },
      {
        id: 'payment_updates',
        name: 'Payment Updates',
        description: 'Payment confirmations and receipts',
        channels: { push: true, sms: true, email: true },
      },
      {
        id: 'promotional',
        name: 'Promotional Offers',
        description: 'Special offers and discounts',
        channels: { push: true, sms: false, email: true },
      },
      {
        id: 'safety_alerts',
        name: 'Safety Alerts',
        description: 'SOS and emergency notifications (always enabled)',
        channels: { push: true, sms: true, email: false },
      },
    ];
  };

  const handleToggle = (prefId: string, channel: 'push' | 'sms' | 'email') => {
    // Safety alerts cannot be disabled
    if (prefId === 'safety_alerts') {
      toast.error('Safety alerts cannot be disabled');
      return;
    }

    setPreferences((prev) =>
      prev.map((pref) =>
        pref.id === prefId
          ? {
              ...pref,
              channels: {
                ...pref.channels,
                [channel]: !pref.channels[channel],
              },
            }
          : pref
      )
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/customer/notification-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ preferences }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save preferences');
      }

      toast.success('Notification preferences saved');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <p className="text-sm text-muted-foreground">
            Choose how you want to receive notifications
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Channel Headers */}
          <div className="grid grid-cols-4 gap-4 border-b pb-3">
            <div className="col-span-1">
              <p className="text-sm font-medium">Notification Type</p>
            </div>
            <div className="flex items-center justify-center">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="ml-2 text-sm font-medium">Push</span>
            </div>
            <div className="flex items-center justify-center">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="ml-2 text-sm font-medium">SMS</span>
            </div>
            <div className="flex items-center justify-center">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="ml-2 text-sm font-medium">Email</span>
            </div>
          </div>

          {/* Preferences */}
          {preferences.map((pref) => (
            <div key={pref.id} className="grid grid-cols-4 gap-4 items-start">
              <div className="col-span-1">
                <Label className="font-medium">{pref.name}</Label>
                <p className="text-xs text-muted-foreground">{pref.description}</p>
              </div>

              {/* Push Toggle */}
              <div className="flex items-center justify-center">
                <Switch
                  checked={pref.channels.push}
                  onCheckedChange={() => handleToggle(pref.id, 'push')}
                  disabled={pref.id === 'safety_alerts'}
                />
              </div>

              {/* SMS Toggle */}
              <div className="flex items-center justify-center">
                <Switch
                  checked={pref.channels.sms}
                  onCheckedChange={() => handleToggle(pref.id, 'sms')}
                  disabled={pref.id === 'safety_alerts'}
                />
              </div>

              {/* Email Toggle */}
              <div className="flex items-center justify-center">
                <Switch
                  checked={pref.channels.email}
                  onCheckedChange={() => handleToggle(pref.id, 'email')}
                  disabled={pref.id === 'safety_alerts'}
                />
              </div>
            </div>
          ))}

          {/* Info */}
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> Safety alerts are always enabled for your security and
              cannot be disabled. You will receive notifications for SOS alerts and emergency
              situations.
            </p>
          </div>

          {/* Save Button */}
          <Button onClick={handleSave} disabled={isSaving} className="w-full">
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Preferences'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Push Notification Setup */}
      <Card>
        <CardHeader>
          <CardTitle>Push Notifications</CardTitle>
          <p className="text-sm text-muted-foreground">
            Enable push notifications to receive real-time updates
          </p>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={() => {
              if ('Notification' in window) {
                Notification.requestPermission().then((permission) => {
                  if (permission === 'granted') {
                    toast.success('Push notifications enabled');
                  } else {
                    toast.error('Push notifications denied');
                  }
                });
              } else {
                toast.error('Push notifications not supported');
              }
            }}
          >
            <Bell className="mr-2 h-4 w-4" />
            Enable Push Notifications
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
