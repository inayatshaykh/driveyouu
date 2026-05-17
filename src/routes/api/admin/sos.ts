import { json } from '@tanstack/start';
import type { APIEvent } from '@tanstack/start';
import { db, sosAlerts, bookings, customers, users, drivers } from '../../../db';
import { verifyToken } from '../../../services/auth.service';
import { eq, desc, and, gte } from 'drizzle-orm';

export async function GET({ request }: APIEvent) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = await verifyToken(token);

    if (!payload || payload.role !== 'admin') {
      return json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status');

    // Get alerts from last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    let query = db
      .select({
        sosAlert: sosAlerts,
        booking: bookings,
        customer: customers,
        customerUser: users,
      })
      .from(sosAlerts)
      .innerJoin(bookings, eq(sosAlerts.bookingId, bookings.id))
      .innerJoin(customers, eq(sosAlerts.customerId, customers.id))
      .innerJoin(users, eq(customers.userId, users.id))
      .where(gte(sosAlerts.createdAt, twentyFourHoursAgo))
      .orderBy(desc(sosAlerts.createdAt));

    if (status && status !== 'all') {
      query = query.where(and(
        gte(sosAlerts.createdAt, twentyFourHoursAgo),
        eq(sosAlerts.status, status)
      ));
    }

    const results = await query;

    // Get driver info for each alert
    const alertsWithDetails = await Promise.all(
      results.map(async ({ sosAlert, booking, customer, customerUser }) => {
        let driverInfo = null;

        if (booking.driverId) {
          const [driver] = await db
            .select({
              driver: drivers,
              user: users,
            })
            .from(drivers)
            .innerJoin(users, eq(drivers.userId, users.id))
            .where(eq(drivers.id, booking.driverId))
            .limit(1);

          if (driver) {
            driverInfo = {
              driverId: driver.user.id,
              driverName: driver.user.name,
              driverMobile: driver.user.mobile,
            };
          }
        }

        return {
          id: sosAlert.id,
          bookingId: sosAlert.bookingId,
          customerId: sosAlert.customerId,
          customerName: customerUser.name,
          customerMobile: customerUser.mobile,
          ...driverInfo,
          latitude: Number(sosAlert.latitude),
          longitude: Number(sosAlert.longitude),
          status: sosAlert.status,
          resolvedBy: sosAlert.resolvedBy,
          resolvedAt: sosAlert.resolvedAt,
          notes: sosAlert.notes,
          createdAt: sosAlert.createdAt,
          pickupAddress: booking.pickupAddress,
          dropAddress: booking.dropAddress,
        };
      })
    );

    return json({ alerts: alertsWithDetails });
  } catch (error: any) {
    console.error('Get SOS alerts error:', error);
    return json({ error: error.message || 'Failed to fetch SOS alerts' }, { status: 500 });
  }
}
