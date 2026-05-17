import { createFileRoute } from '@tanstack/react-router';
import { NotificationPreferences } from '../../components/customer/NotificationPreferences';
import { PhoneFrame } from '../../components/PhoneFrame';
import { ArrowLeft, Bell } from 'lucide-react';
import { Link } from '@tanstack/react-router';

export const Route = createFileRoute('/customer/notifications')({
  component: NotificationsPage,
});

function NotificationsPage() {
  return (
    <PhoneFrame>
      <div className="flex flex-col h-full bg-background">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to="/customer/profile" className="p-1 hover:bg-muted rounded-lg">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-accent" />
              <h1 className="text-lg font-semibold">Notifications</h1>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 pb-20">
          <NotificationPreferences />
        </div>
      </div>
    </PhoneFrame>
  );
}
