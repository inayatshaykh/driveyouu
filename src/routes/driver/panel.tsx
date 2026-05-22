import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect, useCallback } from 'react';
import { getSession, clearSession } from '@/utils/session';
import { fetchDriverByPhone, updateDriverStatus, type SupabaseDriver } from '@/lib/driverService';
import { fetchDriverBookings, updateBookingStatus, type SupabaseBooking } from '@/lib/bookingService';
import {
  getDriverWallet, processCashPayment, processOnlinePayment,
  fetchWalletTransactions, createWithdrawalRequest, type WalletTransaction,
} from '@/lib/walletService';
import { toast } from 'sonner';

export const Route = createFileRoute('/driver/panel')({
  component: DriverPanel,
});

const DRIVER_COMMISSION = 0.75;
const COMPANY_COMMISSION = 0.25;
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
  const [walletData, setWalletData] = useState({ balance: 0, totalEarned: 0, totalCommission: 0 });
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [paymentModal, setPaymentModal] = useState<{ booking: SupabaseBooking } | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    if (!session?.mobile) { navigate({ to: '/login' }); return; }
    loadAll();
  }, []);

  const loadAll = useCallback(async () => {
    if (!session?.mobile) return;
    setLoading(true);
    const { data, error } = await fetchDriverByPhone(session.mobile);
    if (error || !data) { toast.error('Driver account not found. Contact admin.'); setLoading(false); return; }
    setDriver(data);
    setIsOnline(data.status === 'online');
    const [{ data: rides }, wallet, txns] = await Promise.all([
      fetchDriverBookings(data.name),
      getDriverWallet(data.id),
      fetchWalletTransactions(data.id),
    ]);
    setBookings(rides);
    setWalletData({ balance: wallet.balance, totalEarned: wallet.totalEarned, totalCommission: wallet.totalCommission });
    setTransactions(txns);
    setLoading(false);
  }, [session?.mobile]);

  const toggleOnline = async () => {
    if (!driver) return;
    const next = isOnline ? 'offline' : 'online';
    await updateDriverStatus(driver.id, next);
    setIsOnline(!isOnline);
    toast.success(`You are now ${next}`);
  };

  const handleStartRide = async (bookingId: string) => {
    const { error } = await updateBookingStatus(bookingId, 'in_progress');
    if (error) { toast.error('Failed to start ride'); return; }
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'in_progress' } : b));
    toast.success('Ride started!');
  };

  const handleCompleteRide = (booking: SupabaseBooking) => {
    setPaymentModal({ booking });
  };

  const handleCashPayment = async () => {
    if (!driver || !paymentModal) return;
    const { booking } = paymentModal;
    setPaymentModal(null);
    await updateBookingStatus(booking.id, 'completed');
    const { error } = await processCashPayment(driver.id, booking.id, booking.total_fare ?? 0);
    if (error) { toast.error('Payment processing failed: ' + error); return; }
    const commission = Math.round((booking.total_fare ?? 0) * COMPANY_COMMISSION);
    const earned = Math.round((booking.total_fare ?? 0) * DRIVER_COMMISSION);
    toast.success(`Cash collected! ₹${commission.toLocaleString()} commission deducted. Net: ₹${(earned - commission).toLocaleString()}`);
    await loadAll();
  };

  const handleOnlinePayment = async () => {
    if (!driver || !paymentModal) return;
    const { booking } = paymentModal;
    setPaymentModal(null);
    await updateBookingStatus(booking.id, 'completed');
    const { error } = await processOnlinePayment(driver.id, booking.id, booking.total_fare ?? 0);
    if (error) { toast.error('Payment processing failed: ' + error); return; }
    const earned = Math.round((booking.total_fare ?? 0) * DRIVER_COMMISSION);
    toast.success(`Online payment recorded! ₹${earned.toLocaleString()} credited to wallet`);
    await loadAll();
  };

  const handleWithdraw = async () => {
    if (!driver) return;
    const amount = Number(withdrawAmount);
    if (!amount || amount <= 0) { toast.error('Enter a valid amount'); return; }
    setWithdrawing(true);
    const { error } = await createWithdrawalRequest(driver.id, driver.name, driver.phone, amount);
    setWithdrawing(false);
    if (error) { toast.error('Failed to submit request'); return; }
    toast.success('Withdrawal request submitted! Admin will process it.');
    setWithdrawAmount('');
  };

  const handleLogout = () => { clearSession(); navigate({ to: '/' }); };

  const completedRides = bookings.filter(b => b.status === 'completed');
  const activeRides = bookings.filter(b => b.status === 'confirmed' || b.status === 'in_progress');

  const nav = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'rides',     label: 'My Rides',  icon: '🚗', badge: activeRides.length },
    { id: 'wallet',    label: 'Wallet',     icon: '💰' },
  ] as const;

  if (loading) return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-400 text-sm">Loading...</p>
      </div>
    </div>
  );

  if (!driver) return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-4">🚫</div>
        <h2 className="text-xl font-bold text-white mb-2">Not Registered as Driver</h2>
        <p className="text-slate-400 text-sm mb-6">Your number ({session?.mobile}) is not registered. Contact admin.</p>
        <button onClick={handleLogout} className="px-6 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-sm font-semibold">Go Back</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f1117] text-white flex flex-col">
      {/* Header */}
      <header className="bg-[#111827] border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="UR's Chauffeur" className="w-8 h-8 rounded-lg object-cover" />
          <div>
            <div className="text-sm font-bold text-white">{driver.name}</div>
            <div className="text-xs text-slate-400 truncate max-w-[160px]">{driver.vehicle}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{isOnline ? 'Online' : 'Offline'}</span>
            <button onClick={toggleOnline}
              className={`relative w-11 h-6 rounded-full transition-colors ${isOnline ? 'bg-emerald-600' : 'bg-slate-700'}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${isOnline ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <button onClick={handleLogout} className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded-lg hover:bg-red-500/10 transition-colors">Logout</button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-4 pb-24">

        {/* ── DASHBOARD ── */}
        {page === 'dashboard' && (
          <div className="space-y-5 max-w-2xl mx-auto">
            <div>
              <h1 className="text-2xl font-bold text-white">Welcome, {driver.name.split(' ')[0]}!</h1>
              <p className="text-slate-400 text-sm mt-0.5">{driver.zone} · {driver.phone}</p>
            </div>
            <div className={`rounded-2xl p-5 border ${isOnline ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-900 border-slate-800'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-300">Status</div>
                  <div className={`text-2xl font-black mt-1 ${isOnline ? 'text-emerald-400' : 'text-slate-400'}`}>{isOnline ? '🟢 Online' : '⚫ Offline'}</div>
                  <div className="text-xs text-slate-500 mt-1">{isOnline ? 'Visible to admin for assignment' : 'Go online to receive rides'}</div>
                </div>
                <button onClick={toggleOnline}
                  className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${isOnline ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-600 text-white'}`}>
                  {isOnline ? 'Go Offline' : 'Go Online'}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#1a2332] border border-slate-700/50 rounded-2xl p-4">
                <div className="text-xs text-slate-400 mb-1">Wallet Balance</div>
                <div className={`text-xl font-black ${walletData.balance < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {walletData.balance < 0 ? '-' : ''}{inr(Math.abs(walletData.balance))}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">Available</div>
              </div>
              <div className="bg-[#1a2332] border border-slate-700/50 rounded-2xl p-4">
                <div className="text-xs text-slate-400 mb-1">Active Rides</div>
                <div className="text-xl font-black text-purple-400">{activeRides.length}</div>
                <div className="text-xs text-slate-500 mt-0.5">In progress</div>
              </div>
              <div className="bg-[#1a2332] border border-slate-700/50 rounded-2xl p-4">
                <div className="text-xs text-slate-400 mb-1">Total Earned</div>
                <div className="text-xl font-black text-blue-400">{inr(walletData.totalEarned)}</div>
                <div className="text-xs text-slate-500 mt-0.5">Lifetime (75%)</div>
              </div>
              <div className="bg-[#1a2332] border border-slate-700/50 rounded-2xl p-4">
                <div className="text-xs text-slate-400 mb-1">Commission Paid</div>
                <div className="text-xl font-black text-amber-400">{inr(walletData.totalCommission)}</div>
                <div className="text-xs text-slate-500 mt-0.5">To company (25%)</div>
              </div>
            </div>
            {/* Active rides quick view */}
            {activeRides.length > 0 && (
              <div className="bg-[#1a2332] border border-emerald-500/30 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
                  <h3 className="font-bold text-white text-sm">Active Rides</h3>
                  <button onClick={() => setPage('rides')} className="text-xs text-emerald-400">View all →</button>
                </div>
                {activeRides.map(b => (
                  <div key={b.id} className="px-4 py-3 border-b border-slate-800 last:border-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-white">{b.pickup_address}</div>
                        <div className="text-xs text-slate-500">{b.customer_name}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${STATUS_CFG[b.status]?.cls}`}>
                        {STATUS_CFG[b.status]?.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── RIDES ── */}
        {page === 'rides' && (
          <div className="space-y-4 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-white">My Rides</h1>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: 'Total', count: bookings.length, color: 'text-white' },
                { label: 'Completed', count: completedRides.length, color: 'text-emerald-400' },
                { label: 'Active', count: activeRides.length, color: 'text-purple-400' },
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
                    <div className="bg-slate-800/60 rounded-xl p-3 space-y-1.5 mb-3">
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
                    {b.status === 'confirmed' && (
                      <button onClick={() => handleStartRide(b.id)}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-colors">
                        🚗 Start Ride
                      </button>
                    )}
                    {b.status === 'in_progress' && (
                      <button onClick={() => handleCompleteRide(b)}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors">
                        ✅ Mark as Complete
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── WALLET ── */}
        {page === 'wallet' && (
          <div className="space-y-5 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-white">Wallet</h1>
            {/* Balance card */}
            <div className={`rounded-2xl p-6 ${walletData.balance < 0 ? 'bg-gradient-to-br from-red-900 to-red-800' : 'bg-gradient-to-br from-emerald-600 to-emerald-800'}`}>
              <div className="text-sm font-medium opacity-80 mb-1">Available Balance</div>
              <div className="text-4xl font-black mb-1">
                {walletData.balance < 0 ? '-' : ''}{inr(Math.abs(walletData.balance))}
              </div>
              {walletData.balance < 0 && (
                <div className="text-xs bg-red-500/30 rounded-lg px-2 py-1 inline-block mt-1">⚠️ Negative balance — commission exceeded earnings</div>
              )}
            </div>
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#1a2332] border border-slate-700/50 rounded-2xl p-4">
                <div className="text-xs text-slate-400 mb-1">Total Earned</div>
                <div className="text-xl font-black text-blue-400">{inr(walletData.totalEarned)}</div>
                <div className="text-xs text-slate-500">Lifetime (75% of fares)</div>
              </div>
              <div className="bg-[#1a2332] border border-slate-700/50 rounded-2xl p-4">
                <div className="text-xs text-slate-400 mb-1">Commission Deducted</div>
                <div className="text-xl font-black text-amber-400">{inr(walletData.totalCommission)}</div>
                <div className="text-xs text-slate-500">Company's 25%</div>
              </div>
            </div>
            {/* Withdrawal request */}
            <div className="bg-[#1a2332] border border-slate-700/50 rounded-2xl p-5">
              <h3 className="font-bold text-white mb-3">Request Withdrawal</h3>
              <div className="flex gap-3">
                <div className="flex-1 flex items-stretch rounded-xl overflow-hidden border border-slate-700 focus-within:ring-2 focus-within:ring-emerald-500">
                  <span className="flex items-center px-3 bg-slate-800 text-slate-400 text-sm border-r border-slate-700">₹</span>
                  <input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="flex-1 px-3 py-2.5 bg-slate-800 text-white text-sm focus:outline-none" />
                </div>
                <button onClick={handleWithdraw} disabled={withdrawing || !withdrawAmount}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold rounded-xl text-sm transition-colors">
                  {withdrawing ? '...' : 'Request'}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">Admin will review and process your request manually.</p>
            </div>
            {/* Transaction history */}
            <div className="bg-[#1a2332] border border-slate-700/50 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-700/50">
                <h3 className="font-bold text-white text-sm">Transaction History</h3>
              </div>
              {transactions.length === 0 ? (
                <div className="py-10 text-center text-slate-500 text-sm">No transactions yet</div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {transactions.map(t => (
                    <div key={t.id} className="px-4 py-3 flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-white truncate">{t.description}</div>
                        <div className="text-xs text-slate-500">{new Date(t.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                      </div>
                      <div className={`text-sm font-bold flex-shrink-0 ml-3 ${
                        t.type === 'credit' ? 'text-emerald-400' :
                        t.type === 'commission' || t.type === 'debit' ? 'text-red-400' :
                        'text-amber-400'
                      }`}>
                        {t.type === 'credit' ? '+' : '-'}{inr(t.amount)}
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
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-semibold transition-colors relative ${
              page === item.id ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
            }`}>
            <span className="text-lg">{item.icon}</span>
            {item.label}
            {'badge' in item && item.badge > 0 && (
              <span className="absolute top-1.5 right-1/4 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Payment Modal */}
      {paymentModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <button className="absolute inset-0 bg-black/60" onClick={() => setPaymentModal(null)} />
          <div className="relative w-full max-w-sm bg-[#111827] border border-slate-700 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-1">Complete Ride</h2>
            <p className="text-xs text-slate-400 mb-4">
              Total fare: <span className="text-white font-bold">₹{paymentModal.booking.total_fare?.toLocaleString()}</span>
            </p>
            <div className="bg-slate-800 rounded-xl p-3 mb-5 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Your share (75%)</span>
                <span className="text-emerald-400 font-bold">{inr((paymentModal.booking.total_fare ?? 0) * 0.75)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Company (25%)</span>
                <span className="text-amber-400">{inr((paymentModal.booking.total_fare ?? 0) * 0.25)}</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mb-3 text-center">How did the customer pay?</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleCashPayment}
                className="flex flex-col items-center gap-2 p-4 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl transition-all">
                <span className="text-2xl">💵</span>
                <span className="text-sm font-bold text-amber-400">Collect Cash</span>
                <span className="text-xs text-slate-500 text-center">25% auto-deducted from wallet</span>
              </button>
              <button onClick={handleOnlinePayment}
                className="flex flex-col items-center gap-2 p-4 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-xl transition-all">
                <span className="text-2xl">📱</span>
                <span className="text-sm font-bold text-blue-400">Online / QR</span>
                <span className="text-xs text-slate-500 text-center">75% credited to wallet</span>
              </button>
            </div>
            <button onClick={() => setPaymentModal(null)}
              className="mt-3 w-full py-2 text-slate-500 text-sm hover:text-slate-300 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
