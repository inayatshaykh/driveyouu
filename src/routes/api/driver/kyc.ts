import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { driverService } from '../../../services/driver.service';
import { authService } from '../../../services/auth.service';
import { z } from 'zod';

const uploadKYCSchema = z.object({
  documentType: z.enum(['aadhaar', 'pan', 'license', 'rc', 'photo']),
  documentUrl: z.string().url(),
  documentNumber: z.string().optional(),
});

export const Route = createAPIFileRoute('/api/driver/kyc')({
  GET: async ({ request }) => {
    try {
      const authHeader = request.headers.get('Authorization');
      const user = await authService.getUserFromHeader(authHeader || '');

      if (user.role !== 'driver') {
        return json({ error: 'Unauthorized' }, { status: 403 });
      }

      const documents = await driverService.getKYCDocuments(user.id);

      return json({ documents }, { status: 200 });
    } catch (error: any) {
      return json(
        { error: error.message || 'Failed to fetch KYC documents' },
        { status: 400 }
      );
    }
  },

  POST: async ({ request }) => {
    try {
      const authHeader = request.headers.get('Authorization');
      const user = await authService.getUserFromHeader(authHeader || '');

      if (user.role !== 'driver') {
        return json({ error: 'Unauthorized' }, { status: 403 });
      }

      const body = await request.json();
      const { documentType, documentUrl, documentNumber } = uploadKYCSchema.parse(body);

      const document = await driverService.uploadKYCDocument(
        user.id,
        documentType,
        documentUrl,
        documentNumber
      );

      return json({ document }, { status: 201 });
    } catch (error: any) {
      return json(
        { error: error.message || 'Failed to upload document' },
        { status: 400 }
      );
    }
  },
});
