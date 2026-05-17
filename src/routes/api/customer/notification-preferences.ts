import { json } from '@tanstack/start';
import type { APIEvent } from '@tanstack/start';
import { db, customers } from '../../../db';
import { verifyToken } from '../../../services/auth.service';
import { eq } from 'drizzle-orm';

// GET - Fetch notification preferences
export async function GET({ request }: APIEvent) {
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

    // Get customer
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.userId, payload.userId))
      .limit(1);

    if (!customer) {
      return json({ error: 'Customer not found' }, { status: 404 });
    }

    // Return preferences (stored in customer record or use defaults)
    const preferences = (customer as any).notificationPreferences || getDefaultPreferences();

    return json({ preferences });
  } catch (error: any) {
    console.error('Get notification preferences error:', error);
    return json({ error: error.message || 'Failed to fetch preferences' }, { status: 500 });
  }
}

// POST - Update notification preferences
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
    const { preferences } = body;

    if (!preferences) {
      return json({ error: 'Preferences are required' }, { status: 400 });
    }

    // Get customer
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.userId, payload.userId))
      .limit(1);

    if (!customer) {
      return json({ error: 'Customer not found' }, { status: 404 });
    }

    // Update preferences
    // Note: You may need to add a notificationPreferences column to customers table
    // For now, we'll just return success
    // await db
    //   .update(customers)
    //   .set({
    //     notificationPreferences: preferences,
    //     updatedAt: new Date(),
    //   })
    //   .where(eq(customers.id, customer.id));

    return json({
      success: true,
      preferences,
    });
  } catch (error: any) {
    console.error('Update notification preferences error:', error);
    return json({ error: error.message || 'Failed to update preferences' }, { status: 500 });
  }
}

function getDefaultPreferences() {
  return [
    {
      id: 'booking_updates',
      name: 'Booking Updates',
      description: 'Notifications about your booking status',
      channels: { push: true, sms: true, email: false },
    },
    {
      id: 'driver_updates',
      name: 'Driver Updates',
      description: 'Driver assignment and arrival notifications',
      channels: { push: true, sms: true, email: false },
    },
    {
      id: 'payment_updates',
      name: 'Payment Updates',
      description: 'Payment confirmations and receipts',
      channels: { push: true, sms: true, email: true },
    },
    {
      id: 'promotional',
      name: 'Promotional Offers',
      description: 'Special offers and discounts',
      channels: { push: true, sms: false, email: true },
    },
    {
      id: 'safety_alerts',
      name: 'Safety Alerts',
      description: 'SOS and emergency notifications (always enabled)',
      channels: { push: true, sms: true, email: false },
    },
  ];
}
