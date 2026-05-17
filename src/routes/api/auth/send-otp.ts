import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { authService } from '../../../services/auth.service';
import { z } from 'zod';

const sendOTPSchema = z.object({
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Invalid mobile number'),
});

export const Route = createAPIFileRoute('/api/auth/send-otp')({
  POST: async ({ request }) => {
    try {
      const body = await request.json();
      const { mobile } = sendOTPSchema.parse(body);

      const result = await authService.sendOTP(mobile);

      return json(result, { status: 200 });
    } catch (error: any) {
      return json(
        { error: error.message || 'Failed to send OTP' },
        { status: 400 }
      );
    }
  },
});
