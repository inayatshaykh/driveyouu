import { createFileRoute } from '@tanstack/react-router';
import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Search, Filter, Calendar, MapPin, Car, ChevronDown,
  RefreshCw, CheckCircle, XCircle, Clock, Loader2, X, Save, User
} from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchAllBookings,
  updateBookingStatus,
  subscribeToBookings,
  type SupabaseBooking,
} from '@/lib/bookingService';

export const Route = createFileRoute('/admin/bookings')({
  component: BookingsPage,
});

const STATUS_COLORS: Record<string, string> = {
  pending:    'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  confirmed:  'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  in_progress:'bg-purple-500/15 text-purple-400 border border-purple-500/30',
  completed:  'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  cancelled:  'bg-red-500/15 text-red-400 border border-red-500/30',
};

const TYPE_COLORS: Record<string, string> = {
  hourly:     'bg-orange-500/15 text-orange-400',
  multiday:   'bg-cyan-500/15 text-cyan-400',
  outstation: 'bg-pink-500/15 text-pink-400',
};

const ALL_STATUSES = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];

// ─── Detail / Edit Modal ──────────────────────────────────────────────────────
function BookingDetailModal({
  booking,
  onClose,
  onSave,
}: {
  booking: SupabaseBooking;
  onClose: () => void;
  onSave: (id: string, status: string, driver: string, notes: string) => Promise<void>;
}) {
  const [status, setStatus] = useState(booking.status);
  const [driver, setDriver] = useState(booking.assigned_driver ?? '');
  const [notes, setNotes] = useState(booking.admin_notes ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(booking.id, status, driver, notes);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Booking Details</h2>
            <p className="text-xs text-emerald-400 font-mono mt-0.5">{booking.id.slice(0, 8).toUpperCase()}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Customer Info */}
        <div className="bg-slate-800 rounded-xl p-4 mb-4 border border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm">
              {booking.customer_name?.split(' ').map(n => n[0]).join('') || 'U'}
            </div>
            <div>
              <div className="text-sm font-semibold text-white">{booking.customer_name}</div>
              <div className="text-xs text-slate-400">{booking.customer_phone}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div><span className="text-slate-500">Type:</span> <span className="text-white capitalize font-medium">{booking.booking_type}</span></div>
            <div><span className="text-slate-500">Vehicle:</span> <span className="text-white font-medium">{booking.car_category} · {booking.transmission}</span></div>
            <div><span className="text-slate-500">Date:</span> <span className="text-white font-medium">{booking.scheduled_date || 'Now'}</span></div>
            <div><span className="text-slate-500">Time:</span> <span className="text-white font-medium">{booking.scheduled_time || '—'}</span></div>
            {booking.duration && <div><span className="text-slate-500">Duration:</span> <span className="text-white font-medium">{booking.duration}</span></div>}
            {booking.days && <div><span className="text-slate-500">Days:</span> <span className="text-white font-medium">{booking.days}</span></div>}
          </div>
        </div>

        {/* Route */}
        <div className="bg-slate-800 rounded-xl p-4 mb-4 border border-slate-700">
          <div className="flex items-start gap-2 mb-2">
            <MapPin className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-xs text-slate-400">Pickup</div>
              <div className="text-sm text-white font-medium">{booking.pickup_address}</div>
            </div>
          </div>
          {booking.drop_address && (
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs text-slate-400">Drop</div>
                <div className="text-sm text-white font-medium">{booking.drop_address}</div>
              </div>
            </div>
          )}
        </div>

        {/* Fare */}
        <div className="bg-emerald-900/30 border border-emerald-700/30 rounded-xl p-4 mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-400">Base Fare</span>
            <span className="text-white">₹{booking.base_fare?.toLocaleString() ?? '—'}</span>
          </div>
          {(booking.night_charge ?? 0) > 0 && (
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-400">Night Charge</span>
              <span className="text-orange-400">₹{booking.night_charge?.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between font-bold border-t border-emerald-700/30 pt-2 mt-2">
            <span className="text-emerald-400">Total</span>
            <span className="text-emerald-400 text-lg">₹{booking.total_fare?.toLocaleString()}</span>
          </div>
        </div>

        {/* Admin Controls */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Update Status</label>
            <div className="grid grid-cols-3 gap-2">
              {ALL_STATUSES.map(s => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${
                    status === s
                      ? STATUS_COLORS[s] + ' ring-2 ring-offset-1 ring-offset-slate-900'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'
                  }`}
                >
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              <User className="inline h-4 w-4 mr-1" />
              Assign Driver
            </label>
            <input
              type="text"
              value={driver}
              onChange={e => setDriver(e.target.value)}
              placeholder="Enter driver name..."
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Admin Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add notes for this booking..."
              rows={3}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 text-slate-300 font-semibold rounded-xl hover:bg-slate-700 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors text-sm"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function BookingsPage() {
  const [bookings, setBookings] = useState<SupabaseBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<SupabaseBooking | null>(null);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    const { data, error } = await fetchAllBookings();
    if (error) {
      toast.error('Failed to load bookings: ' + error);
    } else {
      setBookings(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadBookings();

    // Real-time subscription
    const channel = subscribeToBookings((updated) => {
      setBookings(prev => {
        const idx = prev.findIndex(b => b.id === updated.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updated;
          return next;
        }
        return [updated, ...prev];
      });
    });

    return () => { channel.unsubscribe(); };
  }, [loadBookings]);

  const handleSave = useCallback(async (
    id: string, status: string, driver: string, notes: string
  ) => {
    const { error } = await updateBookingStatus(id, status, driver, notes);
    if (error) {
      toast.error('Failed to update: ' + error);
    } else {
      toast.success('Booking updated successfully');
      setBookings(prev => prev.map(b =>
        b.id === id
          ? { ...b, status, assigned_driver: driver, admin_notes: notes, updated_at: new Date().toISOString() }
          : b
      ));
    }
  }, []);

  const filtered = useMemo(() => {
    return bookings.filter(b => {
      const matchSearch = !search ||
        b.id.toLowerCase().includes(search.toLowerCase()) ||
        b.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
        b.customer_phone?.includes(search) ||
        b.pickup_address?.toLowerCase().includes(search.toLowerCase()) ||
        b.assigned_driver?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || b.status === statusFilter;
      const matchType = typeFilter === 'all' || b.booking_type === typeFilter;
      const matchDate = !dateFilter || b.scheduled_date === dateFilter || b.created_at?.startsWith(dateFilter);
      return matchSearch && matchStatus && matchType && matchDate;
    });
  }, [bookings, search, statusFilter, typeFilter, dateFilter]);

  const counts = useMemo(() => ({
    all: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    in_progress: bookings.filter(b => b.status === 'in_progress').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  }), [bookings]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Bookings</h1>
          <p className="text-slate-400 mt-1">Real-time bookings from customers — manage manually</p>
        </div>
        <button
          onClick={loadBookings}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled'] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all capitalize ${
              statusFilter === s
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700'
            }`}
          >
            {s.replace('_', ' ')} ({counts[s as keyof typeof counts] ?? bookings.length})
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by customer, phone, location..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
            <option value="hourly">Hourly</option>
            <option value="multiday">Multi-Day</option>
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

      <p className="text-sm text-slate-500">
        Showing <span className="text-white font-semibold">{filtered.length}</span> of {bookings.length} bookings
        {counts.pending > 0 && (
          <span className="ml-3 px-2 py-0.5 bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-semibold">
            {counts.pending} pending action
          </span>
        )}
      </p>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-3 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            <p>Loading bookings...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-800/60">
                  <th className="text-left py-4 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Booking</th>
                  <th className="text-left py-4 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Customer</th>
                  <th className="text-left py-4 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Pickup</th>
                  <th className="text-left py-4 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Type</th>
                  <th className="text-left py-4 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Fare</th>
                  <th className="text-left py-4 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Driver</th>
                  <th className="text-left py-4 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="text-left py-4 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-20 text-center text-slate-500">
                      <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
                      <p className="text-lg font-medium">No bookings found</p>
                      <p className="text-sm mt-1">
                        {bookings.length === 0
                          ? 'Bookings will appear here when customers place orders'
                          : 'Try adjusting your filters'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((b, i) => (
                    <tr
                      key={b.id}
                      className={`border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors cursor-pointer ${i % 2 === 0 ? '' : 'bg-slate-800/10'}`}
                      onClick={() => setSelectedBooking(b)}
                    >
                      <td className="py-4 px-5">
                        <div className="font-semibold text-emerald-400 text-xs font-mono">{b.id.slice(0, 8).toUpperCase()}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {new Date(b.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {b.customer_name?.split(' ').map(n => n[0]).join('') || 'U'}
                          </div>
                          <div>
                            <div className="text-sm text-white font-medium">{b.customer_name}</div>
                            <div className="text-xs text-slate-500">{b.customer_phone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-start gap-1.5 max-w-[160px]">
                          <MapPin className="h-3.5 w-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <span className="text-xs text-white truncate">{b.pickup_address}</span>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${TYPE_COLORS[b.booking_type] ?? 'bg-slate-700 text-slate-300'}`}>
                          {b.booking_type}
                        </span>
                        <div className="text-xs text-slate-500 mt-1">{b.car_category} · {b.transmission}</div>
                      </td>
                      <td className="py-4 px-5 text-sm font-bold text-white">
                        ₹{b.total_fare?.toLocaleString()}
                      </td>
                      <td className="py-4 px-5">
                        {b.assigned_driver ? (
                          <div className="flex items-center gap-1.5 text-sm text-slate-300">
                            <Car className="h-3.5 w-3.5 text-emerald-400" />
                            {b.assigned_driver}
                          </div>
                        ) : (
                          <span className="text-xs text-amber-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${STATUS_COLORS[b.status] ?? 'bg-slate-700 text-slate-300'}`}>
                          {b.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-4 px-5" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedBooking(b)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-emerald-600 border border-slate-700 hover:border-emerald-600 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition-all"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
