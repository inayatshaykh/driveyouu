import { json } from '@tanstack/start';
import type { APIEvent } from '@tanstack/start';
import { adminService } from '../../../services/admin.service';
import { verifyToken } from '../../../services/auth.service';

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

    const customers = await adminService.getAllCustomers();

    return json({ customers });
  } catch (error: any) {
    console.error('Get customers error:', error);
    return json({ error: error.message || 'Failed to fetch customers' }, { status: 500 });
  }
}
