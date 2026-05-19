import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { 
  DollarSign, 
  Calendar, 
  Car, 
  Users,
  TrendingUp,
  Clock,
  MapPin
} from 'lucide-react';

export const Route = createFileRoute('/admin/dashboard')({
  component: DashboardPage,
});

// Mock data
const stats = [
  {
    title: 'Total Bookings',
    value: '1,284',
    change: '+12.5%',
    icon: Calendar,
    trend: 'up',
  },
  {
    title: 'Total Revenue',
    value: '₹2,45,680',
    change: '+18.2%',
    icon: DollarSign,
    trend: 'up',
  },
  {
    title: 'Active Bookings',
    value: '47',
    change: '+5.1%',
    icon: Clock,
    trend: 'up',
  },
  {
    title: 'Active Drivers',
    value: '156',
    change: '+8.3%',
    icon: Car,
    trend: 'up',
  },
];

const recentBookings = [
  {
    id: 'BK-1001',
    customer: 'Rohan Sharma',
    driver: 'Amit Kumar',
    pickup: 'Connaught Place',
    dropoff: 'IGI Airport',
    amount: '₹850',
    status: 'active',
    time: '10:30 AM',
  },
  {
    id: 'BK-1002',
    customer: 'Priya Verma',
    driver: 'Rajesh Singh',
    pickup: 'Saket',
    dropoff: 'Gurgaon Cyber City',
    amount: '₹1,200',
    status: 'completed',
    time: '09:15 AM',
  },
  {
    id: 'BK-1003',
    customer: 'Karan Mehta',
    driver: 'Suresh Yadav',
    pickup: 'Dwarka',
    dropoff: 'Noida Sector 62',
    amount: '₹1,450',
    status: 'active',
    time: '11:00 AM',
  },
  {
    id: 'BK-1004',
    customer: 'Anjali Gupta',
    driver: 'Pending',
    pickup: 'Rohini',
    dropoff: 'Karol Bagh',
    amount: '₹450',
    status: 'pending',
    time: '11:30 AM',
  },
  {
    id: 'BK-1005',
    customer: 'Vikram Singh',
    driver: 'Manoj Tiwari',
    pickup: 'Vasant Kunj',
    dropoff: 'Nehru Place',
    amount: '₹680',
    status: 'completed',
    time: '08:45 AM',
  },
];

const topCustomers = [
  {
    name: 'Rohan Sharma',
    email: 'rohan.sharma@email.com',
    phone: '+91 98765 43210',
    totalBookings: 45,
    totalSpent: '₹38,500',
    rating: 4.8,
  },
  {
    name: 'Priya Verma',
    email: 'priya.v@email.com',
    phone: '+91 98765 43211',
    totalBookings: 38,
    totalSpent: '₹32,100',
    rating: 4.9,
  },
  {
    name: 'Karan Mehta',
    email: 'karan.mehta@email.com',
    phone: '+91 98765 43212',
    totalBookings: 32,
    totalSpent: '₹28,900',
    rating: 4.7,
  },
  {
    name: 'Anjali Gupta',
    email: 'anjali.g@email.com',
    phone: '+91 98765 43213',
    totalBookings: 28,
    totalSpent: '₹24,300',
    rating: 4.9,
  },
  {
    name: 'Vikram Singh',
    email: 'vikram.singh@email.com',
    phone: '+91 98765 43214',
    totalBookings: 25,
    totalSpent: '₹21,800',
    rating: 4.6,
  },
];

function DashboardPage() {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-blue-500 hover:bg-blue-600 text-white border-0">Active</Badge>;
      case 'completed':
        return <Badge className="bg-green-500 hover:bg-green-600 text-white border-0">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white border-0">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
        <p className="text-slate-400 mt-1">
          Overview of your platform's performance and key metrics
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="bg-slate-900 border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  {stat.change} from last month
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Bookings Table */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Recent Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Booking ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Customer</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Driver</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Route</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Time</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 text-sm font-medium text-white">{booking.id}</td>
                    <td className="py-3 px-4 text-sm text-slate-300">{booking.customer}</td>
                    <td className="py-3 px-4 text-sm text-slate-300">{booking.driver}</td>
                    <td className="py-3 px-4 text-sm text-slate-300">
                      <div className="flex items-start gap-1">
                        <MapPin className="h-3 w-3 text-slate-500 mt-0.5 flex-shrink-0" />
                        <div className="flex flex-col">
                          <span className="text-xs">{booking.pickup}</span>
                          <span className="text-xs text-slate-500">→ {booking.dropoff}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-white">{booking.amount}</td>
                    <td className="py-3 px-4 text-sm text-slate-400">{booking.time}</td>
                    <td className="py-3 px-4 text-sm">{getStatusBadge(booking.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Top Customers */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Top Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Contact</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Total Bookings</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Total Spent</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Rating</th>
                </tr>
              </thead>
              <tbody>
                {topCustomers.map((customer) => (
                  <tr key={customer.email} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-white font-medium">
                          {customer.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">{customer.name}</div>
                          <div className="text-xs text-slate-400">{customer.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-300">{customer.phone}</td>
                    <td className="py-3 px-4 text-sm text-white font-medium">{customer.totalBookings}</td>
                    <td className="py-3 px-4 text-sm text-white font-medium">{customer.totalSpent}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-yellow-500">★</span>
                        <span className="text-sm text-white font-medium">{customer.rating}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
