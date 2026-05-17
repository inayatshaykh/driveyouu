import { createFileRoute } from '@tanstack/react-router';
import { DriverManagement } from '../../components/admin/DriverManagement';

export const Route = createFileRoute('/admin/drivers')({
  component: DriversPage,
});

function DriversPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Driver Management</h1>
        <p className="text-muted-foreground">
          Manage driver verifications, status, and performance
        </p>
      </div>
      <DriverManagement />
    </div>
  );
}
