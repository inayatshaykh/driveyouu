import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { authService } from '../../../services/auth.service';
import { z } from 'zod';

const verifyOTPSchema = z.object({
  otpId: z.string().uuid(),
  otp: z.string().length(6),
});

export const Route = createAPIFileRoute('/api/auth/verify-otp')({
  POST: async ({ request }) => {
    try {
      const body = await request.json();
      const { otpId, otp } = verifyOTPSchema.parse(body);

      const result = await authService.verifyOTP(otpId, otp);

      return json(result, { status: 200 });
    } catch (error: any) {
      return json(
        { error: error.message || 'Failed to verify OTP' },
        { status: 400 }
      );
    }
  },
});
