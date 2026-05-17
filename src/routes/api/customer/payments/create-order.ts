import { json } from '@tanstack/start';
import type { APIEvent } from '@tanstack/start';
import { paymentService } from '../../../../services/payment.service';
import { verifyToken } from '../../../../services/auth.service';
import { db, bookings, customers } from '../../../../db';
import { eq } from 'drizzle-orm';

export async function POST({ request }: APIEvent) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = await verifyToken(token);

    if (!payload || payload.role !== 'customer') {
      return json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { bookingId, amount, method } = body;

    if (!bookingId || !amount) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify booking belongs to customer
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!booking) {
      return json({ error: 'Booking not found' }, { status: 404 });
    }

    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.userId, payload.userId))
      .limit(1);

    if (!customer || booking.customerId !== customer.id) {
      return json({ error: 'Unauthorized to pay for this booking' }, { status: 403 });
    }

    // Handle cash payment
    if (method === 'cash') {
      // Create cash payment record
      await paymentService.createOrder(bookingId, amount);
      
      // Update booking status
      await db
        .update(bookings)
        .set({
          status: 'confirmed',
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, bookingId));

      return json({
        success: true,
        method: 'cash',
        message: 'Booking confirmed. Pay cash to driver on completion.',
      });
    }

    // Create Razorpay order for online payments
    const order = await paymentService.createOrder(bookingId, amount);

    return json(order);
  } catch (error: any) {
    console.error('Create order error:', error);
    return json({ error: error.message || 'Failed to create payment order' }, { status: 500 });
  }
}
