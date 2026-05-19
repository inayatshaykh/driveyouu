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
  beforeLoad: ({ context }) => {
    // Check if user is authenticated and is an admin
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('auth_user');
    
    if (!token || !user) {
      throw redirect({ to: '/login' });
    }

    const parsedUser = JSON.parse(user);
    if (parsedUser.role !== 'admin') {
      throw redirect({ to: '/' });
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
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r bg-card transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b px-6">
            <h1 className="text-xl font-bold">UR's Admin</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
            >
              <X className="h-6 w-6" />
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
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
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
          <div className="border-t p-4">
            <div className="mb-3 rounded-lg bg-muted p-3">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.mobile}</p>
            </div>
            <Button
              variant="outline"
              className="w-full"
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
        <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-16 items-center gap-4 px-4 sm:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex-1">
              <h2 className="text-lg font-semibold">
                {navigation.find((item) => item.href === location.pathname)?.name || 'Admin Panel'}
              </h2>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
