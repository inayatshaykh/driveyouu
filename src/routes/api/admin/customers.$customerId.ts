import { json } from '@tanstack/start';
import type { APIEvent } from '@tanstack/start';
import { adminService } from '../../../services/admin.service';
import { verifyToken } from '../../../services/auth.service';

export async function GET({ request, params }: APIEvent) {
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

    const { customerId } = params;
    if (!customerId) {
      return json({ error: 'Customer ID is required' }, { status: 400 });
    }

    const customer = await adminService.getCustomerDetails(customerId);

    return json({ customer });
  } catch (error: any) {
    console.error('Get customer details error:', error);
    return json({ error: error.message || 'Failed to fetch customer details' }, { status: 500 });
  }
}
