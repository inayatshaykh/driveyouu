import { createFileRoute } from '@tanstack/react-router';
import { PricingConfig } from '../../components/admin/PricingConfig';

export const Route = createFileRoute('/admin/pricing')({
  component: PricingPage,
});

function PricingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pricing Configuration</h1>
        <p className="text-muted-foreground">
          Configure pricing rules for different cities and booking types
        </p>
      </div>
      <PricingConfig />
    </div>
  );
}
