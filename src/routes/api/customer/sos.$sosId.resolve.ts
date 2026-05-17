import { json } from '@tanstack/start';
import type { APIEvent } from '@tanstack/start';
import { db, sosAlerts, customers } from '../../../db';
import { verifyToken } from '../../../services/auth.service';
import { eq, and } from 'drizzle-orm';

export async function POST({ request, params }: APIEvent) {
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

    const { sosId } = params;
    if (!sosId) {
      return json({ error: 'SOS ID is required' }, { status: 400 });
    }

    // Get SOS alert
    const [sosAlert] = await db
      .select()
      .from(sosAlerts)
      .where(eq(sosAlerts.id, sosId))
      .limit(1);

    if (!sosAlert) {
      return json({ error: 'SOS alert not found' }, { status: 404 });
    }

    // Verify customer owns this alert
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.userId, payload.userId))
      .limit(1);

    if (!customer || sosAlert.customerId !== customer.id) {
      return json({ error: 'Unauthorized to resolve this SOS alert' }, { status: 403 });
    }

    // Resolve alert
    const [updated] = await db
      .update(sosAlerts)
      .set({
        status: 'resolved',
        resolvedBy: payload.userId,
        resolvedAt: new Date(),
        notes: 'Resolved by customer',
      })
      .where(eq(sosAlerts.id, sosId))
      .returning();

    return json({
      sosAlert: {
        id: updated.id,
        status: updated.status,
        resolvedAt: updated.resolvedAt,
      },
    });
  } catch (error: any) {
    console.error('SOS resolve error:', error);
    return json({ error: error.message || 'Failed to resolve SOS' }, { status: 500 });
  }
}
