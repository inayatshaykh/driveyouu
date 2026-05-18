import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useRef, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/login')({
  component: LoginPage,
});

const DEMO_OTP = '1234';

// Demo user database
const DEMO_USERS: Record<string, { role: 'customer' | 'admin' | 'driver'; name: string; email: string }> = {
  '9876543210': { role: 'customer', name: 'Demo Customer', email: 'customer@demo.com' },
  '9876543212': { role: 'admin', name: 'Demo Admin', email: 'admin@demo.com' },
  '9876543211': { role: 'driver', name: 'Demo Driver', email: 'driver@demo.com' },
};

function LoginPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'mobile' | 'otp' | 'success'>('mobile');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [countdown, setCountdown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (step !== 'otp' || countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [step, countdown]);

  const sendOtp = () => {
    if (!/^\d{10}$/.test(mobile)) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }
    setStep('otp');
    setCountdown(30);
    setOtp(['', '', '', '']);
    setTimeout(() => otpRefs.current[0]?.focus(), 100);
  };

  const verifyOtp = (digits: string[]) => {
    const enteredOtp = digits.join('');
    if (enteredOtp === DEMO_OTP) {
      const userInfo = DEMO_USERS[mobile];
      
      if (!userInfo) {
        // Default to customer if not in demo database
        userInfo = { role: 'customer', name: 'Customer', email: `${mobile}@demo.com` };
      }

      // Set auth data in localStorage
      localStorage.setItem('auth_token', 'demo-token-' + Date.now());
      localStorage.setItem('auth_user', JSON.stringify({
        id: mobile,
        mobile: mobile,
        role: userInfo.role,
        name: userInfo.name,
        email: userInfo.email,
      }));

      setStep('success');
      toast.success(`Welcome, ${userInfo.name}!`);

      // Redirect based on role
      setTimeout(() => {
        if (userInfo.role === 'admin') {
          navigate({ to: '/admin' });
        } else if (userInfo.role === 'driver') {
          navigate({ to: '/driver' });
        } else {
          navigate({ to: '/booking' });
        }
      }, 1000);
    } else if (enteredOtp.length === 4) {
      // Invalid OTP
      toast.error('Invalid OTP. Please try again.');
      setOtp(['', '', '', '']);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 3) otpRefs.current[index + 1]?.focus();
    if (next.every((d) => d)) verifyOtp(next);
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleBack = () => {
    setStep('mobile');
    setOtp(['', '', '', '']);
    setCountdown(0);
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      
      <div className="max-w-md mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 mb-4">
            <ShieldCheck size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-slate-400">
            Login to access your account
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
          {step === 'mobile' && (
            <>
              <h2 className="text-xl font-bold text-white mb-6">Enter Mobile Number</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Mobile Number
                  </label>
                  <div className="flex gap-2">
                    <div className="flex items-center px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-semibold">
                      +91
                    </div>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="10 digit number"
                      className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="button"
                  disabled={mobile.length !== 10}
                  onClick={sendOtp}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all"
                >
                  Send OTP
                </button>
              </div>
            </>
          )}

          {step === 'otp' && (
            <>
              <button
                onClick={handleBack}
                className="text-slate-400 hover:text-white text-sm mb-6 flex items-center gap-2"
              >
                ← Change number
              </button>

              <h2 className="text-xl font-bold text-white mb-2">Verify OTP</h2>
              <p className="text-sm text-slate-400 mb-6">
                Sent to +91 {mobile}
              </p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">
                    Enter 4-digit OTP
                  </label>
                  <div className="flex justify-center gap-3 mb-4">
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => { otpRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        className="w-14 h-14 text-center bg-slate-800 border-2 border-slate-700 rounded-xl text-white text-xl font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                      />
                    ))}
                  </div>
                  <p className="text-xs text-blue-400 text-center bg-blue-500/10 py-2 rounded-lg">
                    Demo OTP: <span className="font-bold">1234</span>
                  </p>
                </div>

                {countdown > 0 ? (
                  <p className="text-center text-sm text-slate-400">
                    Resend OTP in {countdown}s
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={sendOtp}
                    className="w-full text-blue-400 hover:text-blue-300 font-semibold text-sm"
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            </>
          )}

          {step === 'success' && (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">✅</div>
              <p className="text-xl font-bold text-white mb-2">
                Verified Successfully!
              </p>
              <p className="text-slate-400">
                Redirecting you...
              </p>
            </div>
          )}
        </div>

        {/* Info */}
        {step === 'mobile' && (
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
