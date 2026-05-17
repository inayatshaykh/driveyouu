import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { toast } from 'sonner';
import { Plus, Edit, IndianRupee } from 'lucide-react';
import type { PricingConfig } from '../../types';

const pricingSchema = z.object({
  city: z.string().min(1, 'City is required'),
  bookingType: z.enum(['on-demand', 'scheduled', 'hourly', 'outstation']),
  baseFare: z.string().min(1, 'Base fare is required'),
  perKmRate: z.string().min(1, 'Per KM rate is required'),
  perMinuteRate: z.string().min(1, 'Per minute rate is required'),
  minimumFare: z.string().min(1, 'Minimum fare is required'),
  surgeMultiplier: z.string().optional(),
});

type PricingFormData = z.infer<typeof pricingSchema>;

export function PricingConfig() {
  const [pricingConfigs, setPricingConfigs] = useState<PricingConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<PricingConfig | null>(null);

  const form = useForm<PricingFormData>({
    resolver: zodResolver(pricingSchema),
    defaultValues: {
      surgeMultiplier: '1.0',
    },
  });

  useEffect(() => {
    fetchPricing();
  }, []);

  const fetchPricing = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/admin/pricing', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch pricing');
      }

      setPricingConfigs(data.pricing);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch pricing');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (data: PricingFormData) => {
    try {
      const token = localStorage.getItem('auth_token');
      const url = editingConfig ? '/api/admin/pricing' : '/api/admin/pricing';
      const method = editingConfig ? 'PUT' : 'POST';

      const body = editingConfig
        ? {
            configId: editingConfig.id,
            baseFare: parseFloat(data.baseFare),
            perKmRate: parseFloat(data.perKmRate),
            perMinuteRate: parseFloat(data.perMinuteRate),
            minimumFare: parseFloat(data.minimumFare),
            surgeMultiplier: data.surgeMultiplier
              ? parseFloat(data.surgeMultiplier)
              : undefined,
          }
        : {
            city: data.city,
            bookingType: data.bookingType,
            baseFare: parseFloat(data.baseFare),
            perKmRate: parseFloat(data.perKmRate),
            perMinuteRate: parseFloat(data.perMinuteRate),
            minimumFare: parseFloat(data.minimumFare),
            surgeMultiplier: data.surgeMultiplier
              ? parseFloat(data.surgeMultiplier)
              : undefined,
          };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save pricing');
      }

      toast.success(editingConfig ? 'Pricing updated' : 'Pricing created');
      setIsDialogOpen(false);
      setEditingConfig(null);
      form.reset();
      fetchPricing();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save pricing');
    }
  };

  const handleEdit = (config: PricingConfig) => {
    setEditingConfig(config);
    form.reset({
      city: config.city,
      bookingType: config.bookingType,
      baseFare: config.baseFare.toString(),
      perKmRate: config.perKmRate.toString(),
      perMinuteRate: config.perMinuteRate.toString(),
      minimumFare: config.minimumFare.toString(),
      surgeMultiplier: config.surgeMultiplier.toString(),
    });
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingConfig(null);
    form.reset();
  };

  const formatBookingType = (type: string) => {
    const typeMap: Record<string, string> = {
      'on-demand': 'On-Demand',
      scheduled: 'Scheduled',
      hourly: 'Hourly',
      outstation: 'Outstation',
    };
    return typeMap[type] || type;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading pricing...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Pricing Configuration</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Pricing
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingConfig ? 'Edit Pricing' : 'Add New Pricing'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              {!editingConfig && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      placeholder="Delhi"
                      {...form.register('city')}
                    />
                    {form.formState.errors.city && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.city.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bookingType">Booking Type *</Label>
                    <select
                      id="bookingType"
                      className="w-full rounded-md border px-3 py-2"
                      {...form.register('bookingType')}
                    >
                      <option value="on-demand">On-Demand</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="hourly">Hourly</option>
                      <option value="outstation">Outstation</option>
                    </select>
                    {form.formState.errors.bookingType && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.bookingType.message}
                      </p>
                    )}
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="baseFare">Base Fare (₹) *</Label>
                  <Input
                    id="baseFare"
                    type="number"
                    step="0.01"
                    placeholder="50"
                    {...form.register('baseFare')}
                  />
                  {form.formState.errors.baseFare && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.baseFare.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="perKmRate">Per KM Rate (₹) *</Label>
                  <Input
                    id="perKmRate"
                    type="number"
                    step="0.01"
                    placeholder="10"
                    {...form.register('perKmRate')}
                  />
                  {form.formState.errors.perKmRate && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.perKmRate.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="perMinuteRate">Per Minute Rate (₹) *</Label>
                  <Input
                    id="perMinuteRate"
                    type="number"
                    step="0.01"
                    placeholder="2"
                    {...form.register('perMinuteRate')}
                  />
                  {form.formState.errors.perMinuteRate && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.perMinuteRate.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minimumFare">Minimum Fare (₹) *</Label>
                  <Input
                    id="minimumFare"
                    type="number"
                    step="0.01"
                    placeholder="100"
                    {...form.register('minimumFare')}
                  />
                  {form.formState.errors.minimumFare && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.minimumFare.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="surgeMultiplier">Surge Multiplier</Label>
                <Input
                  id="surgeMultiplier"
                  type="number"
                  step="0.1"
                  placeholder="1.0"
                  {...form.register('surgeMultiplier')}
                />
                <p className="text-xs text-muted-foreground">
                  1.0 = no surge, 1.5 = 50% surge, 2.0 = 100% surge
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDialogClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  {editingConfig ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pricing Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {pricingConfigs.map((config) => (
          <Card key={config.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{config.city}</CardTitle>
                <Badge>{formatBookingType(config.bookingType)}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Base Fare</span>
                  <span className="font-medium">₹{config.baseFare.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Per KM</span>
                  <span className="font-medium">₹{config.perKmRate.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Per Minute</span>
                  <span className="font-medium">₹{config.perMinuteRate.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Minimum Fare</span>
                  <span className="font-medium">₹{config.minimumFare.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between border-t pt-2">
                  <span className="text-muted-foreground">Surge Multiplier</span>
                  <span className="font-medium">{config.surgeMultiplier}x</span>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => handleEdit(config)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Pricing
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {pricingConfigs.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <IndianRupee className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">No pricing configured yet</p>
            <Button onClick={() => setIsDialogOpen(true)} className="mt-4">
              Add First Pricing
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
