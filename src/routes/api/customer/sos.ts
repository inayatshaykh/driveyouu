import { json } from '@tanstack/start';
import type { APIEvent } from '@tanstack/start';
import { db, sosAlerts, bookings, customers, users, drivers } from '../../../db';
import { verifyToken } from '../../../services/auth.service';
import { notificationService } from '../../../services/notification.service';
import { eq, and } from 'drizzle-orm';
import { sendToUser, sendToBooking } from '../../../../server/websocket';

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
    const { bookingId, latitude, longitude } = body;

    if (!bookingId || !latitude || !longitude) {
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

    // Get customer
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.userId, payload.userId))
      .limit(1);

    if (!customer || booking.customerId !== customer.id) {
      return json({ error: 'Unauthorized to trigger SOS for this booking' }, { status: 403 });
    }

    // Create SOS alert
    const [sosAlert] = await db
      .insert(sosAlerts)
      .values({
        bookingId,
        customerId: customer.id,
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        status: 'active',
      })
      .returning();

    // Broadcast SOS alert via WebSocket
    // Notify customer
    sendToUser(payload.userId, {
      type: 'sos_triggered',
      payload: {
        sosId: sosAlert.id,
        bookingId,
        timestamp: new Date().toISOString(),
      },
    });

    // Notify all in booking room
    sendToBooking(bookingId, {
      type: 'sos_alert',
      payload: {
        sosId: sosAlert.id,
        bookingId,
        latitude,
        longitude,
        timestamp: new Date().toISOString(),
      },
    });

    // Send SMS to emergency contacts
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, payload.userId))
        .limit(1);

      if (user) {
        const emergencyContacts = (customer as any).emergencyContacts || [];
        
        // Send SOS alert to each emergency contact
        for (const contact of emergencyContacts) {
          await notificationService.sendSOSAlert(
            contact.mobile,
            user.name || 'Customer',
            { latitude, longitude },
            bookingId
          );
        }
      }
    } catch (notifError) {
      console.error('Failed to send SOS notifications:', notifError);
      // Don't fail the SOS trigger if notifications fail
    }

    return json({
      sosAlert: {
        id: sosAlert.id,
        bookingId: sosAlert.bookingId,
        latitude: Number(sosAlert.latitude),
        longitude: Number(sosAlert.longitude),
        status: sosAlert.status,
        createdAt: sosAlert.createdAt,
      },
    });
  } catch (error: any) {
    console.error('SOS trigger error:', error);
    return json({ error: error.message || 'Failed to trigger SOS' }, { status: 500 });
  }
}
