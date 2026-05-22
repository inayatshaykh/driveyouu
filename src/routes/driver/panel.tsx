import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect, useCallback } from 'react';
import { getSession, clearSession } from '@/utils/session';
import { fetchDriverByPhone, updateDriverStatus, type SupabaseDriver } from '@/lib/driverService';
import { fetchDriverBookings, type SupabaseBooking } from '@/lib/bookingService';
import { toast } from 'sonner';

export const Route = createFileRoute('/driver/panel')({
  component: DriverPanel,
});

const DRIVER_COMMISSION = 0.75; // 75% to driver
const COMPANY_COMMISSION = 0.25; // 25% to company

const inr = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  pending:     { label: 'Pending',     cls: 'bg-amber-500/20 text-amber-400 border border-amber-500/30' },
  confirmed:   { label: 'Confirmed',   cls: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
  in_progress: { label: 'In Progress', cls: 'bg-purple-500/20 text-purple-400 border border-purple-500/30' },
  completed:   { label: 'Completed',   cls: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' },
  cancelled:   { label: 'Cancelled',   cls: 'bg-red-500/20 text-red-400 border border-red-500/30' },
};

function DriverPanel() {
  const navigate = useNavigate();
  const session = getSession();
  const [page, setPage] = useState<'dashboard' | 'rides' | 'wallet'>('dashboard');
  const [driver, setDriver] = useState<SupabaseDriver | null>(null);
  const [bookings, setBookings] = useState<SupabaseBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!session?.mobile) {
      navigate({ to: '/login' });
      return;
    }
    loadDriver();
  }, []);

  const loadDriver = useCallback(async () => {
    if (!session?.mobile) return;
    setLoading(true);
    const { data, error } = await fetchDriverByPhone(session.mobile);
    if (error || !data) {
      toast.error('Driver account not found. Contact admin.');
      setLoading(false);
      return;
    }
    setDriver(data);
    setIsOnline(data.status === 'online');
    // Load rides
    const { data: rides } = await fetchDriverBookings(data.name);
    setBookings(rides);
    setLoading(false);
  }, [session?.mobile]);

  const toggleOnline = async () => {
    if (!driver) return;
    const next = isOnline ? 'offline' : 'online';
    await updateDriverStatus(driver.id, next);
    setIsOnline(!isOnline);
    toast.success(`You are now ${next}`);
  };

  const handleLogout = () => {
    clearSession();
    navigate({ to: '/' });
  };

  // Commission calculations
  const completedRides = bookings.filter(b => b.status === 'completed');
  const totalEarned = completedRides.reduce((s, b) => s + (b.total_fare ?? 0) * DRIVER_COMMISSION, 0);
  const totalCommission = completedRides.reduce((s, b) => s + (b.total_fare ?? 0) * COMPANY_COMMISSION, 0);
  const walletBalance = driver?.earnings ?? 0;

  const nav = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'rides',     label: 'My Rides',  icon: '🚗' },
    { id: 'wallet',    label: 'Wallet',     icon: '💰' },
  ] as const;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🚫</div>
          <h2 className="text-xl font-bold text-white mb-2">Not Registered as Driver</h2>
          <p className="text-slate-400 text-sm mb-6">Your number ({session?.mobile}) is not registered as a driver. Contact admin to get added.</p>
          <button onClick={handleLogout} className="px-6 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-sm font-semibold">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1117] text-white flex flex-col">
      {/* Header */}
      <header className="bg-[#111827] border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="UR's Chauffeur" className="w-8 h-8 rounded-lg object-cover" />
          <div>
            <div className="text-sm font-bold text-white">{driver.name}</div>
            <div className="text-xs text-slate-400">{driver.vehicle}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Online toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{isOnline ? 'Online' : 'Offline'}</span>
            <button onClick={toggleOnline}
              className={`relative w-11 h-6 rounded-full transition-colors ${isOnline ? 'bg-emerald-600' : 'bg-slate-700'}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${isOnline ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <button onClick={handleLogout} className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded-lg hover:bg-red-500/10 transition-colors">
            Logout
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-4 pb-24">
        {page === 'dashboard' && (
          <div className="space-y-5 max-w-2xl mx-auto">
            <div>
              <h1 className="text-2xl font-bold text-white">Welcome, {driver.name.split(' ')[0]}!</h1>
              <p className="text-slate-400 text-sm mt-0.5">{driver.zone} · {driver.phone}</p>
            </div>

            {/* Status card */}
            <div className={`rounded-2xl p-5 border ${isOnline ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-900 border-slate-800'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-300">Current Status</div>
                  <div className={`text-2xl font-black mt-1 ${isOnline ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {isOnline ? '🟢 Online' : '⚫ Offline'}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {isOnline ? 'You are visible to admin for ride assignment' : 'Go online to receive rides'}
                  </div>
                </div>
                <button onClick={toggleOnline}
                  className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${isOnline ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-600 text-white'}`}>
                  {isOnline ? 'Go Offline' : 'Go Online'}
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#1a2332] border border-slate-700/50 rounded-2xl p-4">
                <div className="text-xs text-slate-400 mb-1">Wallet Balance</div>
                <div className="text-xl font-black text-emerald-400">{inr(walletBalance)}</div>
                <div className="text-xs text-slate-500 mt-0.5">Available earnings</div>
              </div>
              <div className="bg-[#1a2332] border border-slate-700/50 rounded-2xl p-4">
                <div className="text-xs text-slate-400 mb-1">Total Rides</div>
                <div className="text-xl font-black text-white">{driver.rides}</div>
                <div className="text-xs text-slate-500 mt-0.5">Completed trips</div>
              </div>
              <div className="bg-[#1a2332] border border-slate-700/50 rounded-2xl p-4">
                <div className="text-xs text-slate-400 mb-1">Total Earned (75%)</div>
                <div className="text-xl font-black text-blue-400">{inr(totalEarned)}</div>
                <div className="text-xs text-slate-500 mt-0.5">Your share of fares</div>
              </div>
              <div className="bg-[#1a2332] border border-slate-700/50 rounded-2xl p-4">
                <div className="text-xs text-slate-400 mb-1">Commission Paid (25%)</div>
                <div className="text-xl font-black text-amber-400">{inr(totalCommission)}</div>
                <div className="text-xs text-slate-500 mt-0.5">Company's share</div>
              </div>
            </div>

            {/* Recent rides */}
            <div className="bg-[#1a2332] border border-slate-700/50 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-700/50">
                <h3 className="font-bold text-white text-sm">Recent Rides</h3>
              </div>
              {bookings.length === 0 ? (
                <div className="py-10 text-center text-slate-500 text-sm">No rides yet</div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {bookings.slice(0, 5).map(b => (
                    <div key={b.id} className="px-4 py-3 flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-white truncate">{b.pickup_address}</div>
                        <div className="text-xs text-slate-500">{b.customer_name} · {new Date(b.created_at).toLocaleDateString('en-IN')}</div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                        <div className="text-right">
                          <div className="text-sm font-bold text-emerald-400">
                            {inr((b.total_fare ?? 0) * DRIVER_COMMISSION)}
                          </div>
                          <div className="text-xs text-slate-500">your share</div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${STATUS_CFG[b.status]?.cls ?? 'bg-slate-700 text-slate-300'}`}>
                          {STATUS_CFG[b.status]?.label ?? b.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {page === 'rides' && (
          <div className="space-y-4 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-white">My Rides</h1>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: 'Total', count: bookings.length, color: 'text-white' },
                { label: 'Completed', count: bookings.filter(b => b.status === 'completed').length, color: 'text-emerald-400' },
                { label: 'Cancelled', count: bookings.filter(b => b.status === 'cancelled').length, color: 'text-red-400' },
              ].map(s => (
                <div key={s.label} className="bg-[#1a2332] border border-slate-700/50 rounded-xl p-3">
                  <div className={`text-xl font-black ${s.color}`}>{s.count}</div>
                  <div className="text-xs text-slate-500">{s.label}</div>
                </div>
              ))}
            </div>
            {bookings.length === 0 ? (
              <div className="py-16 text-center text-slate-500">No rides assigned yet</div>
            ) : (
              <div className="space-y-3">
                {bookings.map(b => (
                  <div key={b.id} className="bg-[#1a2332] border border-slate-700/50 rounded-2xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-mono text-emerald-400">#{b.id.slice(0, 8).toUpperCase()}</span>
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${STATUS_CFG[b.status]?.cls ?? 'bg-slate-700 text-slate-300'}`}>
                        {STATUS_CFG[b.status]?.label ?? b.status}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-white mb-1">{b.pickup_address}</div>
                    {b.drop_address && <div className="text-xs text-slate-400 mb-2">→ {b.drop_address}</div>}
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                      <span>{b.customer_name} · {b.customer_phone}</span>
                      <span>{new Date(b.created_at).toLocaleDateString('en-IN')}</span>
                    </div>
                    {/* Fare split */}
                    <div className="bg-slate-800/60 rounded-xl p-3 space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Total Fare</span>
                        <span className="text-white font-semibold">₹{b.total_fare?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Your Share (75%)</span>
                        <span className="text-emerald-400 font-bold">{inr((b.total_fare ?? 0) * DRIVER_COMMISSION)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Company (25%)</span>
                        <span className="text-amber-400">{inr((b.total_fare ?? 0) * COMPANY_COMMISSION)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {page === 'wallet' && (
          <div className="space-y-5 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-white">Wallet</h1>

            {/* Balance card */}
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl p-6 text-white">
              <div className="text-sm font-medium opacity-80 mb-1">Available Balance</div>
              <div className="text-4xl font-black mb-1">{inr(walletBalance)}</div>
              <div className="text-xs opacity-70">Accumulated earnings from completed rides</div>
            </div>

            {/* Commission info */}
            <div className="bg-[#1a2332] border border-slate-700/50 rounded-2xl p-5">
              <h3 className="font-bold text-white mb-4">Commission Structure</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <div>
                    <div className="text-sm font-semibold text-emerald-400">Your Earnings</div>
                    <div className="text-xs text-slate-400">Per completed ride</div>
                  </div>
                  <div className="text-2xl font-black text-emerald-400">75%</div>
                </div>
                <div className="flex items-center justify-between p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <div>
                    <div className="text-sm font-semibold text-amber-400">Company Commission</div>
                    <div className="text-xs text-slate-400">Platform fee per ride</div>
                  </div>
                  <div className="text-2xl font-black text-amber-400">25%</div>
                </div>
              </div>
            </div>

            {/* Payment info */}
            <div className="bg-[#1a2332] border border-slate-700/50 rounded-2xl p-5">
              <h3 className="font-bold text-white mb-3">Payment Info</h3>
              <div className="space-y-2 text-sm text-slate-400">
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">•</span>
                  <span><span className="text-white font-semibold">Online payments</span> — Full fare goes to company. Your 75% is credited to wallet after ride completion.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5">•</span>
                  <span><span className="text-white font-semibold">Cash payments</span> — You collect full fare. 25% commission is automatically deducted from your wallet.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">•</span>
                  <span>Wallet balance is settled weekly. Contact admin for withdrawals.</span>
                </div>
              </div>
            </div>

            {/* Ride earnings history */}
            <div className="bg-[#1a2332] border border-slate-700/50 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-700/50">
                <h3 className="font-bold text-white text-sm">Earnings History</h3>
              </div>
              {completedRides.length === 0 ? (
                <div className="py-10 text-center text-slate-500 text-sm">No completed rides yet</div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {completedRides.map(b => (
                    <div key={b.id} className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <div className="text-sm text-white truncate max-w-[180px]">{b.pickup_address}</div>
                        <div className="text-xs text-slate-500">{new Date(b.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-emerald-400">+{inr((b.total_fare ?? 0) * DRIVER_COMMISSION)}</div>
                        <div className="text-xs text-slate-500">of ₹{b.total_fare?.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#111827] border-t border-slate-800 flex">
        {nav.map(item => (
          <button key={item.id} onClick={() => setPage(item.id)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-semibold transition-colors ${
              page === item.id ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
            }`}>
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
