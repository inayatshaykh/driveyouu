import { json } from '@tanstack/start';
import type { APIEvent } from '@tanstack/start';
import { db, customers, users } from '../../../db';
import { verifyToken } from '../../../services/auth.service';
import { eq } from 'drizzle-orm';

// GET - Fetch emergency contacts
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

    return json({
      contacts: customer.emergencyContacts || [],
    });
  } catch (error: any) {
    console.error('Get emergency contacts error:', error);
    return json({ error: error.message || 'Failed to fetch emergency contacts' }, { status: 500 });
  }
}

// POST - Add emergency contact
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
    const { name, mobile } = body;

    if (!name || !mobile) {
      return json({ error: 'Name and mobile are required' }, { status: 400 });
    }

    // Validate mobile number
    if (!/^\d{10}$/.test(mobile)) {
      return json({ error: 'Invalid mobile number format' }, { status: 400 });
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

    // Get existing contacts
    const existingContacts = (customer.emergencyContacts as any[]) || [];

    // Check if contact already exists
    if (existingContacts.some((c: any) => c.mobile === mobile)) {
      return json({ error: 'Contact already exists' }, { status: 400 });
    }

    // Limit to 5 emergency contacts
    if (existingContacts.length >= 5) {
      return json({ error: 'Maximum 5 emergency contacts allowed' }, { status: 400 });
    }

    // Add new contact
    const updatedContacts = [...existingContacts, { name, mobile }];

    // Update customer
    await db
      .update(customers)
      .set({
        emergencyContacts: updatedContacts,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, customer.id));

    return json({
      contacts: updatedContacts,
    });
  } catch (error: any) {
    console.error('Add emergency contact error:', error);
    return json({ error: error.message || 'Failed to add emergency contact' }, { status: 500 });
  }
}

// DELETE - Remove emergency contact
export async function DELETE({ request }: APIEvent) {
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
    const { mobile } = body;

    if (!mobile) {
      return json({ error: 'Mobile number is required' }, { status: 400 });
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

    // Get existing contacts
    const existingContacts = (customer.emergencyContacts as any[]) || [];

    // Remove contact
    const updatedContacts = existingContacts.filter((c: any) => c.mobile !== mobile);

    // Update customer
    await db
      .update(customers)
      .set({
        emergencyContacts: updatedContacts,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, customer.id));

    return json({
      contacts: updatedContacts,
    });
  } catch (error: any) {
    console.error('Delete emergency contact error:', error);
    return json({ error: error.message || 'Failed to delete emergency contact' }, { status: 500 });
  }
}
