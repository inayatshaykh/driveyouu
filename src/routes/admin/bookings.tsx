import { createFileRoute } from '@tanstack/react-router';
import { BookingManagement } from '../../components/admin/BookingManagement';

export const Route = createFileRoute('/admin/bookings')({
  component: BookingsPage,
});

function BookingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Booking Management</h1>
        <p className="text-muted-foreground">
          Monitor and manage all bookings across the platform
        </p>
      </div>
      <BookingManagement />
    </div>
  );
}
