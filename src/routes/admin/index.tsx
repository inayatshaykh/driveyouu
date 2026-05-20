import { createFileRoute, Outlet, redirect, Link, useLocation, useNavigate } from '@tanstack/react-router';
import {
  LayoutDashboard, Users, Car, Calendar, Settings,
  LogOut, Menu, X, Truck, ChevronDown, User, Bell, Shield, Star, IndianRupee
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { getAdminSession, clearAdminSession } from '@/utils/adminSession';

export const Route = createFileRoute('/admin/')({
  component: AdminLayout,
  beforeLoad: ({ location }) => {
    // Use real admin session — not the generic auth_user check
    const admin = getAdminSession();
    if (!admin) throw redirect({ to: '/admin/login' });
    if (location.pathname === '/admin' || location.pathname === '/admin/') {
      throw redirect({ to: '/admin/dashboard' });
    }
  },
});

const NAV = [
  { name: 'Dashboard',  href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Bookings',   href: '/admin/bookings',  icon: Calendar },
  { name: 'Drivers',    href: '/admin/drivers',   icon: Car },
  { name: 'Customers',  href: '/admin/customers', icon: Users },
  { name: 'Revenue',    href: '/admin/revenue',   icon: IndianRupee },
  { name: 'Vehicles',   href: '/admin/vehicles',  icon: Truck },
  { name: 'Reviews',    href: '/admin/reviews',   icon: Star },
  { name: 'Settings',   href: '/admin/settings',  icon: Settings },
];

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = () => {
      const admin = getAdminSession();
      if (admin) setUser(admin);
    };
    load();
    window.addEventListener('storage', load);
    return () => window.removeEventListener('storage', load);
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [userMenuOpen]);

  const handleLogout = () => {
    clearAdminSession();
    navigate({ to: '/admin/login' });
  };

  const initials = user?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'AD';
  const currentPage = NAV.find(n => n.href === location.pathname)?.name || 'Admin';

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── SIDEBAR ─────────────────────────────────────────── */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-slate-950 border-r border-slate-800 transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-slate-800 bg-slate-900 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-white leading-tight">UR's Chauffeur</div>
              <div className="text-[10px] text-emerald-400 leading-tight">Admin Panel</div>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(item => {
            const Icon = item.icon;
            const active = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  active
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="h-4.5 w-4.5 flex-shrink-0" style={{ width: 18, height: 18 }} />
                {item.name}
                {item.name === 'Bookings' && (
                  <span className="ml-auto text-[10px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full font-bold">Live</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar user card */}
        <div className="flex-shrink-0 border-t border-slate-800 p-4 bg-slate-900">
          <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-xl border border-slate-700 mb-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate">{user?.name || 'Admin'}</div>
              <div className="text-xs text-slate-400 truncate">{user?.mobile || user?.email || 'admin'}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-red-600 border border-slate-700 hover:border-red-600 text-slate-300 hover:text-white rounded-xl text-sm font-semibold transition-all duration-200"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* ── MAIN ────────────────────────────────────────────── */}
      <div className="lg:pl-64 flex flex-col min-h-screen">

        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 flex items-center gap-4 px-4 sm:px-6 border-b border-slate-800 bg-slate-950/95 backdrop-blur flex-shrink-0">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-slate-400 hover:text-white hover:bg-slate-800 p-2 rounded-lg transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Page title */}
          <div className="flex-1">
            <h2 className="text-lg font-bold text-white">{currentPage}</h2>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Clock */}
            <span className="hidden sm:block text-xs text-slate-500 px-3 py-1.5 bg-slate-800 rounded-lg border border-slate-700">
              {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>

            {/* Notification bell */}
            <button className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full" />
            </button>

            {/* User avatar dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(v => !v)}
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-slate-800 transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold text-xs">
                  {initials}
                </div>
                <span className="hidden sm:block text-sm font-semibold text-white max-w-[100px] truncate">
                  {user?.name || 'Admin'}
                </span>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown */}
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50">
                  {/* User info */}
                  <div className="px-4 py-3 border-b border-slate-800">
                    <div className="text-sm font-semibold text-white">{user?.name || 'Admin'}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{user?.mobile || user?.email}</div>
                    <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/15 border border-emerald-500/30 rounded-full">
                      <Shield className="h-3 w-3 text-emerald-400" />
                      <span className="text-[10px] text-emerald-400 font-semibold">Administrator</span>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="p-1.5">
                    <button
                      onClick={() => { setUserMenuOpen(false); navigate({ to: '/admin/settings' }); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl transition-colors"
                    >
                      <User className="h-4 w-4" />
                      Profile & Settings
                    </button>
                    <div className="h-px bg-slate-800 my-1" />
                    <button
                      onClick={() => { setUserMenuOpen(false); handleLogout(); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 bg-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
