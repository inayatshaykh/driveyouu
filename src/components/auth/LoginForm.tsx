import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

const mobileSchema = z.object({
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
});

const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

type MobileFormData = z.infer<typeof mobileSchema>;
type OTPFormData = z.infer<typeof otpSchema>;

export function LoginForm() {
  const [step, setStep] = useState<'mobile' | 'otp'>('mobile');
  const [otpId, setOtpId] = useState<string>('');
  const [mobile, setMobile] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const mobileForm = useForm<MobileFormData>({
    resolver: zodResolver(mobileSchema),
  });

  const otpForm = useForm<OTPFormData>({
    resolver: zodResolver(otpSchema),
  });

  const handleSendOTP = async (data: MobileFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: data.mobile }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send OTP');
      }

      setOtpId(result.otpId);
      setMobile(data.mobile);
      setStep('otp');
      toast.success('OTP sent successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (data: OTPFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otpId, otp: data.otp }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to verify OTP');
      }

      login(result.token, result.user);
      toast.success('Login successful');
    } catch (error: any) {
      toast.error(error.message || 'Failed to verify OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to resend OTP');
      }

      setOtpId(result.otpId);
      toast.success('OTP resent successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Welcome to UR's Chauffeur</CardTitle>
        <CardDescription>
          {step === 'mobile'
            ? 'Enter your mobile number to get started'
            : 'Enter the OTP sent to your mobile'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === 'mobile' ? (
          <form onSubmit={mobileForm.handleSubmit(handleSendOTP)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number</Label>
              <div className="flex gap-2">
                <div className="flex items-center justify-center px-3 border rounded-md bg-muted">
                  +91
                </div>
                <Input
                  id="mobile"
                  type="tel"
                  placeholder="9876543210"
                  maxLength={10}
                  {...mobileForm.register('mobile')}
                />
              </div>
              {mobileForm.formState.errors.mobile && (
                <p className="text-sm text-destructive">
                  {mobileForm.formState.errors.mobile.message}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send OTP'}
            </Button>
          </form>
        ) : (
          <form onSubmit={otpForm.handleSubmit(handleVerifyOTP)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Enter OTP</Label>
              <Input
                id="otp"
                type="text"
                placeholder="123456"
                maxLength={6}
                {...otpForm.register('otp')}
              />
              {otpForm.formState.errors.otp && (
                <p className="text-sm text-destructive">
                  {otpForm.formState.errors.otp.message}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                OTP sent to +91 {mobile}
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Verifying...' : 'Verify OTP'}
            </Button>
            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => setStep('mobile')}
                className="text-primary hover:underline"
              >
                Change number
              </button>
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={isLoading}
                className="text-primary hover:underline"
              >
                Resend OTP
              </button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
