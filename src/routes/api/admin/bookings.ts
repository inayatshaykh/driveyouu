import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { adminService } from '../../../services/admin.service';
import { authService } from '../../../services/auth.service';
import { z } from 'zod';

const assignDriverSchema = z.object({
  bookingId: z.string().uuid(),
  driverId: z.string().uuid(),
});

export const Route = createAPIFileRoute('/api/admin/bookings')({
  GET: async ({ request }) => {
    try {
      const authHeader = request.headers.get('Authorization');
      const user = await authService.getUserFromHeader(authHeader || '');

      if (user.role !== 'admin') {
        return json({ error: 'Unauthorized' }, { status: 403 });
      }

      const url = new URL(request.url);
      const status = url.searchParams.get('status') || undefined;
      const bookingType = url.searchParams.get('bookingType') || undefined;
      const startDate = url.searchParams.get('startDate')
        ? new Date(url.searchParams.get('startDate')!)
        : undefined;
      const endDate = url.searchParams.get('endDate')
        ? new Date(url.searchParams.get('endDate')!)
        : undefined;

      const bookings = await adminService.getAllBookings({
        status,
        bookingType,
        startDate,
        endDate,
      });

      return json({ bookings }, { status: 200 });
    } catch (error: any) {
      return json(
        { error: error.message || 'Failed to fetch bookings' },
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
      const { bookingId, driverId } = assignDriverSchema.parse(body);

      const booking = await adminService.assignDriverToBooking(bookingId, driverId);

      return json({ booking }, { status: 200 });
    } catch (error: any) {
      return json(
        { error: error.message || 'Failed to assign driver' },
        { status: 400 }
      );
    }
  },
});
