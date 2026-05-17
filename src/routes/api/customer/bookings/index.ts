import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { bookingService } from '../../../../services/booking.service';
import { authService } from '../../../../services/auth.service';
import { notificationService } from '../../../../services/notification.service';
import { z } from 'zod';

const createBookingSchema = z.object({
  vehicleProfileId: z.string().uuid(),
  bookingType: z.enum(['on-demand', 'scheduled', 'hourly', 'outstation']),
  pickupLocation: z.object({
    latitude: z.number(),
    longitude: z.number(),
    address: z.string(),
  }),
  dropLocation: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
      address: z.string(),
    })
    .optional(),
  scheduledTime: z.string().optional(),
  duration: z.number().optional(),
});

export const Route = createAPIFileRoute('/api/customer/bookings/')({
  GET: async ({ request }) => {
    try {
      const authHeader = request.headers.get('Authorization');
      const user = await authService.getUserFromHeader(authHeader || '');

      if (user.role !== 'customer') {
        return json({ error: 'Unauthorized' }, { status: 403 });
      }

      const bookings = await bookingService.getCustomerBookings(user.id);

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

      if (user.role !== 'customer') {
        return json({ error: 'Unauthorized' }, { status: 403 });
      }

      const body = await request.json();
      const bookingData = createBookingSchema.parse(body);

      const result = await bookingService.createBooking(user.id, bookingData);

      // Send booking confirmation notification
      try {
        await notificationService.sendBookingConfirmation(
          user.mobile,
          result.booking.id,
          bookingData.pickupLocation.address,
          bookingData.scheduledTime ? new Date(bookingData.scheduledTime) : undefined
        );
      } catch (notifError) {
        console.error('Failed to send booking confirmation:', notifError);
        // Don't fail the booking if notification fails
      }

      return json(result, { status: 201 });
    } catch (error: any) {
      return json(
        { error: error.message || 'Failed to create booking' },
        { status: 400 }
      );
    }
  },
});
