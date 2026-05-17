import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { adminService } from '../../../services/admin.service';
import { authService } from '../../../services/auth.service';
import { z } from 'zod';

const createPricingSchema = z.object({
  city: z.string(),
  bookingType: z.enum(['on-demand', 'scheduled', 'hourly', 'outstation']),
  baseFare: z.number(),
  perKmRate: z.number(),
  perMinuteRate: z.number(),
  minimumFare: z.number(),
  surgeMultiplier: z.number().optional(),
});

const updatePricingSchema = z.object({
  configId: z.string().uuid(),
  baseFare: z.number().optional(),
  perKmRate: z.number().optional(),
  perMinuteRate: z.number().optional(),
  minimumFare: z.number().optional(),
  surgeMultiplier: z.number().optional(),
  isActive: z.boolean().optional(),
});

export const Route = createAPIFileRoute('/api/admin/pricing')({
  GET: async ({ request }) => {
    try {
      const authHeader = request.headers.get('Authorization');
      const user = await authService.getUserFromHeader(authHeader || '');

      if (user.role !== 'admin') {
        return json({ error: 'Unauthorized' }, { status: 403 });
      }

      const url = new URL(request.url);
      const city = url.searchParams.get('city') || undefined;

      const pricing = await adminService.getPricingConfig(city);

      return json({ pricing }, { status: 200 });
    } catch (error: any) {
      return json(
        { error: error.message || 'Failed to fetch pricing' },
        { status: 400 }
      );
    }
  },

  POST: async ({ request }) => {
    try {
      const authHeader = request.headers.get('Authorization');
      const user = await authService.getUserFromHeader(authHeader || '');

      if (user.role !== 'admin') {
        return json({ error: 'Unauthorized' }, { status: 403 });
      }

      const body = await request.json();
      const pricingData = createPricingSchema.parse(body);

      const pricing = await adminService.createPricingConfig(pricingData);

      return json({ pricing }, { status: 201 });
    } catch (error: any) {
      return json(
        { error: error.message || 'Failed to create pricing' },
        { status: 400 }
      );
    }
  },

  PUT: async ({ request }) => {
    try {
      const authHeader = request.headers.get('Authorization');
      const user = await authService.getUserFromHeader(authHeader || '');

      if (user.role !== 'admin') {
        return json({ error: 'Unauthorized' }, { status: 403 });
      }

      const body = await request.json();
      const { configId, ...updateData } = updatePricingSchema.parse(body);

      const pricing = await adminService.updatePricingConfig(configId, updateData);

      return json({ pricing }, { status: 200 });
    } catch (error: any) {
      return json(
        { error: error.message || 'Failed to update pricing' },
        { status: 400 }
      );
    }
  },
});
