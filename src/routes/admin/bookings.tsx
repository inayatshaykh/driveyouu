import { createFileRoute } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import { Search, Filter, Calendar, MapPin, User, Car, ChevronDown } from 'lucide-react';

export const Route = createFileRoute('/admin/bookings')({
  component: BookingsPage,
});

const ALL_BOOKINGS = [
  { id: 'BK-1001', customer: 'Rohan Sharma', driver: 'Amit Kumar', pickup: 'Connaught Place', drop: 'IGI Airport', amount: 850, status: 'active', type: 'on-demand', date: '2024-01-15', time: '10:30 AM' },
  { id: 'BK-1002', customer: 'Priya Verma', driver: 'Rajesh Singh', pickup: 'Saket', drop: 'Gurgaon Cyber City', amount: 1200, status: 'completed', type: 'scheduled', date: '2024-01-15', time: '09:15 AM' },
  { id: 'BK-1003', customer: 'Karan Mehta', driver: 'Suresh Yadav', pickup: 'Dwarka', drop: 'Noida Sector 62', amount: 1450, status: 'active', type: 'outstation', date: '2024-01-15', time: '11:00 AM' },
  { id: 'BK-1004', customer: 'Anjali Gupta', driver: 'Pending', pickup: 'Rohini', drop: 'Karol Bagh', amount: 450, status: 'pending', type: 'on-demand', date: '2024-01-15', time: '11:30 AM' },
  { id: 'BK-1005', customer: 'Vikram Singh', driver: 'Manoj Tiwari', pickup: 'Vasant Kunj', drop: 'Nehru Place', amount: 680, status: 'completed', type: 'hourly', date: '2024-01-14', time: '08:45 AM' },
  { id: 'BK-1006', customer: 'Neha Patel', driver: 'Deepak Sharma', pickup: 'Lajpat Nagar', drop: 'Gurugram', amount: 950, status: 'cancelled', type: 'scheduled', date: '2024-01-14', time: '02:00 PM' },
  { id: 'BK-1007', customer: 'Arjun Nair', driver: 'Ravi Kumar', pickup: 'Janakpuri', drop: 'Faridabad', amount: 1800, status: 'completed', type: 'outstation', date: '2024-01-14', time: '07:00 AM' },
  { id: 'BK-1008', customer: 'Sonia Kapoor', driver: 'Pending', pickup: 'Pitampura', drop: 'South Ex', amount: 520, status: 'pending', type: 'on-demand', date: '2024-01-13', time: '03:30 PM' },
  { id: 'BK-1009', customer: 'Rahul Joshi', driver: 'Vinod Pal', pickup: 'Mayur Vihar', drop: 'Aerocity', amount: 780, status: 'completed', type: 'scheduled', date: '2024-01-13', time: '05:00 AM' },
  { id: 'BK-1010', customer: 'Meera Iyer', driver: 'Santosh Kumar', pickup: 'Hauz Khas', drop: 'Noida Expressway', amount: 1100, status: 'active', type: 'hourly', date: '2024-01-13', time: '12:00 PM' },
];

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  completed: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  pending: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  cancelled: 'bg-red-500/15 text-red-400 border border-red-500/30',
};

const TYPE_COLORS: Record<string, string> = {
  'on-demand': 'bg-purple-500/15 text-purple-400',
  'scheduled': 'bg-cyan-500/15 text-cyan-400',
  'hourly': 'bg-orange-500/15 text-orange-400',
  'outstation': 'bg-pink-500/15 text-pink-400',
};

function BookingsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  const filtered = useMemo(() => {
    return ALL_BOOKINGS.filter(b => {
      const matchSearch = !search || 
        b.id.toLowerCase().includes(search.toLowerCase()) ||
        b.customer.toLowerCase().includes(search.toLowerCase()) ||
        b.driver.toLowerCase().includes(search.toLowerCase()) ||
        b.pickup.toLowerCase().includes(search.toLowerCase()) ||
        b.drop.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || b.status === statusFilter;
      const matchType = typeFilter === 'all' || b.type === typeFilter;
      const matchDate = !dateFilter || b.date === dateFilter;
      return matchSearch && matchStatus && matchType && matchDate;
    });
  }, [search, statusFilter, typeFilter, dateFilter]);

  const counts = useMemo(() => ({
    all: ALL_BOOKINGS.length,
    active: ALL_BOOKINGS.filter(b => b.status === 'active').length,
    pending: ALL_BOOKINGS.filter(b => b.status === 'pending').length,
    completed: ALL_BOOKINGS.filter(b => b.status === 'completed').length,
    cancelled: ALL_BOOKINGS.filter(b => b.status === 'cancelled').length,
  }), []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Bookings</h1>
        <p className="text-slate-400 mt-1">Manage and monitor all ride bookings</p>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'active', 'pending', 'completed', 'cancelled'] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all capitalize ${
              statusFilter === s
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700'
            }`}
          >
            {s} <span className="ml-1 opacity-70">({counts[s]})</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by ID, customer, driver, location..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="pl-9 pr-8 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="on-demand">On-Demand</option>
            <option value="scheduled">Scheduled</option>
            <option value="hourly">Hourly</option>
            <option value="outstation">Outstation</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
        </div>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 [color-scheme:dark]"
          />
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-slate-500">
        Showing <span className="text-white font-semibold">{filtered.length}</span> of {ALL_BOOKINGS.length} bookings
      </p>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/60">
                <th className="text-left py-4 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Booking</th>
                <th className="text-left py-4 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Customer</th>
                <th className="text-left py-4 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Driver</th>
                <th className="text-left py-4 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Route</th>
                <th className="text-left py-4 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Type</th>
                <th className="text-left py-4 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Amount</th>
                <th className="text-left py-4 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500">
                    <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="text-lg font-medium">No bookings found</p>
                    <p className="text-sm mt-1">Try adjusting your filters</p>
                  </td>
                </tr>
              ) : (
                filtered.map((b, i) => (
                  <tr key={b.id} className={`border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors ${i % 2 === 0 ? '' : 'bg-slate-800/10'}`}>
                    <td className="py-4 px-5">
                      <div className="font-semibold text-emerald-400 text-sm">{b.id}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{b.date} · {b.time}</div>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {b.customer.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="text-sm text-white font-medium">{b.customer}</span>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-slate-500 flex-shrink-0" />
                        <span className={`text-sm ${b.driver === 'Pending' ? 'text-amber-400 italic' : 'text-slate-300'}`}>{b.driver}</span>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-start gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-xs text-white font-medium">{b.pickup}</div>
                          <div className="text-xs text-slate-500">→ {b.drop}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${TYPE_COLORS[b.type]}`}>
                        {b.type}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-sm font-bold text-white">₹{b.amount.toLocaleString()}</td>
                    <td className="py-4 px-5">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${STATUS_COLORS[b.status]}`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
