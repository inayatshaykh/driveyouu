import { createFileRoute } from '@tanstack/react-router';
import { AnalyticsDashboard } from '../../components/admin/AnalyticsDashboard';

export const Route = createFileRoute('/admin/')({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your platform's performance and key metrics
        </p>
      </div>
      <AnalyticsDashboard />
    </div>
  );
}
