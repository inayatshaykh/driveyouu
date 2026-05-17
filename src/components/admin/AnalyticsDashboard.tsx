import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { IndianRupee, Users, Car, TrendingUp, Calendar, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Analytics {
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  platformCommission: number;
  driverEarnings: number;
  activeDrivers: number;
  totalCustomers: number;
  averageFare: number;
}

export function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('all');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      
      let startDate: Date | undefined;
      const now = new Date();

      if (period === 'today') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (period === 'week') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (period === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const url = new URL('/api/admin/analytics', window.location.origin);
      if (startDate) {
        url.searchParams.append('startDate', startDate.toISOString());
      }

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch analytics');
      }

      setAnalytics(data.analytics);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch analytics');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading analytics...</p>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const completionRate =
    analytics.totalBookings > 0
      ? ((analytics.completedBookings / analytics.totalBookings) * 100).toFixed(1)
      : '0';

  const cancellationRate =
    analytics.totalBookings > 0
      ? ((analytics.cancelledBookings / analytics.totalBookings) * 100).toFixed(1)
      : '0';

  const statsCards = [
    {
      title: 'Total Revenue',
      value: `₹${analytics.totalRevenue.toLocaleString('en-IN')}`,
      icon: IndianRupee,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Platform Commission (20%)',
      value: `₹${analytics.platformCommission.toLocaleString('en-IN')}`,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Driver Earnings (80%)',
      value: `₹${analytics.driverEarnings.toLocaleString('en-IN')}`,
      icon: Car,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Total Bookings',
      value: analytics.totalBookings.toString(),
      icon: Calendar,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Completed Bookings',
      value: `${analytics.completedBookings} (${completionRate}%)`,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Cancelled Bookings',
      value: `${analytics.cancelledBookings} (${cancellationRate}%)`,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Active Drivers',
      value: analytics.activeDrivers.toString(),
      icon: Car,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Total Customers',
      value: analytics.totalCustomers.toString(),
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setPeriod('today')}
          className={`rounded-md px-4 py-2 text-sm font-medium ${
            period === 'today'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted hover:bg-muted/80'
          }`}
        >
          Today
        </button>
        <button
          onClick={() => setPeriod('week')}
          className={`rounded-md px-4 py-2 text-sm font-medium ${
            period === 'week'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted hover:bg-muted/80'
          }`}
        >
          This Week
        </button>
        <button
          onClick={() => setPeriod('month')}
          className={`rounded-md px-4 py-2 text-sm font-medium ${
            period === 'month'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted hover:bg-muted/80'
          }`}
        >
          This Month
        </button>
        <button
          onClick={() => setPeriod('all')}
          className={`rounded-md px-4 py-2 text-sm font-medium ${
            period === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted hover:bg-muted/80'
          }`}
        >
          All Time
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`rounded-full p-2 ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Additional Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Key Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Average Fare</p>
              <p className="text-2xl font-bold">
                ₹{analytics.averageFare.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Completion Rate</p>
              <p className="text-2xl font-bold">{completionRate}%</p>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <h4 className="mb-2 font-medium">Revenue Split</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Platform (20%)</span>
                <span className="font-semibold">
                  ₹{analytics.platformCommission.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Drivers (80%)</span>
                <span className="font-semibold">
                  ₹{analytics.driverEarnings.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center justify-between border-t pt-2">
                <span className="font-medium">Total Revenue</span>
                <span className="font-bold">
                  ₹{analytics.totalRevenue.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
