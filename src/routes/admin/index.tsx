import { createFileRoute, Outlet, redirect, Link, useLocation, useNavigate } from '@tanstack/react-router';
import { 
  LayoutDashboard, 
  Users, 
  Car, 
  Calendar, 
  Settings, 
  LogOut,
  Menu,
  X,
  AlertCircle
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';

export const Route = createFileRoute('/admin/')({
  component: AdminLayout,
  beforeLoad: ({ location }) => {
    // Check if user is authenticated and is an admin
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('auth_user');
    
    if (!token || !user) {
      throw redirect({ to: '/login' });
    }

    try {
      const parsedUser = JSON.parse(user);
      if (parsedUser.role !== 'admin') {
        throw redirect({ to: '/' });
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      throw redirect({ to: '/login' });
    }

    // Redirect /admin to /admin/dashboard
    if (location.pathname === '/admin' || location.pathname === '/admin/') {
      throw redirect({ to: '/admin/dashboard' });
    }
  },
});

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('auth_user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Drivers', href: '/admin/drivers', icon: Car },
    { name: 'Bookings', href: '/admin/bookings', icon: Calendar },
    { name: 'Customers', href: '/admin/customers', icon: Users },
    { name: 'SOS Alerts', href: '/admin/sos', icon: AlertCircle },
    { name: 'Pricing', href: '/admin/pricing', icon: Settings },
  ];

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    navigate({ to: '/login' });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-slate-800 bg-slate-950 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b border-slate-800 px-6 bg-slate-900">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                <span className="text-white font-bold text-sm">UR</span>
              </div>
              <h1 className="text-lg font-bold text-white">Admin Panel</h1>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-900/50'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User info & logout */}
          <div className="border-t border-slate-800 p-4 bg-slate-900">
            <div className="mb-3 rounded-xl bg-slate-800 p-3 border border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold text-xs">
                  {user?.name?.split(' ').map((n: string) => n[0]).join('') || 'AD'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{user?.name || 'Admin'}</p>
                  <p className="text-xs text-slate-400 truncate">{user?.mobile || user?.email}</p>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full bg-slate-800 border-slate-700 hover:bg-red-600 hover:border-red-600 hover:text-white transition-all duration-200"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/95 backdrop-blur supports-[backdrop-filter]:bg-slate-950/60">
          <div className="flex h-16 items-center gap-4 px-4 sm:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-400 hover:text-white hover:bg-slate-800 p-2 rounded-lg transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-white">
                {navigation.find((item) => item.href === location.pathname)?.name || 'Dashboard'}
              </h2>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
              <span className="px-3 py-1.5 bg-slate-800 rounded-lg border border-slate-700">
                {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 bg-slate-950 min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
