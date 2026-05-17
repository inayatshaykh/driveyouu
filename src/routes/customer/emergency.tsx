import { createFileRoute } from '@tanstack/react-router';
import { EmergencyContacts } from '../../components/customer/EmergencyContacts';

export const Route = createFileRoute('/customer/emergency')({
  component: EmergencyPage,
});

function EmergencyPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Safety & Emergency</h1>
        <p className="text-muted-foreground">
          Manage your emergency contacts for SOS alerts
        </p>
      </div>
      <EmergencyContacts />
    </div>
  );
}
