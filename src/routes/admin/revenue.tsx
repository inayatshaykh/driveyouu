import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect, useMemo } from 'react';
import { IndianRupee, TrendingUp, TrendingDown, Calendar, Car, Loader2, RefreshCw } from 'lucide-react';
import { fetchAllBookings, type SupabaseBooking } from '@/lib/bookingService';

export const Route = createFileRoute('/admin/revenue')({
  component: RevenuePage,
});

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

const MONTHLY_DUMMY = [
  { month: 'Jun', revenue: 18400, bookings: 22 },
  { month: 'Jul', revenue: 24600, bookings: 31 },
  { month: 'Aug', revenue: 21200, bookings: 27 },
  { month: 'Sep', revenue: 31800, bookings: 40 },
  { month: 'Oct', revenue: 28500, bookings: 36 },
  { month: 'Nov', revenue: 38200, bookings: 48 },
  { month: 'Dec', revenue: 42100, bookings: 53 },
  { month: 'Jan', revenue: 35600, bookings: 45 },
  { month: 'Feb', revenue: 44800, bookings: 56 },
  { month: 'Mar', revenue: 51200, bookings: 64 },
  { month: 'Apr', revenue: 47900, bookings: 60 },
  { month: 'May', revenue: 58400, bookings: 73 },
];

function BarChart({ data }: { data: typeof MONTHLY_DUMMY }) {
  const max = Math.max(...data.map(d => d.revenue));
  return (
    <div className="flex items-end gap-1.5 h-40 w-full">
      {data.map(d => (
        <div key={d.month} className="flex-1 flex flex-col items-center gap-1 group">
          <div className="relative w-full flex items-end justify-center" style={{ height: '120px' }}>
            <div
              className="w-full bg-emerald-600/70 hover:bg-emerald-500 rounded-t-lg transition-all duration-300 cursor-pointer group-hover:bg-emerald-500"
              style={{ height: `${(d.revenue / max) * 100}%`, minHeight: '4px' }}
              title={`${d.month}: ${inr.format(d.revenue)}`}
            />
          </div>
          <span className="text-[10px] text-slate-500 group-hover:text-slate-300 transition-colors">{d.month}</span>
        </div>
      ))}
    </div>
  );
}

function RevenuePage() {
  const [bookings, setBookings] = useState<SupabaseBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await fetchAllBookings();
    setBookings(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const completed = bookings.filter(b => b.status === 'completed');
    const total = bookings.reduce((s, b) => s + (b.total_fare ?? 0), 0);
    const completedRev = completed.reduce((s, b) => s + (b.total_fare ?? 0), 0);
    const pending = bookings.filter(b => b.status === 'pending').reduce((s, b) => s + (b.total_fare ?? 0), 0);
    const avgFare = bookings.length ? total / bookings.length : 0;

    const byType = ['hourly', 'multiday', 'outstation'].map(type => ({
      type,
      count: bookings.filter(b => b.booking_type === type).length,
      revenue: bookings.filter(b => b.booking_type === type).reduce((s, b) => s + (b.total_fare ?? 0), 0),
    }));

    return { total, completedRev, pending, avgFare, byType };
  }, [bookings]);

  const topBookings = useMemo(() =>
    [...bookings].sort((a, b) => (b.total_fare ?? 0) - (a.total_fare ?? 0)).slice(0, 10),
    [bookings]
  );

  const cards = [
    { label: 'Total Revenue',     value: inr.format(stats.total),        icon: IndianRupee, color: 'text-emerald-400', bg: 'bg-emerald-500/10', trend: '+18%' },
    { label: 'Completed Revenue', value: inr.format(stats.completedRev), icon: TrendingUp,  color: 'text-blue-400',    bg: 'bg-blue-500/10',    trend: '+12%' },
    { label: 'Pending Revenue',   value: inr.format(stats.pending),      icon: Calendar,    color: 'text-amber-400',   bg: 'bg-amber-500/10',   trend: null   },
    { label: 'Avg Fare / Booking',value: inr.format(stats.avgFare),      icon: Car,         color: 'text-purple-400',  bg: 'bg-purple-500/10',  trend: '+5%'  },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Revenue</h1>
          <p className="text-slate-400 mt-1 text-sm">Financial overview and booking revenue</p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-sm font-semibold transition-colors">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-400 font-medium leading-tight">{c.label}</span>
                <div className={`p-2 rounded-xl ${c.bg}`}>
                  <Icon className={`h-4 w-4 ${c.color}`} />
                </div>
              </div>
              {loading ? (
                <div className="h-7 w-24 bg-slate-800 rounded-lg animate-pulse" />
              ) : (
                <>
                  <div className="text-lg sm:text-xl font-bold text-white">{c.value}</div>
                  {c.trend && (
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className="h-3 w-3 text-emerald-400" />
                      <span className="text-xs text-emerald-400 font-medium">{c.trend} vs last month</span>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Monthly Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">Monthly Revenue Trend</h2>
          <span className="text-xs text-slate-500 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">Last 12 months</span>
        </div>
        <BarChart data={MONTHLY_DUMMY} />
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800">
          <span className="text-xs text-slate-500">Total (12 months)</span>
          <span className="text-sm font-bold text-emerald-400">
            {inr.format(MONTHLY_DUMMY.reduce((s, d) => s + d.revenue, 0))}
          </span>
        </div>
      </div>

      {/* Revenue by Type */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.byType.map(t => (
          <div key={t.type} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-2 capitalize">{t.type}</div>
            <div className="text-2xl font-bold text-white mb-1">{t.count}</div>
            <div className="text-base font-bold text-emerald-400">{inr.format(t.revenue)}</div>
            <div className="text-xs text-slate-500 mt-0.5">bookings · revenue</div>
            {/* Mini bar */}
            <div className="mt-3 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full"
                style={{ width: stats.total ? `${(t.revenue / stats.total) * 100}%` : '0%' }}
              />
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {stats.total ? ((t.revenue / stats.total) * 100).toFixed(1) : 0}% of total
            </div>
          </div>
        ))}
      </div>

      {/* Top Bookings by Fare */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white">Top Bookings by Fare</h2>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          </div>
        ) : topBookings.length === 0 ? (
          <div className="py-12 text-center text-slate-500">No bookings yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-800/50">
                  {['#', 'Customer', 'Type', 'Fare', 'Status'].map(h => (
                    <th key={h} className="text-left py-3 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topBookings.map((b, i) => (
                  <tr key={b.id} className={`border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors ${i % 2 === 0 ? '' : 'bg-slate-800/10'}`}>
                    <td className="py-3 px-5 text-sm font-bold text-slate-500">#{i + 1}</td>
                    <td className="py-3 px-5">
                      <div className="text-sm font-medium text-white">{b.customer_name}</div>
                      <div className="text-xs text-slate-500">{b.customer_phone}</div>
                    </td>
                    <td className="py-3 px-5 text-sm text-slate-300 capitalize">{b.booking_type}</td>
                    <td className="py-3 px-5 text-sm font-bold text-emerald-400">₹{b.total_fare?.toLocaleString()}</td>
                    <td className="py-3 px-5">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${
                        b.status === 'completed' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                        b.status === 'pending'   ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                        'bg-slate-700 text-slate-300'
                      }`}>{b.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
