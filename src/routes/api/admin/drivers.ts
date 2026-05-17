import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { adminService } from '../../../services/admin.service';
import { authService } from '../../../services/auth.service';
import { z } from 'zod';

const updateVerificationSchema = z.object({
  driverId: z.string().uuid(),
  status: z.string(),
  rejectionReason: z.string().optional(),
});

const updateStatusSchema = z.object({
  driverId: z.string().uuid(),
  status: z.string(),
});

export const Route = createAPIFileRoute('/api/admin/drivers')({
  GET: async ({ request }) => {
    try {
      const authHeader = request.headers.get('Authorization');
      const user = await authService.getUserFromHeader(authHeader || '');

      if (user.role !== 'admin') {
        return json({ error: 'Unauthorized' }, { status: 403 });
      }

      const url = new URL(request.url);
      const verificationStatus = url.searchParams.get('verificationStatus') || undefined;
      const driverStatus = url.searchParams.get('driverStatus') || undefined;
      const search = url.searchParams.get('search') || undefined;

      const drivers = await adminService.getAllDrivers({
        verificationStatus,
        driverStatus,
        search,
      });

      return json({ drivers }, { status: 200 });
    } catch (error: any) {
      return json(
        { error: error.message || 'Failed to fetch drivers' },
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
      const action = body.action;

      if (action === 'updateVerification') {
        const { driverId, status, rejectionReason } = updateVerificationSchema.parse(body);
        await adminService.updateDriverVerification(
          driverId,
          status,
          user.id,
          rejectionReason
        );
        return json({ message: 'Verification status updated' }, { status: 200 });
      }

      if (action === 'updateStatus') {
        const { driverId, status } = updateStatusSchema.parse(body);
        await adminService.updateDriverStatus(driverId, status);
        return json({ message: 'Driver status updated' }, { status: 200 });
      }

      return json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
      return json(
        { error: error.message || 'Failed to update driver' },
        { status: 400 }
      );
    }
  },
});
