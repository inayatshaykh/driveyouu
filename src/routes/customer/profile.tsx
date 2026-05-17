import { createFileRoute, Link } from '@tanstack/react-router';
import { PhoneFrame } from '../../components/PhoneFrame';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  User,
  Phone,
  Bell,
  Shield,
  Car,
  CreditCard,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

export const Route = createFileRoute('/customer/profile')({
  component: ProfilePage,
});

function ProfilePage() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  const menuItems = [
    {
      icon: Bell,
      label: 'Notification Preferences',
      description: 'Manage your notification settings',
      to: '/customer/notifications',
    },
    {
      icon: Shield,
      label: 'Emergency Contacts',
      description: 'Manage your safety contacts',
      to: '/customer/emergency',
    },
    {
      icon: Car,
      label: 'My Vehicles',
      description: 'Manage your vehicle profiles',
      to: '/customer',
    },
    {
      icon: CreditCard,
      label: 'Payment Methods',
      description: 'Manage payment options',
      to: '/customer',
    },
  ];

  return (
    <PhoneFrame>
      <div className="flex flex-col h-full bg-background">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-accent" />
            <h1 className="text-lg font-semibold">Profile</h1>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 pb-20 space-y-6">
          {/* User Info Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center">
                  <User className="h-8 w-8 text-accent" />
                </div>
                <div>
                  <CardTitle>{user?.name || 'Customer'}</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Phone className="h-4 w-4" />
                    <span>{user?.mobile}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Menu Items */}
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {menuItems.map((item) => (
                <Link key={item.to} to={item.to}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-auto py-3 px-3"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                        <item.icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </Button>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* About */}
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Version</span>
                <span className="font-medium">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span>Platform</span>
                <span className="font-medium">UR's Chauffeur</span>
              </div>
            </CardContent>
          </Card>

          {/* Logout Button */}
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </PhoneFrame>
  );
}
