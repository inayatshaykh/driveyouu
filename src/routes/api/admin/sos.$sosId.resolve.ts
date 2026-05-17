import { json } from '@tanstack/start';
import type { APIEvent } from '@tanstack/start';
import { db, sosAlerts } from '../../../db';
import { verifyToken } from '../../../services/auth.service';
import { eq } from 'drizzle-orm';

export async function POST({ request, params }: APIEvent) {
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

    const { sosId } = params;
    if (!sosId) {
      return json({ error: 'SOS ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { notes } = body;

    // Get SOS alert
    const [sosAlert] = await db
      .select()
      .from(sosAlerts)
      .where(eq(sosAlerts.id, sosId))
      .limit(1);

    if (!sosAlert) {
      return json({ error: 'SOS alert not found' }, { status: 404 });
    }

    if (sosAlert.status === 'resolved') {
      return json({ error: 'SOS alert already resolved' }, { status: 400 });
    }

    // Resolve alert
    const [updated] = await db
      .update(sosAlerts)
      .set({
        status: 'resolved',
        resolvedBy: payload.userId,
        resolvedAt: new Date(),
        notes: notes || 'Resolved by admin',
      })
      .where(eq(sosAlerts.id, sosId))
      .returning();

    return json({
      sosAlert: {
        id: updated.id,
        status: updated.status,
        resolvedBy: updated.resolvedBy,
        resolvedAt: updated.resolvedAt,
        notes: updated.notes,
      },
    });
  } catch (error: any) {
    console.error('Admin SOS resolve error:', error);
    return json({ error: error.message || 'Failed to resolve SOS' }, { status: 500 });
  }
}
