import { createFileRoute } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import { Search, Phone, Mail, Star, TrendingUp, UserCheck, UserX, ChevronDown } from 'lucide-react';

export const Route = createFileRoute('/admin/customers')({
  component: CustomersPage,
});

const CUSTOMERS = [
  { id: 'CU-001', name: 'Rohan Sharma', phone: '+91 98765 43210', email: 'rohan.sharma@email.com', status: 'active', bookings: 45, spent: 38500, rating: 4.8, joined: 'Jan 2023', lastRide: '2 hours ago' },
  { id: 'CU-002', name: 'Priya Verma', phone: '+91 98765 43211', email: 'priya.v@email.com', status: 'active', bookings: 38, spent: 32100, rating: 4.9, joined: 'Feb 2023', lastRide: '1 day ago' },
  { id: 'CU-003', name: 'Karan Mehta', phone: '+91 98765 43212', email: 'karan.mehta@email.com', status: 'active', bookings: 32, spent: 28900, rating: 4.7, joined: 'Mar 2023', lastRide: '3 hours ago' },
  { id: 'CU-004', name: 'Anjali Gupta', phone: '+91 98765 43213', email: 'anjali.g@email.com', status: 'active', bookings: 28, spent: 24300, rating: 4.9, joined: 'Apr 2023', lastRide: '5 hours ago' },
  { id: 'CU-005', name: 'Vikram Singh', phone: '+91 98765 43214', email: 'vikram.singh@email.com', status: 'inactive', bookings: 25, spent: 21800, rating: 4.6, joined: 'May 2023', lastRide: '2 weeks ago' },
  { id: 'CU-006', name: 'Neha Patel', phone: '+91 98765 43215', email: 'neha.patel@email.com', status: 'active', bookings: 19, spent: 16500, rating: 4.5, joined: 'Jun 2023', lastRide: '1 day ago' },
  { id: 'CU-007', name: 'Arjun Nair', phone: '+91 98765 43216', email: 'arjun.nair@email.com', status: 'active', bookings: 15, spent: 13200, rating: 4.7, joined: 'Jul 2023', lastRide: '6 hours ago' },
  { id: 'CU-008', name: 'Sonia Kapoor', phone: '+91 98765 43217', email: 'sonia.k@email.com', status: 'blocked', bookings: 8, spent: 6800, rating: 3.2, joined: 'Aug 2023', lastRide: '1 month ago' },
  { id: 'CU-009', name: 'Rahul Joshi', phone: '+91 98765 43218', email: 'rahul.j@email.com', status: 'active', bookings: 22, spent: 19400, rating: 4.8, joined: 'Sep 2023', lastRide: '4 hours ago' },
  { id: 'CU-010', name: 'Meera Iyer', phone: '+91 98765 43219', email: 'meera.i@email.com', status: 'inactive', bookings: 11, spent: 9600, rating: 4.4, joined: 'Oct 2023', lastRide: '3 weeks ago' },
];

const STATUS_CONFIG: Record<string, { color: string; icon: any }> = {
  active: { color: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30', icon: UserCheck },
  inactive: { color: 'bg-slate-500/15 text-slate-400 border border-slate-500/30', icon: UserX },
  blocked: { color: 'bg-red-500/15 text-red-400 border border-red-500/30', icon: UserX },
};

const AVATAR_COLORS = [
  'from-blue-500 to-blue-700',
  'from-purple-500 to-purple-700',
  'from-pink-500 to-pink-700',
  'from-orange-500 to-orange-700',
  'from-cyan-500 to-cyan-700',
  'from-teal-500 to-teal-700',
  'from-indigo-500 to-indigo-700',
  'from-rose-500 to-rose-700',
  'from-amber-500 to-amber-700',
  'from-lime-500 to-lime-700',
];

function CustomersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('bookings');

  const filtered = useMemo(() => {
    let result = CUSTOMERS.filter(c => {
      const matchSearch = !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search) ||
        c.email.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchSearch && matchStatus;
    });

    result = [...result].sort((a, b) => {
      if (sortBy === 'bookings') return b.bookings - a.bookings;
      if (sortBy === 'spent') return b.spent - a.spent;
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0;
    });

    return result;
  }, [search, statusFilter, sortBy]);

  const totalSpent = CUSTOMERS.reduce((s, c) => s + c.spent, 0);
  const totalBookings = CUSTOMERS.reduce((s, c) => s + c.bookings, 0);
  const activeCount = CUSTOMERS.filter(c => c.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Customers</h1>
        <p className="text-slate-400 mt-1">View and manage all customer accounts</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Customers', value: CUSTOMERS.length, color: 'text-white' },
          { label: 'Active', value: activeCount, color: 'text-emerald-400' },
          { label: 'Total Bookings', value: totalBookings, color: 'text-blue-400' },
          { label: 'Total Revenue', value: `₹${(totalSpent / 1000).toFixed(0)}K`, color: 'text-amber-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'active', 'inactive', 'blocked'] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all capitalize ${
              statusFilter === s
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700'
            }`}
          >
            {s} ({s === 'all' ? CUSTOMERS.length : CUSTOMERS.filter(c => c.status === s).length})
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, phone, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="relative">
          <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="pl-9 pr-8 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer"
          >
            <option value="bookings">Sort: Most Bookings</option>
            <option value="spent">Sort: Most Spent</option>
            <option value="rating">Sort: Highest Rating</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
        </div>
      </div>

      <p className="text-sm text-slate-500">
        Showing <span className="text-white font-semibold">{filtered.length}</span> of {CUSTOMERS.length} customers
      </p>

      {/* Customer Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/60">
                <th className="text-left py-4 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Customer</th>
                <th className="text-left py-4 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Contact</th>
                <th className="text-left py-4 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Bookings</th>
                <th className="text-left py-4 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Spent</th>
                <th className="text-left py-4 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Rating</th>
                <th className="text-left py-4 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Last Ride</th>
                <th className="text-left py-4 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500">
                    <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="text-lg font-medium">No customers found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((c, i) => {
                  const statusCfg = STATUS_CONFIG[c.status];
                  return (
                    <tr key={c.id} className={`border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors ${i % 2 === 0 ? '' : 'bg-slate-800/10'}`}>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                            {c.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-white">{c.name}</div>
                            <div className="text-xs text-slate-500">{c.id} · Joined {c.joined}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-1.5 text-sm text-slate-300 mb-1">
                          <Phone className="h-3.5 w-3.5 text-slate-500" />
                          {c.phone}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Mail className="h-3 w-3" />
                          {c.email}
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                          <span className="text-sm text-blue-400 font-bold">{c.bookings}</span>
                        </div>
                      </td>
                      <td className="py-4 px-5 text-sm font-bold text-white">₹{c.spent.toLocaleString()}</td>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                          <span className="text-sm font-bold text-white">{c.rating}</span>
                        </div>
                      </td>
                      <td className="py-4 px-5 text-sm text-slate-400">{c.lastRide}</td>
                      <td className="py-4 px-5">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${statusCfg.color}`}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
