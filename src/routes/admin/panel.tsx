import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { useState, useCallback, useEffect, useRef } from 'react';
import { getAdminSession, clearAdminSession } from '@/utils/adminSession';
import { clearSession } from '@/utils/session';
import {
  fetchAllBookings,
  updateBookingStatus,
  subscribeToBookings,
  type SupabaseBooking,
} from '@/lib/bookingService';
import {
  fetchDrivers,
  addDriver as addDriverToDb,
  updateDriverStatus,
  removeDriver as removeDriverFromDb,
  type SupabaseDriver,
} from '@/lib/driverService';
import {
  fetchAllWithdrawalRequests,
  approveWithdrawal,
  rejectWithdrawal,
  adminDeductCommission,
  getDriverWallet,
  type WithdrawalRequest,
} from '@/lib/walletService';
import {
  fetchAllCarModels, addCarModel, updateCarModel, deleteCarModel,
  fetchAllEnquiries, updateEnquiryStatus, getCarAvailability,
  type CarModel, type CarEnquiry,
} from '@/lib/carService';

export const Route = createFileRoute('/admin/panel')({
  beforeLoad: () => {
    if (!getAdminSession()) throw redirect({ to: '/admin/login' });
  },
  component: AdminPanel,
});

// ── INR formatter ─────────────────────────────────────────────────────────────
const inr = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

// ── Map Supabase booking → panel Ride shape ───────────────────────────────────
type RideStatus = 'active' | 'pending' | 'completed' | 'cancelled';
interface Ride {
  id: string; customer: string; phone: string; driver: string; pickup: string; drop: string;
  fare: number; status: RideStatus; time: string; type: string;
  // keep raw supabase fields for update calls
  _raw: SupabaseBooking;
}

function toRide(b: SupabaseBooking): Ride {
  const statusMap: Record<string, RideStatus> = {
    pending: 'pending', confirmed: 'active', in_progress: 'active',
    completed: 'completed', cancelled: 'cancelled',
  };
  return {
    id: b.id,
    customer: b.customer_name || b.customer_phone,
    phone: b.customer_phone,
    driver: b.assigned_driver || '',
    pickup: b.pickup_address,
    drop: b.drop_address || '',
    fare: b.total_fare ?? 0,
    status: statusMap[b.status] ?? 'pending',
    time: new Date(b.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    type: b.booking_type,
    _raw: b,
  };
}

type DriverStatus = 'online' | 'offline';
// Use SupabaseDriver as the Driver type directly
type Driver = SupabaseDriver;

const INIT_DRIVERS: Driver[] = [];

interface Customer {
  id: string; name: string; phone: string; rides: number; spent: number; joined: string; status: string;
}
const CUSTOMERS: Customer[] = [];

const ZONES: { zone: string; rides: number; revenue: number }[] = [];

// ── STATUS CONFIG ─────────────────────────────────────────────────────────────
const STATUS_CFG: Record<RideStatus, { label: string; cls: string }> = {
  active:    { label:'Active',    cls:'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' },
  pending:   { label:'Pending',   cls:'bg-amber-500/20 text-amber-400 border border-amber-500/30' },
  completed: { label:'Completed', cls:'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
  cancelled: { label:'Cancelled', cls:'bg-red-500/20 text-red-400 border border-red-500/30' },
};

// ── ICONS (inline SVG) ────────────────────────────────────────────────────────
const Ico = {
  menu:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  dash:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  rides:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  drivers:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>,
  customers: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  revenue:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  settings:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  refresh:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  up:        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3"><polyline points="18 15 12 9 6 15"/></svg>,
  star:      <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-yellow-400"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  map:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
};

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
function AdminPanel() {
  const navigate = useNavigate();
  const [page, setPage] = useState<'dashboard'|'rides'|'drivers'|'customers'|'revenue'|'settings'|'withdrawals'|'cars'|'taxi'>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [drivers, setDrivers] = useState<Driver[]>(INIT_DRIVERS);
  const [rideFilter, setRideFilter] = useState<'all'|RideStatus>('all');
  const [fareConfig, setFareConfig] = useState({ base: 50, perKm: 12, perMin: 2, night: 200, cancel: 500 });
  const [notifs, setNotifs] = useState({ email: true, sms: true, push: false });
  const [assigningRideId, setAssigningRideId] = useState<string | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);
  const channelRef = useRef<any>(null);

  // ── Load bookings from Supabase ──
  const loadRides = useCallback(async () => {
    setLoading(true);
    const { data } = await fetchAllBookings();
    setRides(data.map(toRide));
    setLoading(false);
  }, []);

  // ── Load drivers from Supabase ──
  const loadDrivers = useCallback(async () => {
    const { data } = await fetchDrivers();
    setDrivers(data);
  }, []);

  const loadWithdrawals = useCallback(async () => {
    setWithdrawalLoading(true);
    const data = await fetchAllWithdrawalRequests();
    setWithdrawals(data);
    setWithdrawalLoading(false);
  }, []);

  useEffect(() => {
    loadRides();
    loadDrivers();
    loadWithdrawals();
    // Real-time subscription — new bookings appear instantly
    channelRef.current = subscribeToBookings((updated) => {
      setRides(prev => {
        const idx = prev.findIndex(r => r.id === updated.id);
        const newRide = toRide(updated);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = newRide;
          return next;
        }
        return [newRide, ...prev];
      });
    });
    return () => { channelRef.current?.unsubscribe(); };
  }, [loadRides, loadDrivers, loadWithdrawals]);

  const pendingCount = rides.filter(r => r.status === 'pending').length;
  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending').length;

  const openAssign = useCallback((rideId: string) => {
    setAssigningRideId(rideId);
  }, []);

  // Assign driver → update Supabase status to 'confirmed' + assigned_driver
  const confirmAssign = useCallback(async (driverName: string) => {
    if (!assigningRideId) return;
    const driver = drivers.find(d => d.name === driverName);
    await updateBookingStatus(assigningRideId, 'confirmed', driverName, undefined, driver?.phone);
    if (driver) await updateDriverStatus(driver.id, 'offline');
    setRides(prev => prev.map(r =>
      r.id === assigningRideId ? { ...r, status: 'active' as RideStatus, driver: driverName } : r
    ));
    setDrivers(prev => prev.map(d =>
      d.name === driverName ? { ...d, status: 'offline' as DriverStatus } : d
    ));
    setAssigningRideId(null);
  }, [assigningRideId, drivers]);

  // Update ride status → write to Supabase so customer sees it
  const updateRide = useCallback(async (id: string, status: RideStatus) => {
    const supabaseStatus = status === 'active' ? 'in_progress' : status;
    const ride = rides.find(r => r.id === id);
    await updateBookingStatus(id, supabaseStatus);
    if (status === 'completed' && ride?.driver) {
      const driver = drivers.find(d => d.name === ride.driver);
      if (driver) await updateDriverStatus(driver.id, 'online');
      setDrivers(drvs => drvs.map(d =>
        d.name === ride.driver ? { ...d, status: 'online' as DriverStatus } : d
      ));
    }
    setRides(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  }, [rides, drivers]);

  const toggleDriver = useCallback(async (id: string) => {
    const driver = drivers.find(d => d.id === id);
    if (!driver) return;
    const next = driver.status === 'online' ? 'offline' : 'online';
    await updateDriverStatus(id, next);
    setDrivers(prev => prev.map(d => d.id === id ? { ...d, status: next } : d));
  }, [drivers]);

  const addDriver = useCallback(async (driver: Omit<Driver, 'id' | 'created_at'>) => {
    const { error } = await addDriverToDb(driver);
    if (error) { alert('Failed to add driver: ' + error); return; }
    await loadDrivers();
  }, [loadDrivers]);

  const removeDriver = useCallback(async (id: string) => {
    await removeDriverFromDb(id);
    setDrivers(prev => prev.filter(d => d.id !== id));
  }, []);

  const nav = [
    { id:'dashboard', label:'Dashboard', icon:Ico.dash },
    { id:'rides',     label:'Rides',     icon:Ico.rides,     badge: pendingCount },
    { id:'drivers',   label:'Drivers',   icon:Ico.drivers },
    { id:'customers', label:'Customers', icon:Ico.customers },
    { id:'revenue',   label:'Revenue',   icon:Ico.revenue },
    { id:'withdrawals',label:'Withdrawals', icon:Ico.revenue, badge: pendingWithdrawals },
    { id:'cars',      label:'Cars',      icon:Ico.rides },
    { id:'taxi',      label:'Taxi Services', icon:'🚕' },
    { id:'settings',  label:'Settings',  icon:Ico.settings },
  ] as const;

  const filteredRides = rideFilter === 'all' ? rides : rides.filter(r => r.status === rideFilter);
  const assigningRide = rides.find(r => r.id === assigningRideId);
  const onlineDrivers = drivers.filter(d => d.status === 'online');

  return (
    <div className="flex h-screen bg-[#0f1117] text-white overflow-hidden font-sans">
      {/* ── SIDEBAR ── */}
      <aside className={`flex-shrink-0 flex flex-col bg-[#111827] border-r border-slate-800 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'}`}>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800">
          <img src="/logo.png" alt="UR's Chauffeur" className="w-9 h-9 rounded-xl object-cover flex-shrink-0" />
          <span className="text-lg font-bold text-white whitespace-nowrap">RideAdmin</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {nav.map(item => {
            const active = page === item.id;
            return (
              <button key={item.id} onClick={() => {
                setPage(item.id as typeof page);
                // Auto-collapse on mobile (screen width < 1024px)
                if (window.innerWidth < 1024) setSidebarOpen(false);
              }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${active ? 'bg-emerald-600/20 text-emerald-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                <span className={active ? 'text-emerald-400' : ''}>{item.icon}</span>
                <span className="flex-1 text-left whitespace-nowrap">{item.label}</span>
                {'badge' in item && item.badge > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{item.badge}</span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex-shrink-0 flex items-center gap-3 px-4 sm:px-6 h-16 bg-[#111827] border-b border-slate-800">
          <button onClick={() => setSidebarOpen(v => !v)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0">{Ico.menu}</button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-white capitalize">{page}</h1>
          </div>
          <span className="hidden sm:block text-xs text-slate-500 px-3 py-1.5 bg-slate-800 rounded-lg border border-slate-700 whitespace-nowrap">
            {new Date().toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short', year:'numeric' })}
          </span>
          <button onClick={loadRides} disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-sm font-semibold transition-colors flex-shrink-0">
            {Ico.refresh}<span className="hidden sm:inline">Refresh</span>
          </button>
          <button onClick={() => { clearAdminSession(); clearSession(); navigate({ to: '/admin/login' }); }}
            className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-xl text-sm font-semibold transition-colors flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            <span className="hidden sm:inline">Logout</span>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {page === 'dashboard'  && <DashboardPage rides={rides} drivers={drivers} loading={loading} />}
          {page === 'rides'      && <RidesPage rides={filteredRides} allRides={rides} filter={rideFilter} setFilter={setRideFilter} openAssign={openAssign} updateRide={updateRide} loading={loading} />}
          {page === 'drivers'    && <DriversPage drivers={drivers} toggleDriver={toggleDriver} addDriver={addDriver} removeDriver={removeDriver} />}
          {page === 'customers'  && <CustomersPage />}
          {page === 'revenue'    && <RevenuePage rides={rides} />}
          {page === 'withdrawals' && <WithdrawalsPage withdrawals={withdrawals} loading={withdrawalLoading} drivers={drivers} onRefresh={loadWithdrawals} />}
          {page === 'cars'        && <AdminCarsPageEmbed />}
          {page === 'taxi'        && <TaxiServicesPage rides={rides} loading={loading} openAssign={openAssign} updateRide={updateRide} />}
          {page === 'settings'   && <SettingsPage fareConfig={fareConfig} setFareConfig={setFareConfig} notifs={notifs} setNotifs={setNotifs} />}
        </main>
      </div>

      {/* ── ASSIGN DRIVER MODAL ── */}
      {assigningRide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button className="absolute inset-0 bg-black/60" onClick={() => setAssigningRideId(null)} />
          <div className="relative w-full max-w-md bg-[#111827] border border-slate-700 rounded-2xl shadow-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-1">Assign Driver</h2>
            <p className="text-xs text-slate-400 mb-4">
              Ride <span className="text-emerald-400 font-mono">{assigningRide.id}</span> · {assigningRide.pickup} → {assigningRide.drop}
            </p>

            {onlineDrivers.length === 0 ? (
              <div className="py-8 text-center text-slate-500">
                <p className="text-sm">No online drivers available right now.</p>
                <p className="text-xs mt-1">Go to Drivers page and set a driver online.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {onlineDrivers.map(d => (
                  <button key={d.id} onClick={() => confirmAssign(d.name)}
                    className="w-full flex items-center gap-3 p-3 bg-slate-800 hover:bg-emerald-600/20 hover:border-emerald-500/40 border border-slate-700 rounded-xl transition-all text-left group">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {d.name.split(' ').map(n=>n[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">{d.name}</div>
                      <div className="text-xs text-slate-400 truncate">{d.vehicle}</div>
                      <div className="text-xs text-slate-500">{d.zone} · ⭐ {d.rating}</div>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold">Assign</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <button onClick={() => setAssigningRideId(null)}
              className="mt-4 w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold rounded-xl text-sm transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
function DashboardPage({ rides, drivers, loading }: { rides: Ride[]; drivers: Driver[]; loading: boolean }) {
  const totalRev = rides.reduce((s, r) => s + r.fare, 0);
  const activeRides = rides.filter(r => r.status === 'active').length;
  const onlineDrivers = drivers.filter(d => d.status === 'online').length;

  const stats = [
    { label:'Total Bookings', value: loading ? '…' : rides.length.toLocaleString(), icon:'📅', color:'text-blue-400' },
    { label:'Total Revenue',  value: loading ? '…' : inr(totalRev),                 icon:'₹',  color:'text-emerald-400' },
    { label:'Active Rides',   value: loading ? '…' : String(activeRides),            icon:'🕐', color:'text-amber-400' },
    { label:'Active Drivers', value: loading ? '…' : String(onlineDrivers),          icon:'🚗', color:'text-purple-400' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Dashboard</h2>
        <p className="text-slate-400 text-sm mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-[#1a2332] border border-slate-700/50 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-400 font-medium leading-tight">{s.label}</span>
              <span className="text-lg">{s.icon}</span>
            </div>
            <div className={`text-xl sm:text-2xl font-bold ${s.color} mb-1`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Recent Bookings */}
      <div className="bg-[#1a2332] border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
          <h3 className="font-bold text-white">Recent Bookings</h3>
          <span className="text-xs text-slate-500">Last 24 hours</span>
        </div>
        {loading ? (
          <div className="py-16 flex flex-col items-center gap-3 text-slate-500">
            <svg className="w-8 h-8 animate-spin text-emerald-500" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
            <p className="text-sm">Loading bookings...</p>
          </div>
        ) : rides.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <p className="text-sm">No bookings yet. Customer bookings will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-700/50 bg-slate-800/30">
                  {['BOOKING ID','CUSTOMER','DRIVER','ROUTE','AMOUNT','STATUS'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rides.slice(0, 10).map((r, i) => (
                  <tr key={r.id} className={`border-b border-slate-700/30 hover:bg-slate-800/20 transition-colors ${i%2===0?'':'bg-slate-800/10'}`}>
                    <td className="py-3 px-4 text-xs font-mono font-bold text-emerald-400">{r.id.slice(0,8).toUpperCase()}</td>
                    <td className="py-3 px-4">
                      <div className="text-sm font-medium text-white">{r.customer}</div>
                      <div className="text-xs text-slate-500">{r.phone}</div>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-300">{r.driver || <span className="text-amber-400 italic text-xs">Unassigned</span>}</td>
                    <td className="py-3 px-4 text-sm text-slate-300">
                      <div className="flex items-start gap-1">
                        <span className="text-emerald-500 mt-0.5 flex-shrink-0">{Ico.map}</span>
                        <div><div className="text-xs font-medium text-white">{r.pickup}</div><div className="text-xs text-slate-500">→ {r.drop || '—'}</div></div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm font-bold text-white">₹{r.fare.toLocaleString()}</td>
                    <td className="py-3 px-4"><span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${STATUS_CFG[r.status].cls}`}>{STATUS_CFG[r.status].label}</span></td>
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

// ── RIDES ─────────────────────────────────────────────────────────────────────
function RidesPage({ rides, allRides, filter, setFilter, openAssign, updateRide, loading }: {
  rides: Ride[]; allRides: Ride[];
  filter: 'all'|RideStatus; setFilter: (f: 'all'|RideStatus) => void;
  openAssign: (id: string) => void; updateRide: (id: string, s: RideStatus) => void;
  loading: boolean;
}) {
  const tabs: Array<'all'|RideStatus> = ['all','active','pending','completed','cancelled'];
  const counts: Record<string, number> = {
    all: allRides.length,
    active: allRides.filter(r=>r.status==='active').length,
    pending: allRides.filter(r=>r.status==='pending').length,
    completed: allRides.filter(r=>r.status==='completed').length,
    cancelled: allRides.filter(r=>r.status==='cancelled').length,
  };

  return (
    <div className="space-y-5">
      <div><h2 className="text-2xl font-bold text-white">Rides</h2><p className="text-slate-400 text-sm mt-1">Manage all ride bookings</p></div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all capitalize ${filter===t ? 'bg-emerald-600 text-white' : 'bg-[#1a2332] text-slate-400 hover:text-white border border-slate-700/50'}`}>
            {t} ({counts[t]})
          </button>
        ))}
      </div>

      {/* Rides Table */}
      <div className="bg-[#1a2332] border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 flex flex-col items-center gap-3 text-slate-500">
              <svg className="w-8 h-8 animate-spin text-emerald-500" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
              <p className="text-sm">Loading rides from database...</p>
            </div>
          ) : (
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-700/50 bg-slate-800/30">
                {['ID','Customer','Driver','Route','Fare','Type','Status','Actions'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rides.length === 0 ? (
                <tr><td colSpan={8} className="py-16 text-center text-slate-500">No rides found</td></tr>
              ) : rides.map((r, i) => (
                <tr key={r.id} className={`border-b border-slate-700/30 hover:bg-slate-800/20 transition-colors ${i%2===0?'':'bg-slate-800/10'}`}>
                  <td className="py-3 px-4 text-xs font-mono font-bold text-emerald-400">{r.id}</td>
                  <td className="py-3 px-4 text-sm font-medium text-white">{r.customer}</td>
                  <td className="py-3 px-4 text-sm text-slate-300">{r.driver || <span className="text-amber-400 italic text-xs">Unassigned</span>}</td>
                  <td className="py-3 px-4">
                    <div className="text-xs font-medium text-white">{r.pickup}</div>
                    <div className="text-xs text-slate-500">→ {r.drop}</div>
                  </td>
                  <td className="py-3 px-4 text-sm font-bold text-white">₹{r.fare.toLocaleString()}</td>
                  <td className="py-3 px-4 text-xs text-slate-400 capitalize">{r.type}</td>
                  <td className="py-3 px-4"><span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${STATUS_CFG[r.status].cls}`}>{STATUS_CFG[r.status].label}</span></td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1.5 flex-wrap">
                      {r.status === 'pending' && <>
                        <button onClick={() => openAssign(r.id)} className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap">Assign Driver</button>
                        <button onClick={() => updateRide(r.id,'cancelled')} className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-semibold rounded-lg border border-red-500/30 transition-colors">Cancel</button>
                      </>}
                      {r.status === 'active' && (
                        <span className="text-xs text-slate-500 italic">Driver managing ride</span>
                      )}
                      {(r.status === 'completed' || r.status === 'cancelled') && <span className="text-xs text-slate-600 italic">—</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ── DRIVERS ───────────────────────────────────────────────────────────────────
function DriversPage({ drivers, toggleDriver, addDriver, removeDriver }: {
  drivers: Driver[];
  toggleDriver: (id: string) => void;
  addDriver: (d: Omit<Driver, 'id' | 'created_at'>) => Promise<void>;
  removeDriver: (id: string) => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name:'', phone:'', vehicle:'', zone:'Central Delhi' });
  const ZONES_LIST = ['Central Delhi','South Delhi','West Delhi','North Delhi','East Delhi','Gurugram'];

  const handleAdd = async () => {
    if (!form.name.trim() || !form.phone.trim() || !form.vehicle.trim()) return;
    setSaving(true);
    await addDriver({
      name: form.name.trim(),
      phone: form.phone.trim(),
      vehicle: form.vehicle.trim(),
      zone: form.zone.trim() || 'Central Delhi',
      rating: 5.0,
      rides: 0,
      earnings: 0,
      status: 'online',
      kyc: 'pending',
    });
    setSaving(false);
    setForm({ name:'', phone:'', vehicle:'', zone:'Central Delhi' });
    setShowAdd(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">Drivers</h2>
          <p className="text-slate-400 text-sm mt-1">Manage driver roster, status and assignments</p>
        </div>
        <button onClick={() => setShowAdd(v => !v)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Driver
        </button>
      </div>

      {/* Summary */}
      <div className="flex gap-3 flex-wrap">
        <div className="bg-[#1a2332] border border-slate-700/50 rounded-xl px-5 py-3">
          <span className="text-2xl font-bold text-emerald-400">{drivers.filter(d=>d.status==='online').length}</span>
          <span className="text-xs text-slate-400 ml-2">Online</span>
        </div>
        <div className="bg-[#1a2332] border border-slate-700/50 rounded-xl px-5 py-3">
          <span className="text-2xl font-bold text-slate-400">{drivers.filter(d=>d.status==='offline').length}</span>
          <span className="text-xs text-slate-400 ml-2">Offline</span>
        </div>
        <div className="bg-[#1a2332] border border-slate-700/50 rounded-xl px-5 py-3">
          <span className="text-2xl font-bold text-white">{drivers.length}</span>
          <span className="text-xs text-slate-400 ml-2">Total</span>
        </div>
      </div>

      {/* Add Driver Form */}
      {showAdd && (
        <div className="bg-[#1a2332] border border-emerald-500/30 rounded-2xl p-5">
          <h3 className="font-bold text-white mb-4">Add New Driver</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Full Name *</label>
              <input value={form.name} onChange={e => setForm(f=>({...f, name:e.target.value}))}
                placeholder="e.g. Rahul Sharma"
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Phone *</label>
              <input value={form.phone} onChange={e => setForm(f=>({...f, phone:e.target.value}))}
                placeholder="+91 98765 00000"
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Vehicle *</label>
              <input value={form.vehicle} onChange={e => setForm(f=>({...f, vehicle:e.target.value}))}
                placeholder="e.g. Honda City · DL 01 AB 1234"
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Zone</label>
              <input
                value={form.zone}
                onChange={e => setForm(f=>({...f, zone:e.target.value}))}
                placeholder="e.g. Central Delhi, Noida, Gurgaon..."
                list="zone-suggestions"
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <datalist id="zone-suggestions">
                {ZONES_LIST.map(z => <option key={z} value={z} />)}
              </datalist>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowAdd(false)}
              className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold rounded-xl text-sm transition-colors">Cancel</button>
            <button onClick={handleAdd} disabled={saving || !form.name.trim() || !form.phone.trim() || !form.vehicle.trim()}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-semibold rounded-xl text-sm transition-colors">
              {saving ? 'Saving...' : 'Add Driver'}
            </button>
          </div>
        </div>
      )}

      {/* Driver Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {drivers.length === 0 ? (
          <div className="col-span-3 py-16 text-center text-slate-500">No drivers yet. Add one above.</div>
        ) : drivers.map(d => (
          <div key={d.id} className="bg-[#1a2332] border border-slate-700/50 rounded-2xl p-5 hover:border-slate-600 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold text-lg">
                    {d.name.split(' ').map(n=>n[0]).join('')}
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#1a2332] ${d.status==='online'?'bg-emerald-400':'bg-slate-500'}`} />
                </div>
                <div>
                  <div className="font-bold text-white text-sm">{d.name}</div>
                  <div className="text-xs text-slate-500">{d.id}</div>
                </div>
              </div>
              {/* Toggle */}
              <button onClick={() => toggleDriver(d.id)}
                className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${d.status==='online'?'bg-emerald-600':'bg-slate-700'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${d.status==='online'?'translate-x-6':'translate-x-1'}`} />
              </button>
            </div>
            <div className="space-y-1.5 mb-4 text-xs text-slate-400">
              <div className="flex items-center gap-2">{Ico.map}<span className="truncate">{d.vehicle}</span></div>
              <div className="flex items-center gap-2">{Ico.map}<span>{d.zone}</span></div>
              <div className="flex items-center gap-2">{Ico.map}<span>{d.phone}</span></div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-slate-800/60 rounded-xl p-2.5 text-center">
                <div className="text-sm font-bold text-white">{d.rides}</div>
                <div className="text-[10px] text-slate-500">Rides</div>
              </div>
              <div className="bg-slate-800/60 rounded-xl p-2.5 text-center">
                <div className="text-[11px] font-bold text-emerald-400">₹{(d.earnings/1000).toFixed(0)}K</div>
                <div className="text-[10px] text-slate-500">Earned</div>
              </div>
            </div>
            {/* Remove button */}
            <button onClick={() => { if (confirm(`Remove ${d.name}?`)) removeDriver(d.id); }}
              className="w-full py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-semibold rounded-xl transition-colors">
              Remove Driver
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── CUSTOMERS ─────────────────────────────────────────────────────────────────
function CustomersPage() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-white">Customers</h2>
        <p className="text-slate-400 text-sm mt-1">All registered customers</p>
      </div>
      <div className="bg-[#1a2332] border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-700/50 bg-slate-800/30">
                {['Customer','Phone','Total Rides','Total Spent','Joined','Status'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CUSTOMERS.map((c, i) => (
                <tr key={c.id} className={`border-b border-slate-700/30 hover:bg-slate-800/20 transition-colors ${i%2===0?'':'bg-slate-800/10'}`}>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {c.name.split(' ').map(n=>n[0]).join('')}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{c.name}</div>
                        <div className="text-xs text-slate-500">{c.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-300">{c.phone}</td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-1 bg-blue-500/15 text-blue-400 border border-blue-500/20 rounded-lg text-xs font-bold">{c.rides}</span>
                  </td>
                  <td className="py-3 px-4 text-sm font-bold text-white">₹{c.spent.toLocaleString()}</td>
                  <td className="py-3 px-4 text-sm text-slate-400">{c.joined}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${c.status==='active'?'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30':'bg-slate-700 text-slate-400'}`}>
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── REVENUE ───────────────────────────────────────────────────────────────────
function RevenuePage({ rides }: { rides: Ride[] }) {
  const total = rides.reduce((s,r)=>s+r.fare,0);
  const completed = rides.filter(r=>r.status==='completed').reduce((s,r)=>s+r.fare,0);
  const pending = rides.filter(r=>r.status==='pending').reduce((s,r)=>s+r.fare,0);
  const avg = rides.length ? total/rides.length : 0;
  const maxRev = Math.max(...ZONES.map(z=>z.revenue));

  const cards = [
    { label:'Total Revenue',     value:inr(total),     color:'text-emerald-400', sub:'+18.2%' },
    { label:'Completed Revenue', value:inr(completed), color:'text-blue-400',    sub:'+12%'   },
    { label:'Pending Revenue',   value:inr(pending),   color:'text-amber-400',   sub:null      },
    { label:'Avg Fare / Ride',   value:inr(avg),       color:'text-purple-400',  sub:'+5%'    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Revenue</h2>
        <p className="text-slate-400 text-sm mt-1">Financial overview and zone-wise breakdown</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => (
          <div key={c.label} className="bg-[#1a2332] border border-slate-700/50 rounded-2xl p-4 sm:p-5">
            <div className="text-xs text-slate-400 mb-2">{c.label}</div>
            <div className={`text-lg sm:text-xl font-bold ${c.color} mb-1`}>{c.value}</div>
            {c.sub && <div className="flex items-center gap-1 text-xs text-emerald-400">{Ico.up}{c.sub} vs last month</div>}
          </div>
        ))}
      </div>
      <div className="bg-[#1a2332] border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700/50">
          <h3 className="font-bold text-white">Zone-wise Revenue</h3>
        </div>
        <div className="p-5 space-y-4">
          {ZONES.map(z => (
            <div key={z.zone}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-white">{z.zone}</span>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span>{z.rides} rides</span>
                  <span className="font-bold text-emerald-400">₹{z.revenue.toLocaleString()}</span>
                </div>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${(z.revenue/maxRev)*100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── SETTINGS ──────────────────────────────────────────────────────────────────
function SettingsPage({ fareConfig, setFareConfig, notifs, setNotifs }: {
  fareConfig: { base:number; perKm:number; perMin:number; night:number; cancel:number };
  setFareConfig: (c: any) => void;
  notifs: { email:boolean; sms:boolean; push:boolean };
  setNotifs: (n: any) => void;
}) {
  const fareFields = [
    { key:'base',   label:'Base Fare (₹)',        min:10  },
    { key:'perKm',  label:'Per KM Rate (₹)',       min:1   },
    { key:'perMin', label:'Per Minute Rate (₹)',   min:1   },
    { key:'night',  label:'Night Charge (₹)',      min:0   },
    { key:'cancel', label:'Cancellation Charge (₹)',min:0  },
  ] as const;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-white">Settings</h2>
        <p className="text-slate-400 text-sm mt-1">Configure fare and notification preferences</p>
      </div>

      {/* Fare Config */}
      <div className="bg-[#1a2332] border border-slate-700/50 rounded-2xl p-5">
        <h3 className="font-bold text-white mb-4">Fare Configuration</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fareFields.map(f => (
            <div key={f.key}>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">{f.label}</label>
              <input type="number" min={f.min} value={fareConfig[f.key]}
                onChange={e => setFareConfig({ ...fareConfig, [f.key]: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-slate-800/60 rounded-xl border border-slate-700/50">
          <p className="text-xs text-slate-400">
            Sample 10km, 20min ride: <span className="text-white font-bold">
              ₹{(fareConfig.base + 10*fareConfig.perKm + 20*fareConfig.perMin).toLocaleString()}
            </span>
          </p>
        </div>
        <button onClick={() => alert('Fare settings saved!')}
          className="mt-4 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-colors">
          Save Fare Settings
        </button>
      </div>

      {/* Notifications */}
      <div className="bg-[#1a2332] border border-slate-700/50 rounded-2xl p-5">
        <h3 className="font-bold text-white mb-4">Notifications</h3>
        <div className="space-y-3">
          {([
            { key:'email', label:'Email Notifications', desc:'Booking alerts via email' },
            { key:'sms',   label:'SMS Notifications',   desc:'Critical alerts via SMS'  },
            { key:'push',  label:'Push Notifications',  desc:'Browser push alerts'      },
          ] as const).map(n => (
            <div key={n.key} className="flex items-center justify-between p-4 bg-slate-800/60 rounded-xl border border-slate-700/50">
              <div>
                <div className="text-sm font-semibold text-white">{n.label}</div>
                <div className="text-xs text-slate-500 mt-0.5">{n.desc}</div>
              </div>
              <button onClick={() => setNotifs({ ...notifs, [n.key]: !notifs[n.key] })}
                className={`relative w-11 h-6 rounded-full transition-colors ${notifs[n.key]?'bg-emerald-600':'bg-slate-700'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${notifs[n.key]?'translate-x-6':'translate-x-1'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── TAXI SERVICES ─────────────────────────────────────────────────────────────
function TaxiServicesPage({ rides, loading, openAssign, updateRide }: {
  rides: Ride[];
  loading: boolean;
  openAssign: (id: string) => void;
  updateRide: (id: string, status: RideStatus) => void;
}) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled'>('all');

  const taxiRides = rides.filter(r =>
    r.type?.startsWith('taxi') || r.type === 'taxi_oneway_instant' || r.type === 'taxi_oneway_schedule' || r.type === 'taxi_roundtrip_instant' || r.type === 'taxi_roundtrip_schedule'
  );

  const filtered = filter === 'all' ? taxiRides : taxiRides.filter(r => r.status === filter);

  const counts = {
    all: taxiRides.length,
    pending: taxiRides.filter(r => r.status === 'pending').length,
    confirmed: taxiRides.filter(r => r.status === 'confirmed').length,
    active: taxiRides.filter(r => r.status === 'active').length,
    completed: taxiRides.filter(r => r.status === 'completed').length,
    cancelled: taxiRides.filter(r => r.status === 'cancelled').length,
  };

  const STATUS_COLORS: Record<string, string> = {
    pending:   'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    confirmed: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    active:    'bg-purple-500/20 text-purple-400 border border-purple-500/30',
    completed: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    cancelled: 'bg-red-500/20 text-red-400 border border-red-500/30',
  };

  const TRIP_LABELS: Record<string, string> = {
    taxi_oneway_instant:   '📍 One-Way · Instant',
    taxi_oneway_schedule:  '📍 One-Way · Scheduled',
    taxi_roundtrip_instant:'🔄 Round Trip · Instant',
    taxi_roundtrip_schedule:'🔄 Round Trip · Scheduled',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">🚕 Taxi Services</h1>
          <p className="text-slate-400 mt-1 text-sm">{taxiRides.length} total taxi bookings</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', count: counts.all, color: 'text-white' },
          { label: 'Pending', count: counts.pending, color: 'text-amber-400' },
          { label: 'Active', count: counts.active, color: 'text-purple-400' },
          { label: 'Completed', count: counts.completed, color: 'text-emerald-400' },
        ].map(s => (
          <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
            <div className={`text-2xl font-black ${s.color}`}>{s.count}</div>
            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['all','pending','confirmed','active','completed','cancelled'] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
              filter === s ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
            }`}>
            {s} ({counts[s as keyof typeof counts] ?? taxiRides.length})
          </button>
        ))}
      </div>

      {/* Bookings list */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-12 flex justify-center">
            <svg className="w-8 h-8 animate-spin text-emerald-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">No taxi bookings found</div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filtered.map(r => (
              <div key={r.id} className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-mono text-emerald-400">#{r.id.slice(0,8).toUpperCase()}</span>
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${STATUS_COLORS[r.status] ?? 'bg-slate-700 text-slate-300'}`}>
                        {r.status}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-blue-500/15 text-blue-400">
                        {TRIP_LABELS[r.type] ?? r.type}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-white truncate">📍 {r.pickup}</div>
                    {r.drop && <div className="text-xs text-slate-400 truncate mt-0.5">→ {r.drop}</div>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-lg font-bold text-white">₹{r.fare?.toLocaleString()}</div>
                    <div className="text-xs text-slate-500">{new Date(r.created).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs mb-3">
                  <div className="bg-slate-800 rounded-lg p-2">
                    <div className="text-slate-500">Customer</div>
                    <div className="text-white font-semibold truncate">{r.customer}</div>
                    <div className="text-slate-400">{r.phone}</div>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-2">
                    <div className="text-slate-500">Vehicle</div>
                    <div className="text-white font-semibold">{r._raw.car_category ?? '—'}</div>
                  </div>
                  {r.driver ? (
                    <div className="bg-emerald-900/30 border border-emerald-800/40 rounded-lg p-2">
                      <div className="text-slate-500">Driver</div>
                      <div className="text-emerald-400 font-semibold truncate">{r.driver}</div>
                    </div>
                  ) : (
                    <div className="bg-slate-800 rounded-lg p-2">
                      <div className="text-slate-500">Driver</div>
                      <div className="text-slate-400">Not assigned</div>
                    </div>
                  )}
                </div>

                {r._raw.admin_notes && (
                  <div className="bg-slate-800/60 rounded-lg px-3 py-2 text-xs text-slate-400 mb-3">
                    📝 {r._raw.admin_notes}
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  {r.status === 'pending' && (
                    <button onClick={() => openAssign(r.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors">
                      Assign Driver
                    </button>
                  )}
                  {r.status === 'confirmed' && (
                    <button onClick={() => updateRide(r.id, 'active')}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors">
                      Start Ride
                    </button>
                  )}
                  {r.status === 'active' && (
                    <button onClick={() => updateRide(r.id, 'completed')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors">
                      Complete
                    </button>
                  )}
                  {(r.status === 'pending' || r.status === 'confirmed') && (
                    <button onClick={() => updateRide(r.id, 'cancelled')}
                      className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-bold rounded-lg border border-red-500/30 transition-colors">
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── WITHDRAWALS ───────────────────────────────────────────────────────────────
function WithdrawalsPage({ withdrawals, loading, drivers, onRefresh }: {
  withdrawals: WithdrawalRequest[];
  loading: boolean;
  drivers: SupabaseDriver[];
  onRefresh: () => void;
}) {
  const [deductDriverId, setDeductDriverId] = useState('');
  const [deductAmount, setDeductAmount] = useState('');
  const [deductReason, setDeductReason] = useState('');
  const [deducting, setDeducting] = useState(false);
  const [driverWallets, setDriverWallets] = useState<Record<string, number>>({});

  useEffect(() => {
    // Load wallet balances for all drivers
    Promise.all(drivers.map(async d => {
      const w = await getDriverWallet(d.id);
      return { id: d.id, balance: w.balance };
    })).then(results => {
      const map: Record<string, number> = {};
      results.forEach(r => { map[r.id] = r.balance; });
      setDriverWallets(map);
    });
  }, [drivers]);

  const handleApprove = async (w: WithdrawalRequest) => {
    if (!confirm(`Approve ₹${w.amount.toLocaleString()} withdrawal for ${w.driver_name}?`)) return;
    const { error } = await approveWithdrawal(w.id, w.driver_id, w.amount, 'Approved by admin');
    if (error) { alert('Error: ' + error); return; }
    onRefresh();
  };

  const handleReject = async (w: WithdrawalRequest) => {
    const note = prompt('Reason for rejection (optional):') ?? '';
    const { error } = await rejectWithdrawal(w.id, note);
    if (error) { alert('Error: ' + error); return; }
    onRefresh();
  };

  const handleDeduct = async () => {
    if (!deductDriverId || !deductAmount || !deductReason.trim()) return;
    setDeducting(true);
    const { error } = await adminDeductCommission(deductDriverId, Number(deductAmount), deductReason);
    setDeducting(false);
    if (error) { alert('Error: ' + error); return; }
    alert('Commission deducted successfully');
    setDeductAmount(''); setDeductReason(''); setDeductDriverId('');
    onRefresh();
  };

  const pending = withdrawals.filter(w => w.status === 'pending');
  const processed = withdrawals.filter(w => w.status !== 'pending');

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Withdrawals</h1>
          <p className="text-slate-400 mt-1 text-sm">Driver wallet requests and manual commission control</p>
        </div>
        <button onClick={onRefresh} className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-sm font-semibold transition-colors">
          {Ico.refresh} Refresh
        </button>
      </div>

      {/* Driver wallet balances */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h2 className="text-lg font-bold text-white mb-4">Driver Wallet Balances</h2>
        {drivers.length === 0 ? (
          <p className="text-slate-500 text-sm">No drivers added yet</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {drivers.map(d => {
              const bal = driverWallets[d.id] ?? 0;
              return (
                <div key={d.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-xl border border-slate-700">
                  <div>
                    <div className="text-sm font-semibold text-white">{d.name}</div>
                    <div className="text-xs text-slate-500">{d.phone}</div>
                  </div>
                  <div className={`text-lg font-black ${bal < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {bal < 0 ? '-' : ''}{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Math.abs(bal))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Manual commission deduction */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h2 className="text-lg font-bold text-white mb-4">Manual Commission Deduction</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <div className="relative">
            <select value={deductDriverId} onChange={e => setDeductDriverId(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none">
              <option value="">Select Driver</option>
              {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <input type="number" value={deductAmount} onChange={e => setDeductAmount(e.target.value)}
            placeholder="Amount (₹)"
            className="px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          <input type="text" value={deductReason} onChange={e => setDeductReason(e.target.value)}
            placeholder="Reason"
            className="px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <button onClick={handleDeduct} disabled={deducting || !deductDriverId || !deductAmount || !deductReason.trim()}
          className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-semibold rounded-xl text-sm transition-colors">
          {deducting ? 'Deducting...' : 'Deduct Commission'}
        </button>
      </div>

      {/* Pending withdrawal requests */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Pending Requests</h2>
          {pending.length > 0 && (
            <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-bold">{pending.length} pending</span>
          )}
        </div>
        {loading ? (
          <div className="py-12 flex justify-center"><svg className="w-8 h-8 animate-spin text-emerald-500" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg></div>
        ) : pending.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">No pending withdrawal requests</div>
        ) : (
          <div className="divide-y divide-slate-800">
            {pending.map(w => (
              <div key={w.id} className="p-5 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <div className="text-sm font-bold text-white">{w.driver_name}</div>
                  <div className="text-xs text-slate-400">{w.driver_phone}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{new Date(w.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <div className="text-xl font-black text-white">₹{w.amount.toLocaleString()}</div>
                <div className="flex gap-2">
                  <button onClick={() => handleApprove(w)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors">
                    ✓ Approve
                  </button>
                  <button onClick={() => handleReject(w)}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-semibold rounded-xl border border-red-500/30 transition-colors">
                    ✗ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Processed requests */}
      {processed.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800">
            <h2 className="text-lg font-bold text-white">Processed Requests</h2>
          </div>
          <div className="divide-y divide-slate-800">
            {processed.map(w => (
              <div key={w.id} className="p-4 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <div className="text-sm font-semibold text-white">{w.driver_name}</div>
                  <div className="text-xs text-slate-500">{new Date(w.created_at).toLocaleDateString('en-IN')}</div>
                  {w.admin_note && <div className="text-xs text-slate-400 mt-0.5">Note: {w.admin_note}</div>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-white">₹{w.amount.toLocaleString()}</span>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${w.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                    {w.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── ADMIN CARS EMBED ──────────────────────────────────────────────────────────
// Inline version of the car management page for the panel
function AdminCarsPageEmbed() {
  const [tab, setTab] = useState<'fleet' | 'enquiries'>('fleet');
  const [cars, setCars] = useState<CarModel[]>([]);
  const [enquiries, setEnquiries] = useState<CarEnquiry[]>([]);
  const [availability, setAvailability] = useState<Record<string, { available: number; booked: number }>>({});
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', type: 'sedan', quantity: 1, description: '', features: '', image_url: '', is_active: true });
  const [saving, setSaving] = useState(false);
  const [enqFilter, setEnqFilter] = useState<'all' | 'pending' | 'contacted' | 'booked' | 'cancelled'>('all');

  const TYPE_OPTIONS = ['sedan', 'suv', 'hatchback', 'luxury', 'van', 'other'];
  const STATUS_CFG_CAR: Record<string, string> = {
    pending: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    contacted: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    booked: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    cancelled: 'bg-red-500/20 text-red-400 border border-red-500/30',
  };

  const load = useCallback(async () => {
    setLoading(true);
    const [allCars, allEnquiries] = await Promise.all([fetchAllCarModels(), fetchAllEnquiries()]);
    setCars(allCars);
    setEnquiries(allEnquiries);
    const avail: Record<string, { available: number; booked: number }> = {};
    await Promise.all(allCars.map(async c => {
      const a = await getCarAvailability(c.id, c.quantity);
      avail[c.id] = { available: a.available, booked: a.booked };
    }));
    setAvailability(avail);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const payload = {
      name: form.name.trim(), type: form.type, quantity: Number(form.quantity),
      description: form.description.trim() || null,
      features: form.features ? form.features.split(',').map(f => f.trim()).filter(Boolean) : null,
      image_url: form.image_url.trim() || null, is_active: form.is_active,
    };
    if (editingId) { await updateCarModel(editingId, payload); }
    else { await addCarModel(payload); }
    setSaving(false); setShowAdd(false); setEditingId(null);
    setForm({ name: '', type: 'sedan', quantity: 1, description: '', features: '', image_url: '', is_active: true });
    load();
  };

  const pendingEnq = enquiries.filter(e => e.status === 'pending').length;

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold text-white">Car Service</h1><p className="text-slate-400 text-sm mt-1">Manage fleet and customer enquiries</p></div>
        {tab === 'fleet' && <button onClick={() => { setShowAdd(true); setEditingId(null); }} className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-colors">+ Add Car</button>}
      </div>
      <div className="flex gap-2">
        {(['fleet', 'enquiries'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all relative ${tab === t ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}>
            {t} {t === 'enquiries' && pendingEnq > 0 && <span className="ml-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{pendingEnq}</span>}
          </button>
        ))}
      </div>
      {showAdd && tab === 'fleet' && (
        <div className="bg-[#1a2332] border border-emerald-500/30 rounded-2xl p-5">
          <h3 className="font-bold text-white mb-4">{editingId ? 'Edit Car' : 'Add Car'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {[
              { label: 'Car Name *', key: 'name', placeholder: 'e.g. Maruti Ertiga' },
              { label: 'Image URL', key: 'image_url', placeholder: 'https://...' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">{f.label}</label>
                <input value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Type</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none">
                {TYPE_OPTIONS.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Quantity</label>
              <input type="number" min={1} value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: Number(e.target.value) }))}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Features (comma separated)</label>
              <input value={form.features} onChange={e => setForm(p => ({ ...p, features: e.target.value }))}
                placeholder="AC, Music System, 7 Seater"
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Description</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                rows={2} className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 bg-slate-700 text-slate-300 font-semibold rounded-xl text-sm">Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.name.trim()} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold rounded-xl text-sm">{saving ? 'Saving...' : editingId ? 'Update' : 'Add Car'}</button>
          </div>
        </div>
      )}
      {tab === 'fleet' && (
        loading ? <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
        : cars.length === 0 ? <div className="py-12 text-center text-slate-500">No cars added yet</div>
        : <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {cars.map(car => {
            const avail = availability[car.id] ?? { available: car.quantity, booked: 0 };
            return (
              <div key={car.id} className="bg-[#1a2332] border border-slate-700/50 rounded-2xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <div><div className="font-bold text-white">{car.name}</div><div className="text-xs text-slate-400 capitalize">{car.type} · {car.quantity} units</div></div>
                  <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${car.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>{car.is_active ? 'Active' : 'Hidden'}</span>
                </div>
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1"><span className="text-slate-400">Availability</span><span className={avail.available > 0 ? 'text-emerald-400' : 'text-red-400'}>{avail.available}/{car.quantity} free</span></div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden"><div className={`h-full rounded-full ${avail.available > 0 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${(avail.available / car.quantity) * 100}%` }} /></div>
                </div>
                <div className="flex gap-2">
                  <button onClick={async () => { await updateCarModel(car.id, { is_active: !car.is_active }); load(); }} className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl">{car.is_active ? 'Hide' : 'Show'}</button>
                  <button onClick={async () => { if (confirm(`Delete "${car.name}"?`)) { await deleteCarModel(car.id); load(); } }} className="flex-1 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold rounded-xl border border-red-500/20">Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {tab === 'enquiries' && (
        <div className="space-y-3">
          {/* Filter tabs */}
          <div className="flex gap-2 flex-wrap">
            {(['all', 'pending', 'contacted', 'booked', 'cancelled'] as const).map(f => {
              const count = f === 'all' ? enquiries.length : enquiries.filter(e => e.status === f).length;
              return (
                <button key={f} onClick={() => setEnqFilter(f)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                    enqFilter === f ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                  }`}>
                  {f} ({count})
                </button>
              );
            })}
          </div>
          <div className="bg-[#1a2332] border border-slate-700/50 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead><tr className="border-b border-slate-700/50 bg-slate-800/30">{['Car','Customer','Dates','Status','Action'].map(h => <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">{h}</th>)}</tr></thead>
                <tbody>
                  {(enqFilter === 'all' ? enquiries : enquiries.filter(e => e.status === enqFilter)).length === 0
                    ? <tr><td colSpan={5} className="py-12 text-center text-slate-500">No {enqFilter === 'all' ? '' : enqFilter} enquiries</td></tr>
                    : (enqFilter === 'all' ? enquiries : enquiries.filter(e => e.status === enqFilter)).map((e, i) => (
                    <tr key={e.id} className={`border-b border-slate-700/30 hover:bg-slate-800/20 ${i%2===0?'':'bg-slate-800/10'}`}>
                      <td className="py-3 px-4 text-sm font-medium text-white">{e.car_name}</td>
                      <td className="py-3 px-4"><div className="text-sm text-white">{e.customer_name}</div><a href={`tel:${e.customer_phone}`} className="text-xs text-emerald-400">{e.customer_phone}</a></td>
                      <td className="py-3 px-4 text-xs text-slate-400">{e.pickup_date || '—'}{e.return_date ? ` → ${e.return_date}` : ''}</td>
                      <td className="py-3 px-4"><span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${STATUS_CFG_CAR[e.status] ?? 'bg-slate-700 text-slate-300'}`}>{e.status}</span></td>
                      <td className="py-3 px-4">
                        <select value={e.status} onChange={async ev => {
                          const newStatus = ev.target.value as CarEnquiry['status'];
                          const { error } = await updateEnquiryStatus(e.id, newStatus);
                          if (error) { alert('Failed to update: ' + error); return; }
                          setEnquiries(prev => prev.map(x => x.id === e.id ? { ...x, status: newStatus } : x));
                        }}
                          className="px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none appearance-none cursor-pointer">
                          {['pending','contacted','booked','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
