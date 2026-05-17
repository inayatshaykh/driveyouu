import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { driverService } from '../../../services/driver.service';
import { authService } from '../../../services/auth.service';
import { z } from 'zod';

const acceptBookingSchema = z.object({
  bookingId: z.string().uuid(),
});

export const Route = createAPIFileRoute('/api/driver/bookings')({
  GET: async ({ request }) => {
    try {
      const authHeader = request.headers.get('Authorization');
      const user = await authService.getUserFromHeader(authHeader || '');

      if (user.role !== 'driver') {
        return json({ error: 'Unauthorized' }, { status: 403 });
      }

      const bookings = await driverService.getDriverBookings(user.id);

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

      if (user.role !== 'driver') {
        return json({ error: 'Unauthorized' }, { status: 403 });
      }

      const body = await request.json();
      const { bookingId } = acceptBookingSchema.parse(body);

      const booking = await driverService.acceptBooking(user.id, bookingId);

      return json({ booking }, { status: 200 });
    } catch (error: any) {
      return json(
        { error: error.message || 'Failed to accept booking' },
        { status: 400 }
      );
    }
  },
});
