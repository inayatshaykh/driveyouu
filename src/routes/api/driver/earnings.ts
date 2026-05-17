import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { driverService } from '../../../services/driver.service';
import { authService } from '../../../services/auth.service';

export const Route = createAPIFileRoute('/api/driver/earnings')({
  GET: async ({ request }) => {
    try {
      const authHeader = request.headers.get('Authorization');
      const user = await authService.getUserFromHeader(authHeader || '');

      if (user.role !== 'driver') {
        return json({ error: 'Unauthorized' }, { status: 403 });
      }

      const earnings = await driverService.getEarningsSummary(user.id);

      return json({ earnings }, { status: 200 });
    } catch (error: any) {
      return json(
        { error: error.message || 'Failed to fetch earnings' },
        { status: 400 }
      );
    }
  },
});
