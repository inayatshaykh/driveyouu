import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { useAuth } from '../../contexts/AuthContext';
import { BottomNav } from '../../components/BottomNav';

export const Route = createFileRoute('/customer/')({
  component: CustomerLayout,
  beforeLoad: ({ context }) => {
    // Check if user is authenticated and is a customer
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('auth_user');
    
    if (!token || !user) {
      throw redirect({ to: '/login' });
    }

    const parsedUser = JSON.parse(user);
    if (parsedUser.role !== 'customer') {
      throw redirect({ to: '/' });
    }
  },
});

function CustomerLayout() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-semibold">UR's Chauffeur</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {user?.name || user?.mobile}
            </span>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
}
