import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { AlertCircle, MapPin, Phone, Clock, User, Car, Search, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface SOSAlert {
  id: string;
  bookingId: string;
  customerId: string;
  customerName: string;
  customerMobile: string;
  driverId?: string;
  driverName?: string;
  driverMobile?: string;
  latitude: number;
  longitude: number;
  status: 'active' | 'resolved';
  resolvedBy?: string;
  resolvedAt?: string;
  notes?: string;
  createdAt: string;
  pickupAddress: string;
  dropAddress?: string;
}

export function SOSManagement() {
  const [alerts, setAlerts] = useState<SOSAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlert, setSelectedAlert] = useState<SOSAlert | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('active');

  useEffect(() => {
    fetchAlerts();
    // Poll for new alerts every 10 seconds
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, [filter]);

  const fetchAlerts = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const url = new URL('/api/admin/sos', window.location.origin);
      if (filter !== 'all') {
        url.searchParams.append('status', filter);
      }

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch SOS alerts');
      }

      setAlerts(data.alerts);
    } catch (error: any) {
      console.error('Fetch alerts error:', error);
      toast.error(error.message || 'Failed to fetch SOS alerts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (alert: SOSAlert) => {
    setSelectedAlert(alert);
    setResolutionNotes(alert.notes || '');
    setIsDetailsOpen(true);
  };

  const handleResolveAlert = async () => {
    if (!selectedAlert) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/sos/${selectedAlert.id}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          notes: resolutionNotes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resolve alert');
      }

      toast.success('SOS Alert resolved successfully');
      setIsDetailsOpen(false);
      fetchAlerts();
    } catch (error: any) {
      toast.error(error.message || 'Failed to resolve alert');
    }
  };

  const openInMaps = (latitude: number, longitude: number) => {
    window.open(
      `https://www.google.com/maps?q=${latitude},${longitude}`,
      '_blank'
    );
  };

  const callNumber = (mobile: string) => {
    window.location.href = `tel:${mobile}`;
  };

  const filteredAlerts = alerts.filter(
    (alert) =>
      alert.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.customerMobile.includes(searchQuery) ||
      alert.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeAlertsCount = alerts.filter((a) => a.status === 'active').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading SOS alerts...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-bold text-red-600">{activeAlertsCount}</p>
              {activeAlertsCount > 0 && (
                <div className="h-3 w-3 animate-pulse rounded-full bg-red-600" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Alerts (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{alerts.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Resolved Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {alerts.filter((a) => a.status === 'resolved').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
              <Button
                variant={filter === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('active')}
              >
                Active
              </Button>
              <Button
                variant={filter === 'resolved' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('resolved')}
              >
                Resolved
              </Button>
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All
              </Button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search alerts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts Table */}
      <Card>
        <CardHeader>
          <CardTitle>SOS Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAlerts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No SOS alerts found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAlerts.map((alert) => (
                    <TableRow key={alert.id} className={alert.status === 'active' ? 'bg-red-50' : ''}>
                      <TableCell>
                        <Badge
                          variant={alert.status === 'active' ? 'destructive' : 'secondary'}
                        >
                          {alert.status === 'active' && (
                            <div className="mr-1 h-2 w-2 animate-pulse rounded-full bg-white" />
                          )}
                          {alert.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{alert.customerName}</p>
                          <p className="text-xs text-muted-foreground">{alert.customerMobile}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {alert.driverName ? (
                          <div>
                            <p className="font-medium">{alert.driverName}</p>
                            <p className="text-xs text-muted-foreground">{alert.driverMobile}</p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openInMaps(alert.latitude, alert.longitude)}
                        >
                          <MapPin className="mr-1 h-4 w-4" />
                          View
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{new Date(alert.createdAt).toLocaleDateString()}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(alert.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(alert)}
                        >
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Alert Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              SOS Alert Details
            </DialogTitle>
            <DialogDescription>
              Complete information about the emergency alert
            </DialogDescription>
          </DialogHeader>

          {selectedAlert && (
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <span className="font-medium">Status</span>
                <Badge
                  variant={selectedAlert.status === 'active' ? 'destructive' : 'secondary'}
                >
                  {selectedAlert.status}
                </Badge>
              </div>

              {/* Customer Info */}
              <div className="rounded-lg border p-4">
                <h4 className="mb-3 flex items-center gap-2 font-semibold">
                  <User className="h-4 w-4" />
                  Customer Information
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{selectedAlert.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mobile:</span>
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0"
                      onClick={() => callNumber(selectedAlert.customerMobile)}
                    >
                      <Phone className="mr-1 h-3 w-3" />
                      {selectedAlert.customerMobile}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Driver Info */}
              {selectedAlert.driverName && (
                <div className="rounded-lg border p-4">
                  <h4 className="mb-3 flex items-center gap-2 font-semibold">
                    <Car className="h-4 w-4" />
                    Driver Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium">{selectedAlert.driverName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mobile:</span>
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0"
                        onClick={() => callNumber(selectedAlert.driverMobile!)}
                      >
                        <Phone className="mr-1 h-3 w-3" />
                        {selectedAlert.driverMobile}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Location */}
              <div className="rounded-lg border p-4">
                <h4 className="mb-3 flex items-center gap-2 font-semibold">
                  <MapPin className="h-4 w-4" />
                  Location
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Coordinates:</p>
                    <p className="font-mono">
                      {selectedAlert.latitude.toFixed(6)}, {selectedAlert.longitude.toFixed(6)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openInMaps(selectedAlert.latitude, selectedAlert.longitude)}
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    Open in Google Maps
                  </Button>
                </div>
              </div>

              {/* Trip Details */}
              <div className="rounded-lg border p-4">
                <h4 className="mb-3 flex items-center gap-2 font-semibold">
                  <Clock className="h-4 w-4" />
                  Trip Details
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Booking ID:</p>
                    <p className="font-mono text-xs">{selectedAlert.bookingId}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Pickup:</p>
                    <p>{selectedAlert.pickupAddress}</p>
                  </div>
                  {selectedAlert.dropAddress && (
                    <div>
                      <p className="text-muted-foreground">Drop:</p>
                      <p>{selectedAlert.dropAddress}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground">Alert Time:</p>
                    <p>{new Date(selectedAlert.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Resolution */}
              {selectedAlert.status === 'active' ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Resolution Notes</label>
                    <Textarea
                      placeholder="Add notes about how this alert was resolved..."
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      rows={4}
                      className="mt-1"
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleResolveAlert}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark as Resolved
                  </Button>
                </div>
              ) : (
                <div className="rounded-lg border bg-muted/50 p-4">
                  <h4 className="mb-2 font-semibold">Resolution Details</h4>
                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">
                      Resolved: {new Date(selectedAlert.resolvedAt!).toLocaleString()}
                    </p>
                    {selectedAlert.notes && (
                      <div>
                        <p className="font-medium">Notes:</p>
                        <p className="text-muted-foreground">{selectedAlert.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
