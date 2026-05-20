import { createFileRoute } from '@tanstack/react-router';
import { useState, useCallback } from 'react';

export const Route = createFileRoute('/admin/panel')({
  component: AdminPanel,
});

// ── INR formatter ─────────────────────────────────────────────────────────────
const inr = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

// ── DUMMY DATA ────────────────────────────────────────────────────────────────
type RideStatus = 'active' | 'pending' | 'completed' | 'cancelled';
interface Ride {
  id: string; customer: string; driver: string; pickup: string; drop: string;
  fare: number; status: RideStatus; time: string; type: string;
}
const INIT_RIDES: Ride[] = [
  { id:'BK-1001', customer:'Rohan Sharma',  driver:'Amit Kumar',    pickup:'Connaught Place', drop:'IGI Airport',       fare:850,  status:'active',    time:'10:30 AM', type:'hourly' },
  { id:'BK-1002', customer:'Priya Verma',   driver:'Rajesh Singh',  pickup:'Saket',           drop:'Gurgaon Cyber City',fare:1200, status:'completed', time:'09:15 AM', type:'outstation' },
  { id:'BK-1003', customer:'Karan Mehta',   driver:'',              pickup:'Dwarka',           drop:'Noida Sector 62',   fare:1450, status:'pending',   time:'11:00 AM', type:'hourly' },
  { id:'BK-1004', customer:'Anjali Gupta',  driver:'',              pickup:'Rohini',           drop:'Karol Bagh',        fare:450,  status:'pending',   time:'11:30 AM', type:'hourly' },
  { id:'BK-1005', customer:'Vikram Singh',  driver:'Manoj Tiwari',  pickup:'Vasant Kunj',      drop:'Nehru Place',       fare:680,  status:'completed', time:'08:45 AM', type:'multiday' },
  { id:'BK-1006', customer:'Neha Patel',    driver:'Ravi Kumar',    pickup:'Lajpat Nagar',     drop:'Hauz Khas',         fare:320,  status:'active',    time:'12:00 PM', type:'hourly' },
  { id:'BK-1007', customer:'Arjun Nair',    driver:'',              pickup:'Janakpuri',        drop:'Chandni Chowk',     fare:560,  status:'pending',   time:'12:30 PM', type:'hourly' },
  { id:'BK-1008', customer:'Rahul Joshi',   driver:'Vinod Pal',     pickup:'Mayur Vihar',      drop:'Aerocity',          fare:920,  status:'cancelled', time:'07:30 AM', type:'outstation' },
];

type DriverStatus = 'online' | 'offline';
interface Driver {
  id: string; name: string; phone: string; vehicle: string; zone: string;
  rating: number; rides: number; earnings: number; status: DriverStatus; kyc: string;
}
const INIT_DRIVERS: Driver[] = [
  { id:'DR-001', name:'Amit Kumar',    phone:'+91 98765 43210', vehicle:'Honda City · DL 01 AB 1234',    zone:'Central Delhi',  rating:4.8, rides:342, earnings:124500, status:'online',  kyc:'verified' },
  { id:'DR-002', name:'Rajesh Singh',  phone:'+91 98765 43211', vehicle:'Maruti Swift · DL 02 CD 5678',  zone:'South Delhi',    rating:4.7, rides:289, earnings:98200,  status:'online',  kyc:'verified' },
  { id:'DR-003', name:'Suresh Yadav',  phone:'+91 98765 43212', vehicle:'Hyundai i20 · DL 03 EF 9012',   zone:'West Delhi',     rating:4.5, rides:156, earnings:56800,  status:'offline', kyc:'verified' },
  { id:'DR-004', name:'Manoj Tiwari',  phone:'+91 98765 43213', vehicle:'Toyota Innova · DL 04 GH 3456', zone:'South West',     rating:4.9, rides:421, earnings:152300, status:'online',  kyc:'verified' },
  { id:'DR-005', name:'Ravi Kumar',    phone:'+91 98765 43215', vehicle:'Honda Amaze · DL 06 KL 1234',   zone:'North Delhi',    rating:4.6, rides:267, earnings:89400,  status:'online',  kyc:'verified' },
  { id:'DR-006', name:'Vinod Pal',     phone:'+91 98765 43216', vehicle:'Tata Nexon · DL 07 MN 5678',    zone:'East Delhi',     rating:4.7, rides:198, earnings:72100,  status:'offline', kyc:'verified' },
];

interface Customer {
  id: string; name: string; phone: string; rides: number; spent: number; joined: string; status: string;
}
const CUSTOMERS: Customer[] = [
  { id:'CU-001', name:'Rohan Sharma',  phone:'+91 98765 43210', rides:45, spent:38500, joined:'Jan 2023', status:'active' },
  { id:'CU-002', name:'Priya Verma',   phone:'+91 98765 43211', rides:38, spent:32100, joined:'Feb 2023', status:'active' },
  { id:'CU-003', name:'Karan Mehta',   phone:'+91 98765 43212', rides:32, spent:28900, joined:'Mar 2023', status:'active' },
  { id:'CU-004', name:'Anjali Gupta',  phone:'+91 98765 43213', rides:28, spent:24300, joined:'Apr 2023', status:'active' },
  { id:'CU-005', name:'Vikram Singh',  phone:'+91 98765 43214', rides:25, spent:21800, joined:'May 2023', status:'inactive' },
  { id:'CU-006', name:'Neha Patel',    phone:'+91 98765 43215', rides:19, spent:16500, joined:'Jun 2023', status:'active' },
  { id:'CU-007', name:'Arjun Nair',    phone:'+91 98765 43216', rides:15, spent:13200, joined:'Jul 2023', status:'active' },
  { id:'CU-008', name:'Rahul Joshi',   phone:'+91 98765 43218', rides:22, spent:19400, joined:'Sep 2023', status:'active' },
];

const ZONES = [
  { zone:'Central Delhi', rides:312, revenue:248600 },
  { zone:'South Delhi',   rides:287, revenue:229400 },
  { zone:'West Delhi',    rides:198, revenue:158200 },
  { zone:'North Delhi',   rides:176, revenue:140800 },
  { zone:'East Delhi',    rides:154, revenue:123100 },
  { zone:'Gurugram',      rides:142, revenue:113600 },
];

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
  const [page, setPage] = useState<'dashboard'|'rides'|'drivers'|'customers'|'revenue'|'settings'>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rides, setRides] = useState<Ride[]>(INIT_RIDES);
  const [drivers, setDrivers] = useState<Driver[]>(INIT_DRIVERS);
  const [rideFilter, setRideFilter] = useState<'all'|RideStatus>('all');
  const [fareConfig, setFareConfig] = useState({ base: 50, perKm: 12, perMin: 2, night: 200, cancel: 500 });
  const [notifs, setNotifs] = useState({ email: true, sms: true, push: false });

  const pendingCount = rides.filter(r => r.status === 'pending').length;
  const onlineDrivers = drivers.filter(d => d.status === 'online');

  const assignDriver = useCallback((rideId: string) => {
    const available = onlineDrivers.filter(d => !rides.find(r => r.status === 'active' && r.driver === d.name));
    const pick = available.length ? available[Math.floor(Math.random() * available.length)] : onlineDrivers[0];
    if (!pick) { alert('No online drivers available'); return; }
    setRides(prev => prev.map(r => r.id === rideId ? { ...r, status: 'active', driver: pick.name } : r));
  }, [onlineDrivers, rides]);

  const updateRide = useCallback((id: string, status: RideStatus) => {
    setRides(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  }, []);

  const toggleDriver = useCallback((id: string) => {
    setDrivers(prev => prev.map(d => d.id === id ? { ...d, status: d.status === 'online' ? 'offline' : 'online' } : d));
  }, []);

  const nav = [
    { id:'dashboard', label:'Dashboard', icon:Ico.dash },
    { id:'rides',     label:'Rides',     icon:Ico.rides,     badge: pendingCount },
    { id:'drivers',   label:'Drivers',   icon:Ico.drivers },
    { id:'customers', label:'Customers', icon:Ico.customers },
    { id:'revenue',   label:'Revenue',   icon:Ico.revenue },
    { id:'settings',  label:'Settings',  icon:Ico.settings },
  ] as const;

  const filteredRides = rideFilter === 'all' ? rides : rides.filter(r => r.status === rideFilter);

  return (
    <div className="flex h-screen bg-[#0f1117] text-white overflow-hidden font-sans">
      {/* ── SIDEBAR ── */}
      <aside className={`flex-shrink-0 flex flex-col bg-[#111827] border-r border-slate-800 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'}`}>
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center flex-shrink-0">
            {Ico.rides}
          </div>
          <span className="text-lg font-bold text-white whitespace-nowrap">RideAdmin</span>
        </div>
        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {nav.map(item => {
            const active = page === item.id;
            return (
              <button key={item.id} onClick={() => setPage(item.id as typeof page)}
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
        {/* Topbar */}
        <header className="flex-shrink-0 flex items-center gap-4 px-4 sm:px-6 h-16 bg-[#111827] border-b border-slate-800">
          <button onClick={() => setSidebarOpen(v => !v)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0">
            {Ico.menu}
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-white capitalize">{page}</h1>
          </div>
          <span className="hidden sm:block text-xs text-slate-500 px-3 py-1.5 bg-slate-800 rounded-lg border border-slate-700 whitespace-nowrap">
            {new Date().toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short', year:'numeric' })}
          </span>
          <button onClick={() => setRides([...INIT_RIDES])} className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-sm font-semibold transition-colors flex-shrink-0">
            {Ico.refresh}<span className="hidden sm:inline">Refresh</span>
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {page === 'dashboard'  && <DashboardPage rides={rides} drivers={drivers} />}
          {page === 'rides'      && <RidesPage rides={filteredRides} allRides={rides} filter={rideFilter} setFilter={setRideFilter} assignDriver={assignDriver} updateRide={updateRide} />}
          {page === 'drivers'    && <DriversPage drivers={drivers} toggleDriver={toggleDriver} />}
          {page === 'customers'  && <CustomersPage />}
          {page === 'revenue'    && <RevenuePage rides={rides} />}
          {page === 'settings'   && <SettingsPage fareConfig={fareConfig} setFareConfig={setFareConfig} notifs={notifs} setNotifs={setNotifs} />}
        </main>
      </div>
    </div>
  );
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
function DashboardPage({ rides, drivers }: { rides: Ride[]; drivers: Driver[] }) {
  const totalRev = rides.reduce((s, r) => s + r.fare, 0);
  const activeRides = rides.filter(r => r.status === 'active').length;
  const onlineDrivers = drivers.filter(d => d.status === 'online').length;

  const stats = [
    { label:'Total Bookings', value:'1,284',           sub:'+12.5% vs last month', icon:'📅', color:'text-blue-400' },
    { label:'Total Revenue',  value:inr(totalRev),     sub:'+18.2% vs last month', icon:'₹',  color:'text-emerald-400' },
    { label:'Active Rides',   value:String(activeRides),sub:'+5.1% vs last month', icon:'🕐', color:'text-amber-400' },
    { label:'Active Drivers', value:String(onlineDrivers),sub:'+8.3% vs last month',icon:'🚗',color:'text-purple-400' },
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
            <div className="flex items-center gap-1 text-xs text-emerald-400">
              {Ico.up}<span>{s.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Bookings */}
      <div className="bg-[#1a2332] border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
          <h3 className="font-bold text-white">Recent Bookings</h3>
          <span className="text-xs text-slate-500">Last 24 hours</span>
        </div>
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
              {rides.map((r, i) => (
                <tr key={r.id} className={`border-b border-slate-700/30 hover:bg-slate-800/20 transition-colors ${i%2===0?'':'bg-slate-800/10'}`}>
                  <td className="py-3 px-4 text-sm font-bold text-emerald-400">{r.id}</td>
                  <td className="py-3 px-4 text-sm font-medium text-white">{r.customer}</td>
                  <td className="py-3 px-4 text-sm text-slate-300">{r.driver || <span className="text-amber-400 italic">Unassigned</span>}</td>
                  <td className="py-3 px-4 text-sm text-slate-300">
                    <div className="flex items-start gap-1">
                      <span className="text-emerald-500 mt-0.5 flex-shrink-0">{Ico.map}</span>
                      <div><div className="text-xs font-medium text-white">{r.pickup}</div><div className="text-xs text-slate-500">→ {r.drop}</div></div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm font-bold text-white">₹{r.fare.toLocaleString()}</td>
                  <td className="py-3 px-4"><span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${STATUS_CFG[r.status].cls}`}>{STATUS_CFG[r.status].label}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── RIDES ─────────────────────────────────────────────────────────────────────
function RidesPage({ rides, allRides, filter, setFilter, assignDriver, updateRide }: {
  rides: Ride[]; allRides: Ride[];
  filter: 'all'|RideStatus; setFilter: (f: 'all'|RideStatus) => void;
  assignDriver: (id: string) => void; updateRide: (id: string, s: RideStatus) => void;
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
                        <button onClick={() => assignDriver(r.id)} className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap">Assign Driver</button>
                        <button onClick={() => updateRide(r.id,'cancelled')} className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-semibold rounded-lg border border-red-500/30 transition-colors">Cancel</button>
                      </>}
                      {r.status === 'active' && <>
                        <button onClick={() => updateRide(r.id,'completed')} className="px-2.5 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-xs font-semibold rounded-lg border border-blue-500/30 transition-colors">Complete</button>
                        <button onClick={() => updateRide(r.id,'cancelled')} className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-semibold rounded-lg border border-red-500/30 transition-colors">Cancel</button>
                      </>}
                      {(r.status === 'completed' || r.status === 'cancelled') && <span className="text-xs text-slate-600 italic">—</span>}
                    </div>
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

// ── DRIVERS ───────────────────────────────────────────────────────────────────
function DriversPage({ drivers, toggleDriver }: { drivers: Driver[]; toggleDriver: (id: string) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-white">Drivers</h2>
        <p className="text-slate-400 text-sm mt-1">Manage driver status and performance</p>
      </div>
      <div className="flex gap-4 flex-wrap">
        <div className="bg-[#1a2332] border border-slate-700/50 rounded-xl px-5 py-3">
          <span className="text-2xl font-bold text-emerald-400">{drivers.filter(d=>d.status==='online').length}</span>
          <span className="text-xs text-slate-400 ml-2">Online</span>
        </div>
        <div className="bg-[#1a2332] border border-slate-700/50 rounded-xl px-5 py-3">
          <span className="text-2xl font-bold text-slate-400">{drivers.filter(d=>d.status==='offline').length}</span>
          <span className="text-xs text-slate-400 ml-2">Offline</span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {drivers.map(d => (
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
              {/* Toggle Switch */}
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
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-800/60 rounded-xl p-2.5 text-center">
                <div className="text-sm font-bold text-white">{d.rides}</div>
                <div className="text-[10px] text-slate-500">Rides</div>
              </div>
              <div className="bg-slate-800/60 rounded-xl p-2.5 text-center">
                <div className="text-sm font-bold text-yellow-400 flex items-center justify-center gap-0.5">{Ico.star}{d.rating}</div>
                <div className="text-[10px] text-slate-500">Rating</div>
              </div>
              <div className="bg-slate-800/60 rounded-xl p-2.5 text-center">
                <div className="text-[11px] font-bold text-emerald-400">₹{(d.earnings/1000).toFixed(0)}K</div>
                <div className="text-[10px] text-slate-500">Earned</div>
              </div>
            </div>
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
