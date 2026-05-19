import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { auth } from '@/lib/supabase';

export const Route = createFileRoute('/signup')({
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'details' | 'otp' | 'success'>('details');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    role: 'customer' as 'customer' | 'driver',
  });
  const [otp, setOtp] = useState(['', '', '', '']);
  const [countdown, setCountdown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const rafRef = useRef<number>();
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (step !== 'otp' || countdown <= 0) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = undefined;
      }
      return;
    }
    
    timerRef.current = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = undefined;
      }
    };
  }, [step, countdown]);

  const sendOtp = useCallback(async () => {
    if (!formData.name.trim()) {
      toast.error('Please enter your name');
      return;
    }
    if (!/^\d{10}$/.test(formData.mobile)) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      const phoneNumber = `+91${formData.mobile}`;
      const { error } = await auth.signInWithPhone(phoneNumber);
      
      if (error) {
        toast.error(error.message || 'Failed to send OTP');
        return;
      }

      setStep('otp');
      setCountdown(30);
      setOtp(['', '', '', '']);
      toast.success('OTP sent successfully!');
      
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = requestAnimationFrame(() => {
          otpRefs.current[0]?.focus();
        });
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to send OTP');
    }
  }, [formData]);

  const verifyOtp = useCallback(async (digits: string[]) => {
    const enteredOtp = digits.join('');
    
    if (enteredOtp.length !== 4) return;

    try {
      const phoneNumber = `+91${formData.mobile}`;
      const { data, error } = await auth.verifyOtp(phoneNumber, enteredOtp);
      
      if (error) {
        toast.error('Invalid OTP. Please try again.');
        setOtp(['', '', '', '']);
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = requestAnimationFrame(() => {
            otpRefs.current[0]?.focus();
          });
        });
        return;
      }

      if (data.user) {
        // Update user metadata with signup info
        const { error: updateError } = await auth.signUpWithEmail(
          formData.email || `${formData.mobile}@temp.com`,
          'temp-password-' + Date.now(),
          {
            name: formData.name,
            role: formData.role,
            phone: phoneNumber,
          }
        );

        // Store auth info
        localStorage.setItem('auth_token', data.session?.access_token || '');
        localStorage.setItem('auth_user', JSON.stringify({
          id: data.user.id,
          mobile: data.user.phone,
          role: formData.role,
          name: formData.name,
          email: formData.email || '',
        }));

        setStep('success');
        toast.success(`Welcome, ${formData.name}!`);

        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = requestAnimationFrame(() => {
            if (formData.role === 'driver') {
              navigate({ to: '/driver' });
            } else {
              navigate({ to: '/booking' });
            }
          });
        });
      }
    } catch (error: any) {
      toast.error(error.message || 'Verification failed');
      setOtp(['', '', '', '']);
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = requestAnimationFrame(() => {
          otpRefs.current[0]?.focus();
        });
      });
    }
  }, [formData, navigate]);

  const handleOtpChange = useCallback((index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    
    setOtp(prev => {
      const next = [...prev];
      next[index] = value;
      
      if (value && index < 3) {
        rafRef.current = requestAnimationFrame(() => {
          otpRefs.current[index + 1]?.focus();
        });
      }
      
      if (next.every((d) => d)) {
        rafRef.current = requestAnimationFrame(() => {
          verifyOtp(next);
        });
      }
      
      return next;
    });
  }, [verifyOtp]);

  const handleOtpKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      setOtp(prev => {
        if (!prev[index] && index > 0) {
          rafRef.current = requestAnimationFrame(() => {
            otpRefs.current[index - 1]?.focus();
          });
        }
        return prev;
      });
    }
  }, []);

  const handleBack = useCallback(() => {
    setStep('details');
    setOtp(['', '', '', '']);
    setCountdown(0);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      
      <div className="max-w-md mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 mb-4">
            <UserPlus size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-slate-400">
            Join us to book your rides
          </p>
        </div>

        {/* Signup Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
          {step === 'details' && (
            <>
              <h2 className="text-xl font-bold text-white mb-6">Enter Your Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    autoFocus
                    autoComplete="name"
                    autoCorrect="off"
                    autoCapitalize="words"
                    spellCheck={false}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    autoComplete="email"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    inputMode="email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Mobile Number *
                  </label>
                  <div className="flex gap-2">
                    <div className="flex items-center px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-semibold">
                      +91
                    </div>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                      placeholder="10 digit number"
                      className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      autoComplete="tel"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    I want to signup as *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'customer' })}
                      className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                        formData.role === 'customer'
                          ? 'bg-blue-600 text-white border-2 border-blue-500'
                          : 'bg-slate-800 text-slate-300 border-2 border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      Customer
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'driver' })}
                      className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                        formData.role === 'driver'
                          ? 'bg-blue-600 text-white border-2 border-blue-500'
                          : 'bg-slate-800 text-slate-300 border-2 border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      Driver
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!formData.name.trim() || formData.mobile.length !== 10}
                  onClick={sendOtp}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all"
                >
                  Send OTP
                </button>

                <div className="text-center">
                  <p className="text-sm text-slate-400">
                    Already have an account?{' '}
                    <button
                      onClick={() => navigate({ to: '/login' })}
                      className="text-blue-400 hover:text-blue-300 font-semibold"
                    >
                      Login
                    </button>
                  </p>
                </div>
              </div>
            </>
          )}

          {step === 'otp' && (
            <>
              <button
                onClick={handleBack}
                className="text-slate-400 hover:text-white text-sm mb-6 flex items-center gap-2"
              >
                ← Change details
              </button>

              <h2 className="text-xl font-bold text-white mb-2">Verify OTP</h2>
              <p className="text-sm text-slate-400 mb-6">
                Sent to +91 {formData.mobile}
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
                        autoComplete="one-time-code"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck={false}
                      />
                    ))}
                  </div>
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
                Account Created Successfully!
              </p>
              <p className="text-slate-400">
                Redirecting you...
              </p>
            </div>
          )}
        </div>

        {/* Info */}
        {step === 'details' && (
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
