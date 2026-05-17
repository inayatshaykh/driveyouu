import { createFileRoute } from '@tanstack/react-router';
import { CustomerManagement } from '../../components/admin/CustomerManagement';

export const Route = createFileRoute('/admin/customers')({
  component: CustomersPage,
});

function CustomersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Customer Management</h1>
        <p className="text-muted-foreground">
          View and manage customer accounts and activity
        </p>
      </div>
      <CustomerManagement />
    </div>
  );
}
