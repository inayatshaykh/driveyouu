import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { Car, Plus, Trash2, Edit } from 'lucide-react';
import type { VehicleProfile } from '../../types';

const vehicleSchema = z.object({
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.string().optional(),
  registrationNumber: z.string().min(1, 'Registration number is required'),
  color: z.string().optional(),
  transmissionType: z.enum(['manual', 'automatic']).optional(),
  fuelType: z.enum(['petrol', 'diesel', 'cng', 'electric']).optional(),
});

type VehicleFormData = z.infer<typeof vehicleSchema>;

export function VehicleManager() {
  const [vehicles, setVehicles] = useState<VehicleProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleProfile | null>(null);

  const form = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
  });

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/customer/vehicles', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch vehicles');
      }

      setVehicles(data.vehicles);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch vehicles');
    }
  };

  const handleSubmit = async (data: VehicleFormData) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const url = editingVehicle
        ? `/api/customer/vehicles/${editingVehicle.id}`
        : '/api/customer/vehicles';

      const response = await fetch(url, {
        method: editingVehicle ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...data,
          year: data.year ? parseInt(data.year) : undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save vehicle');
      }

      toast.success(
        editingVehicle ? 'Vehicle updated successfully' : 'Vehicle added successfully'
      );
      setIsDialogOpen(false);
      setEditingVehicle(null);
      form.reset();
      fetchVehicles();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save vehicle');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (vehicle: VehicleProfile) => {
    setEditingVehicle(vehicle);
    form.reset({
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year?.toString(),
      registrationNumber: vehicle.registrationNumber,
      color: vehicle.color,
      transmissionType: vehicle.transmissionType,
      fuelType: vehicle.fuelType,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (vehicleId: string) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/customer/vehicles/${vehicleId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete vehicle');
      }

      toast.success('Vehicle deleted successfully');
      fetchVehicles();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete vehicle');
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingVehicle(null);
    form.reset();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">My Vehicles</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Vehicle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="make">Make *</Label>
                  <Input id="make" placeholder="Honda" {...form.register('make')} />
                  {form.formState.errors.make && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.make.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model">Model *</Label>
                  <Input id="model" placeholder="City" {...form.register('model')} />
                  {form.formState.errors.model && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.model.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="registrationNumber">Registration Number *</Label>
                <Input
                  id="registrationNumber"
                  placeholder="DL01AB1234"
                  {...form.register('registrationNumber')}
                />
                {form.formState.errors.registrationNumber && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.registrationNumber.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    placeholder="2020"
                    {...form.register('year')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Input id="color" placeholder="White" {...form.register('color')} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="transmissionType">Transmission</Label>
                  <select
                    id="transmissionType"
                    className="w-full rounded-md border px-3 py-2"
                    {...form.register('transmissionType')}
                  >
                    <option value="">Select</option>
                    <option value="manual">Manual</option>
                    <option value="automatic">Automatic</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fuelType">Fuel Type</Label>
                  <select
                    id="fuelType"
                    className="w-full rounded-md border px-3 py-2"
                    {...form.register('fuelType')}
                  >
                    <option value="">Select</option>
                    <option value="petrol">Petrol</option>
                    <option value="diesel">Diesel</option>
                    <option value="cng">CNG</option>
                    <option value="electric">Electric</option>
                  </select>
                </div>
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
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? 'Saving...' : editingVehicle ? 'Update' : 'Add'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {vehicles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Car className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">No vehicles added yet</p>
            <Button onClick={() => setIsDialogOpen(true)} className="mt-4">
              Add Your First Vehicle
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {vehicles.map((vehicle) => (
            <Card key={vehicle.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">
                  {vehicle.make} {vehicle.model}
                </CardTitle>
                {vehicle.isDefault && (
                  <Badge variant="secondary">Default</Badge>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Registration</span>
                    <span className="font-medium">{vehicle.registrationNumber}</span>
                  </div>
                  {vehicle.year && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Year</span>
                      <span>{vehicle.year}</span>
                    </div>
                  )}
                  {vehicle.color && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Color</span>
                      <span>{vehicle.color}</span>
                    </div>
                  )}
                  {vehicle.transmissionType && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Transmission</span>
                      <span className="capitalize">{vehicle.transmissionType}</span>
                    </div>
                  )}
                  {vehicle.fuelType && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Fuel</span>
                      <span className="capitalize">{vehicle.fuelType}</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(vehicle)}
                    className="flex-1"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(vehicle.id)}
                    className="flex-1"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
