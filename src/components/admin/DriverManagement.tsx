import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { toast } from 'sonner';
import { Search, CheckCircle, XCircle, Clock, User, Phone, Star } from 'lucide-react';
import type { Driver } from '../../types';

export function DriverManagement() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [filteredDrivers, setFilteredDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [verificationFilter, setVerificationFilter] = useState<string>('all');
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchDrivers();
  }, []);

  useEffect(() => {
    filterDrivers();
  }, [drivers, searchQuery, statusFilter, verificationFilter]);

  const fetchDrivers = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/admin/drivers', {
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
      toast.error(error.message || 'Failed to fetch drivers');
    } finally {
      setIsLoading(false);
    }
  };

  const filterDrivers = () => {
    let filtered = [...drivers];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (d) =>
          d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.mobile.includes(searchQuery)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((d) => d.driverStatus === statusFilter);
    }

    // Verification filter
    if (verificationFilter !== 'all') {
      filtered = filtered.filter((d) => d.verificationStatus === verificationFilter);
    }

    setFilteredDrivers(filtered);
  };

  const handleUpdateVerification = async (
    driverId: string,
    status: string,
    rejectionReason?: string
  ) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/admin/drivers', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'updateVerification',
          driverId,
          status,
          rejectionReason,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update verification');
      }

      toast.success('Verification status updated');
      fetchDrivers();
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update verification');
    }
  };

  const handleUpdateStatus = async (driverId: string, status: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/admin/drivers', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'updateStatus',
          driverId,
          status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update status');
      }

      toast.success('Driver status updated');
      fetchDrivers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    }
  };

  const getVerificationBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any; icon: any }> = {
      pending: { label: 'Pending', variant: 'secondary', icon: Clock },
      documents_submitted: { label: 'Docs Submitted', variant: 'secondary', icon: Clock },
      in_office_verified: { label: 'Office Verified', variant: 'default', icon: CheckCircle },
      police_verification_pending: {
        label: 'Police Pending',
        variant: 'secondary',
        icon: Clock,
      },
      police_verified: { label: 'Verified', variant: 'default', icon: CheckCircle },
      rejected: { label: 'Rejected', variant: 'destructive', icon: XCircle },
    };

    const info = statusMap[status] || statusMap.pending;
    const Icon = info.icon;

    return (
      <Badge variant={info.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {info.label}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      offline: { label: 'Offline', variant: 'secondary' },
      available: { label: 'Available', variant: 'default' },
      en_route: { label: 'En Route', variant: 'default' },
      on_trip: { label: 'On Trip', variant: 'default' },
      busy: { label: 'Busy', variant: 'secondary' },
    };

    const info = statusMap[status] || statusMap.offline;
    return <Badge variant={info.variant}>{info.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading drivers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Driver Management</h2>
        <div className="text-sm text-muted-foreground">
          Total: {drivers.length} drivers
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or mobile..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
                <SelectItem value="on_trip">On Trip</SelectItem>
                <SelectItem value="busy">Busy</SelectItem>
              </SelectContent>
            </Select>

            <Select value={verificationFilter} onValueChange={setVerificationFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by verification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Verification</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="documents_submitted">Docs Submitted</SelectItem>
                <SelectItem value="in_office_verified">Office Verified</SelectItem>
                <SelectItem value="police_verified">Police Verified</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Drivers List */}
      <div className="space-y-4">
        {filteredDrivers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <User className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No drivers found</p>
            </CardContent>
          </Card>
        ) : (
          filteredDrivers.map((driver) => (
            <Card key={driver.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{driver.name || 'Unnamed Driver'}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {driver.mobile}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {getVerificationBadge(driver.verificationStatus)}
                      {getStatusBadge(driver.driverStatus)}
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{driver.rating.toFixed(1)}</span>
                        <span className="text-muted-foreground">
                          ({driver.totalTrips} trips)
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedDriver(driver);
                          setIsDialogOpen(true);
                        }}
                      >
                        Manage Verification
                      </Button>

                      {driver.driverStatus === 'offline' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateStatus(driver.id, 'available')}
                        >
                          Activate
                        </Button>
                      )}

                      {driver.driverStatus !== 'offline' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateStatus(driver.id, 'offline')}
                        >
                          Deactivate
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Verification Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Driver Verification</DialogTitle>
          </DialogHeader>
          {selectedDriver && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">Driver: {selectedDriver.name}</p>
                <p className="text-sm text-muted-foreground">{selectedDriver.mobile}</p>
                <p className="mt-2 text-sm">
                  Current Status: {getVerificationBadge(selectedDriver.verificationStatus)}
                </p>
              </div>

              <div className="space-y-2">
                <Button
                  className="w-full"
                  onClick={() =>
                    handleUpdateVerification(selectedDriver.id, 'in_office_verified')
                  }
                  disabled={selectedDriver.verificationStatus === 'in_office_verified'}
                >
                  Mark as Office Verified
                </Button>

                <Button
                  className="w-full"
                  onClick={() =>
                    handleUpdateVerification(selectedDriver.id, 'police_verified')
                  }
                  disabled={selectedDriver.verificationStatus === 'police_verified'}
                >
                  Mark as Police Verified
                </Button>

                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => {
                    const reason = prompt('Enter rejection reason:');
                    if (reason) {
                      handleUpdateVerification(selectedDriver.id, 'rejected', reason);
                    }
                  }}
                >
                  Reject Verification
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
