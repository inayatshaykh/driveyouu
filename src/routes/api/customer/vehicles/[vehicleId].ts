import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { vehicleService } from '../../../../services/vehicle.service';
import { authService } from '../../../../services/auth.service';
import { z } from 'zod';

const updateVehicleSchema = z.object({
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.number().min(1900).max(new Date().getFullYear() + 1).optional(),
  color: z.string().optional(),
  transmissionType: z.enum(['manual', 'automatic']).optional(),
  fuelType: z.enum(['petrol', 'diesel', 'cng', 'electric']).optional(),
  isDefault: z.boolean().optional(),
});

export const Route = createAPIFileRoute('/api/customer/vehicles/$vehicleId')({
  GET: async ({ request, params }) => {
    try {
      const authHeader = request.headers.get('Authorization');
      const user = await authService.getUserFromHeader(authHeader || '');

      if (user.role !== 'customer') {
        return json({ error: 'Unauthorized' }, { status: 403 });
      }

      const vehicle = await vehicleService.getVehicleById(params.vehicleId, user.id);

      if (!vehicle) {
        return json({ error: 'Vehicle not found' }, { status: 404 });
      }

      return json({ vehicle }, { status: 200 });
    } catch (error: any) {
      return json(
        { error: error.message || 'Failed to fetch vehicle' },
        { status: 400 }
      );
    }
  },

  PUT: async ({ request, params }) => {
    try {
      const authHeader = request.headers.get('Authorization');
      const user = await authService.getUserFromHeader(authHeader || '');

      if (user.role !== 'customer') {
        return json({ error: 'Unauthorized' }, { status: 403 });
      }

      const body = await request.json();
      const vehicleData = updateVehicleSchema.parse(body);

      const vehicle = await vehicleService.updateVehicleProfile(
        params.vehicleId,
        user.id,
        vehicleData
      );

      return json({ vehicle }, { status: 200 });
    } catch (error: any) {
      return json(
        { error: error.message || 'Failed to update vehicle' },
        { status: 400 }
      );
    }
  },

  DELETE: async ({ request, params }) => {
    try {
      const authHeader = request.headers.get('Authorization');
      const user = await authService.getUserFromHeader(authHeader || '');

      if (user.role !== 'customer') {
        return json({ error: 'Unauthorized' }, { status: 403 });
      }

      await vehicleService.deleteVehicleProfile(params.vehicleId, user.id);

      return json({ message: 'Vehicle deleted successfully' }, { status: 200 });
    } catch (error: any) {
      return json(
        { error: error.message || 'Failed to delete vehicle' },
        { status: 400 }
      );
    }
  },
});
