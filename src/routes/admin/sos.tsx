import { createFileRoute } from '@tanstack/react-router';
import { SOSManagement } from '../../components/admin/SOSManagement';

export const Route = createFileRoute('/admin/sos')({
  component: SOSPage,
});

function SOSPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">SOS Alerts</h1>
        <p className="text-muted-foreground">
          Monitor and respond to emergency alerts from customers
        </p>
      </div>
      <SOSManagement />
    </div>
  );
}
