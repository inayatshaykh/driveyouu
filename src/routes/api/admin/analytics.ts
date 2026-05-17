import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { adminService } from '../../../services/admin.service';
import { authService } from '../../../services/auth.service';

export const Route = createAPIFileRoute('/api/admin/analytics')({
  GET: async ({ request }) => {
    try {
      const authHeader = request.headers.get('Authorization');
      const user = await authService.getUserFromHeader(authHeader || '');

      if (user.role !== 'admin') {
        return json({ error: 'Unauthorized' }, { status: 403 });
      }

      const url = new URL(request.url);
      const startDate = url.searchParams.get('startDate')
        ? new Date(url.searchParams.get('startDate')!)
        : undefined;
      const endDate = url.searchParams.get('endDate')
        ? new Date(url.searchParams.get('endDate')!)
        : undefined;

      const analytics = await adminService.getAnalytics(startDate, endDate);

      return json({ analytics }, { status: 200 });
    } catch (error: any) {
      return json(
        { error: error.message || 'Failed to fetch analytics' },
        { status: 400 }
      );
    }
  },
});
