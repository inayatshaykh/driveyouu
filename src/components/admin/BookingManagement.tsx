import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { toast } from 'sonner';
import { MapPin, Calendar, IndianRupee, User } from 'lucide-react';
import type { Booking, Driver } from '../../types';

export function BookingManagement() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);

  useEffect(() => {
    fetchBookings();
    fetchDrivers();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [bookings, statusFilter, typeFilter]);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/admin/bookings', {
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

  const fetchDrivers = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/admin/drivers?driverStatus=available', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch drivers');
      }

      setDrivers(data.drivers);
    } catch (error: any) {
      console.error('Failed to fetch drivers:', error);
    }
  };

  const filterBookings = () => {
    let filtered = [...bookings];

    if (statusFilter !== 'all') {
      filtered = filtered.filter((b) => b.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter((b) => b.bookingType === typeFilter);
    }

    setFilteredBookings(filtered);
  };

  const handleAssignDriver = async (bookingId: string, driverId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bookingId, driverId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to assign driver');
      }

      toast.success('Driver assigned successfully');
      fetchBookings();
      setIsAssignDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to assign driver');
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

    const info = statusMap[status] || statusMap.pending;
    return <Badge variant={info.variant}>{info.label}</Badge>;
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

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading bookings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Booking Management</h2>
        <div className="text-sm text-muted-foreground">
          Total: {bookings.length} bookings
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="on-demand">On-Demand</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="hourly">Hourly</SelectItem>
                <SelectItem value="outstation">Outstation</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bookings List */}
      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No bookings found</p>
            </CardContent>
          </Card>
        ) : (
          filteredBookings.map((booking) => (
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
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {formatDate(booking.createdAt)}
                </div>

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

                {booking.distance && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Distance</span>
                    <span className="font-medium">{booking.distance.toFixed(1)} km</span>
                  </div>
                )}

                {booking.status === 'pending' && (
                  <Button
                    className="w-full"
                    onClick={() => {
                      setSelectedBooking(booking);
                      setIsAssignDialogOpen(true);
                    }}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Assign Driver
                  </Button>
                )}

                {booking.driverId && (
                  <div className="rounded-lg border bg-muted/50 p-3 text-sm">
                    <p className="font-medium">Driver Assigned</p>
                    <p className="text-muted-foreground">ID: {booking.driverId}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Assign Driver Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Driver to Booking</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="rounded-lg border p-3">
                <p className="text-sm font-medium">
                  {formatBookingType(selectedBooking.bookingType)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedBooking.pickupLocation.address}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Available Drivers ({drivers.length})</p>
                {drivers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No available drivers at the moment
                  </p>
                ) : (
                  <div className="max-h-60 space-y-2 overflow-y-auto">
                    {drivers.map((driver) => (
                      <Button
                        key={driver.id}
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() =>
                          handleAssignDriver(selectedBooking.id, driver.id)
                        }
                      >
                        <User className="mr-2 h-4 w-4" />
                        <div className="text-left">
                          <p className="font-medium">{driver.name || 'Unnamed'}</p>
                          <p className="text-xs text-muted-foreground">
                            {driver.mobile} • ⭐ {driver.rating.toFixed(1)}
                          </p>
                        </div>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
