import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect, useCallback } from 'react';
import { MapPin, Clock, Car, Calendar, RefreshCw, Loader2, ChevronDown, ChevronUp, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { fetchCustomerBookings, type SupabaseBooking } from '@/lib/bookingService';
import { getSession } from '@/utils/session';
import { Navbar } from '@/components/Navbar';

export const Route = createFileRoute('/customer/bookings')({
  component: CustomerBookingsPage,
});

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  pending:     { color: 'text-amber-400',  bg: 'bg-amber-500/15 border border-amber-500/30',   label: 'Pending' },
  confirmed:   { color: 'text-blue-400',   bg: 'bg-blue-500/15 border border-blue-500/30',     label: 'Confirmed' },
  in_progress: { color: 'text-purple-400', bg: 'bg-purple-500/15 border border-purple-500/30', label: 'In Progress' },
  completed:   { color: 'text-emerald-400',bg: 'bg-emerald-500/15 border border-emerald-500/30',label: 'Completed' },
  cancelled:   { color: 'text-red-400',    bg: 'bg-red-500/15 border border-red-500/30',       label: 'Cancelled' },
};

const TYPE_LABELS: Record<string, string> = {
  hourly: '⏱ Hourly',
  multiday: '📅 Multi-Day',
  outstation: '🗺 Outstation',
};

function BookingCard({ booking }: { booking: SupabaseBooking }) {
  const [expanded, setExpanded] = useState(false);
  const status = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.pending;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-all duration-200">
      {/* Card Header */}
      <div
        className="flex items-start justify-between p-4 cursor-pointer"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-xs font-mono font-bold text-emerald-400">
              #{booking.id.slice(0, 8).toUpperCase()}
            </span>
            <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${status.bg} ${status.color}`}>
              {status.label}
            </span>
            <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
              {TYPE_LABELS[booking.booking_type] ?? booking.booking_type}
            </span>
          </div>

          <div className="flex items-start gap-1.5 mb-1">
            <MapPin className="h-3.5 w-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-white font-medium truncate">{booking.pickup_address}</span>
          </div>
          {booking.drop_address && (
            <div className="flex items-start gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-red-400 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-slate-400 truncate">{booking.drop_address}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 ml-3 flex-shrink-0">
          <span className="text-lg font-bold text-white">₹{booking.total_fare?.toLocaleString()}</span>
          <span className="text-xs text-slate-500">
            {new Date(booking.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </span>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-slate-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-500" />
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-slate-800 px-4 pb-4 pt-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800 rounded-xl p-3">
              <div className="text-xs text-slate-500 mb-1">Vehicle</div>
              <div className="text-sm font-semibold text-white">{booking.car_category}</div>
              <div className="text-xs text-slate-400">{booking.transmission}</div>
            </div>
            <div className="bg-slate-800 rounded-xl p-3">
              <div className="text-xs text-slate-500 mb-1">Schedule</div>
              <div className="text-sm font-semibold text-white">
                {booking.scheduled_date || (booking.driver_needed === 'now' ? 'Now' : '—')}
              </div>
              <div className="text-xs text-slate-400">{booking.scheduled_time || ''}</div>
            </div>
            {booking.duration && (
              <div className="bg-slate-800 rounded-xl p-3">
                <div className="text-xs text-slate-500 mb-1">Duration</div>
                <div className="text-sm font-semibold text-white">{booking.duration}</div>
              </div>
            )}
            {booking.days && (
              <div className="bg-slate-800 rounded-xl p-3">
                <div className="text-xs text-slate-500 mb-1">Days</div>
                <div className="text-sm font-semibold text-white">{booking.days} days</div>
              </div>
            )}
          </div>

          {/* Fare breakdown */}
          <div className="bg-emerald-900/20 border border-emerald-800/30 rounded-xl p-3">
            <div className="text-xs text-slate-400 mb-2 font-semibold">Fare Breakdown</div>
            <div className="space-y-1 text-sm">
              {booking.base_fare != null && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Base Fare</span>
                  <span className="text-white">₹{booking.base_fare.toLocaleString()}</span>
                </div>
              )}
              {(booking.night_charge ?? 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Night Charge</span>
                  <span className="text-orange-400">₹{booking.night_charge?.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-bold border-t border-emerald-800/30 pt-1 mt-1">
                <span className="text-emerald-400">Total</span>
                <span className="text-emerald-400">₹{booking.total_fare?.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Assigned driver */}
          {booking.assigned_driver && (
            <div className="flex items-center gap-3 bg-slate-800 rounded-xl p-3 border border-slate-700">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {booking.assigned_driver.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <div className="text-xs text-slate-500">Assigned Driver</div>
                <div className="text-sm font-semibold text-white">{booking.assigned_driver}</div>
              </div>
            </div>
          )}

          {/* Admin notes */}
          {booking.admin_notes && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
              <div className="text-xs text-blue-400 font-semibold mb-1">Note from Admin</div>
              <div className="text-sm text-slate-300">{booking.admin_notes}</div>
            </div>
          )}

          {/* Status pending message */}
          {booking.status === 'pending' && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2">
              <Clock className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs text-amber-400 font-semibold">Awaiting Confirmation</div>
                <div className="text-xs text-slate-400 mt-0.5">Our team will contact you shortly to confirm your booking.</div>
              </div>
            </div>
          )}

          <div className="text-xs text-slate-600 text-right">
            Booked on {new Date(booking.created_at).toLocaleString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit'
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function CustomerBookingsPage() {
  const [bookings, setBookings] = useState<SupabaseBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const session = getSession();
  const mobile = session?.mobile;

  const load = useCallback(async () => {
    if (!mobile) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await fetchCustomerBookings(mobile);
    if (error) {
      toast.error('Failed to load bookings');
    } else {
      setBookings(data);
    }
    setLoading(false);
  }, [mobile]);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);

  const counts = {
    all: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    in_progress: bookings.filter(b => b.status === 'in_progress').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">My Bookings</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              {mobile} · {bookings.length} total
            </p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-sm font-semibold transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
          {(['all', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all capitalize ${
                filter === s
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              {s.replace('_', ' ')} ({counts[s as keyof typeof counts] ?? bookings.length})
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-20 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            <p>Loading your bookings...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <div className="h-16 w-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
              <Calendar className="h-8 w-8 text-slate-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-300">
                {filter === 'all' ? 'No bookings yet' : `No ${filter.replace('_', ' ')} bookings`}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {filter === 'all'
                  ? 'Your bookings will appear here after you book a driver'
                  : 'Try a different filter'}
              </p>
            </div>
            {filter === 'all' && (
              <a
                href="/booking"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-colors"
              >
                Book a Driver
              </a>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(b => (
              <BookingCard key={b.id} booking={b} />
            ))}
          </div>
        )}

        {/* Support note */}
        {bookings.length > 0 && (
          <div className="mt-6 p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-start gap-3">
            <Phone className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-sm font-semibold text-white">Need help?</div>
              <div className="text-xs text-slate-400 mt-0.5">
                For booking changes or cancellations, contact our support team.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
