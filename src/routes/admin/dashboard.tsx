import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { IndianRupee, Calendar, Car, Users, TrendingUp, Clock, MapPin, RefreshCw, Loader2 } from 'lucide-react';
import { fetchAllBookings, type SupabaseBooking } from '@/lib/bookingService';

export const Route = createFileRoute('/admin/dashboard')({
  component: DashboardPage,
});

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

const STATUS_COLORS: Record<string, string> = {
  pending:     'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  confirmed:   'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  in_progress: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
  completed:   'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  cancelled:   'bg-red-500/15 text-red-400 border border-red-500/30',
};

function DashboardPage() {
  const [bookings, setBookings] = useState<SupabaseBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await fetchAllBookings();
    setBookings(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Derived stats
  const totalRevenue = bookings.reduce((s, b) => s + (b.total_fare ?? 0), 0);
  const activeBookings = bookings.filter(b => b.status === 'in_progress' || b.status === 'confirmed').length;
  const pendingBookings = bookings.filter(b => b.status === 'pending').length;
  const recent = bookings.slice(0, 8);

  const stats = [
    { title: 'Total Bookings', value: bookings.length.toLocaleString(), icon: Calendar, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { title: 'Total Revenue', value: inr.format(totalRevenue), icon: IndianRupee, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { title: 'Active Rides', value: activeBookings.toString(), icon: Clock, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { title: 'Pending', value: pendingBookings.toString(), icon: Car, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 mt-1 text-sm">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs sm:text-sm text-slate-400 font-medium">{stat.title}</span>
                <div className={`p-2 rounded-xl ${stat.bg}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </div>
              {loading ? (
                <div className="h-8 w-20 bg-slate-800 rounded-lg animate-pulse" />
              ) : (
                <div className="text-xl sm:text-2xl font-bold text-white">{stat.value}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Recent Bookings */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white">Recent Bookings</h2>
          <span className="text-xs text-slate-500 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
            {bookings.length} total
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>No bookings yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-800/50">
                  {['ID', 'Customer', 'Pickup', 'Type', 'Fare', 'Status'].map(h => (
                    <th key={h} className="text-left py-3 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map((b, i) => (
                  <tr key={b.id} className={`border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors ${i % 2 === 0 ? '' : 'bg-slate-800/10'}`}>
                    <td className="py-3 px-5 text-xs font-mono font-bold text-emerald-400">
                      {b.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="py-3 px-5">
                      <div className="text-sm font-medium text-white">{b.customer_name}</div>
                      <div className="text-xs text-slate-500">{b.customer_phone}</div>
                    </td>
                    <td className="py-3 px-5">
                      <div className="flex items-start gap-1.5 max-w-[160px]">
                        <MapPin className="h-3.5 w-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <span className="text-xs text-white truncate">{b.pickup_address}</span>
                      </div>
                    </td>
                    <td className="py-3 px-5">
                      <span className="text-xs text-slate-300 capitalize">{b.booking_type}</span>
                    </td>
                    <td className="py-3 px-5 text-sm font-bold text-white">
                      ₹{b.total_fare?.toLocaleString()}
                    </td>
                    <td className="py-3 px-5">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${STATUS_COLORS[b.status] ?? 'bg-slate-700 text-slate-300'}`}>
                        {b.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Booking type breakdown */}
      {!loading && bookings.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {['hourly', 'multiday', 'outstation'].map(type => {
            const count = bookings.filter(b => b.booking_type === type).length;
            const rev = bookings.filter(b => b.booking_type === type).reduce((s, b) => s + (b.total_fare ?? 0), 0);
            return (
              <div key={type} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-2 capitalize">{type}</div>
                <div className="text-2xl font-bold text-white mb-1">{count}</div>
                <div className="text-sm text-emerald-400 font-semibold">₹{rev.toLocaleString()}</div>
                <div className="text-xs text-slate-500 mt-0.5">bookings · revenue</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
