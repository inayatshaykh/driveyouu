import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { vehicleService } from '../../../../services/vehicle.service';
import { authService } from '../../../../services/auth.service';
import { z } from 'zod';

const createVehicleSchema = z.object({
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.number().min(1900).max(new Date().getFullYear() + 1).optional(),
  registrationNumber: z.string().min(1, 'Registration number is required'),
  color: z.string().optional(),
  transmissionType: z.enum(['manual', 'automatic']).optional(),
  fuelType: z.enum(['petrol', 'diesel', 'cng', 'electric']).optional(),
  isDefault: z.boolean().optional(),
});

export const Route = createAPIFileRoute('/api/customer/vehicles/')({
  GET: async ({ request }) => {
    try {
      const authHeader = request.headers.get('Authorization');
      const user = await authService.getUserFromHeader(authHeader || '');

      if (user.role !== 'customer') {
        return json({ error: 'Unauthorized' }, { status: 403 });
      }

      const vehicles = await vehicleService.getCustomerVehicles(user.id);

      return json({ vehicles }, { status: 200 });
    } catch (error: any) {
      return json(
        { error: error.message || 'Failed to fetch vehicles' },
        { status: 400 }
      );
    }
  },

  POST: async ({ request }) => {
    try {
      const authHeader = request.headers.get('Authorization');
      const user = await authService.getUserFromHeader(authHeader || '');

      if (user.role !== 'customer') {
        return json({ error: 'Unauthorized' }, { status: 403 });
      }

      const body = await request.json();
      const vehicleData = createVehicleSchema.parse(body);

      const vehicle = await vehicleService.createVehicleProfile(user.id, vehicleData);

      return json({ vehicle }, { status: 201 });
    } catch (error: any) {
      return json(
        { error: error.message || 'Failed to create vehicle' },
        { status: 400 }
      );
    }
  },
});
