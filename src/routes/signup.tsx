import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { toast } from 'sonner';
import { setSession } from '@/utils/session';

export const Route = createFileRoute('/signup')({
  component: SignupPage,
});

const DEMO_OTP = '1234';

function SignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'details' | 'otp' | 'success'>('details');
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
  });
  const [otp, setOtp] = useState(['', '', '', '']);
  const [countdown, setCountdown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (step !== 'otp' || countdown <= 0) {
      clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [step, countdown]);

  useEffect(() => () => clearInterval(timerRef.current), []);

  const focusOtp = (idx: number) => setTimeout(() => otpRefs.current[idx]?.focus(), 50);

  const sendOtp = useCallback(() => {
    if (!formData.name.trim()) { toast.error('Please enter your name'); return; }
    if (!/^\d{10}$/.test(formData.mobile)) { toast.error('Enter a valid 10-digit number'); return; }
    setStep('otp');
    setCountdown(30);
    setOtp(['', '', '', '']);
    focusOtp(0);
    toast.success('OTP sent! Use 1234 for now.');
  }, [formData]);

  const verifyOtp = useCallback((digits: string[]) => {
    if (digits.join('') !== DEMO_OTP) {
      toast.error('Wrong OTP. Use 1234');
      setOtp(['', '', '', '']);
      focusOtp(0);
      return;
    }
    setSession({ mobile: formData.mobile, name: formData.name, role: 'customer', verified: true });
    setStep('success');
    toast.success(`Welcome, ${formData.name}!`);
    setTimeout(() => navigate({ to: '/booking' }), 800);
  }, [formData, navigate]);

  const handleOtpChange = useCallback((i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    setOtp(prev => {
      const next = [...prev];
      next[i] = val;
      if (val && i < 3) focusOtp(i + 1);
      if (next.every(d => d)) setTimeout(() => verifyOtp(next), 50);
      return next;
    });
  }, [verifyOtp]);

  const handleKeyDown = useCallback((i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) focusOtp(i - 1);
  }, [otp]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-16 md:pb-0">
      <Navbar />
      <div className="max-w-md mx-auto px-4 py-6">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 overflow-hidden">
            <img src="/logo.png" alt="UR's Chauffeur" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-slate-400 text-sm">Join UR's Chauffeur to book your rides</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">

          {/* Step 1 — Details */}
          {step === 'details' && (
            <>
              <h2 className="text-xl font-bold text-white mb-6">Your Details</h2>
              <div className="space-y-4">

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    autoComplete="name"
                    autoCapitalize="words"
                  />
                </div>

                {/* Mobile */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Mobile Number *</label>
                  <div className="flex items-stretch rounded-xl overflow-hidden border border-slate-700 focus-within:ring-2 focus-within:ring-emerald-500">
                    <span className="flex items-center justify-center px-4 bg-slate-800 text-white font-semibold text-sm border-r border-slate-700 flex-shrink-0">
                      +91
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={formData.mobile}
                      onChange={e => setFormData(f => ({ ...f, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                      placeholder="10 digit number"
                      className="flex-1 min-w-0 px-4 py-3 bg-slate-800 text-white focus:outline-none text-base"
                      autoComplete="tel"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!formData.name.trim() || formData.mobile.length !== 10}
                  onClick={sendOtp}
                  className="w-full bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all"
                >
                  Send OTP
                </button>
                <p className="text-center text-sm text-slate-400">
                  Already have an account?{' '}
                  <button onClick={() => navigate({ to: '/login' })} className="text-emerald-400 hover:text-emerald-300 font-semibold">
                    Login
                  </button>
                </p>
              </div>
            </>
          )}

          {/* Step 2 — OTP */}
          {step === 'otp' && (
            <>
              <button onClick={() => { setStep('details'); setOtp(['','','','']); setCd(0); }}
                className="text-slate-400 hover:text-white text-sm mb-6 flex items-center gap-1">
                ← Change details
              </button>
              <h2 className="text-xl font-bold text-white mb-1">Verify OTP</h2>
              <p className="text-sm text-slate-400 mb-6">Sent to +91 {formData.mobile}</p>

              <div className="flex justify-center gap-3 mb-4">
                {otp.map((digit, i) => (
                  <input key={i} ref={el => { otpRefs.current[i] = el; }}
                    type="text" inputMode="numeric" maxLength={1} value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    className="w-14 h-14 text-center bg-slate-800 border-2 border-slate-700 rounded-xl text-white text-xl font-bold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none"
                    autoComplete="one-time-code" autoCorrect="off" autoCapitalize="off" spellCheck={false}
                  />
                ))}
              </div>

              <p className="text-xs text-emerald-400 text-center bg-emerald-500/10 py-2 rounded-lg mb-4">
                Demo OTP: <span className="font-bold">1234</span>
              </p>

              {countdown > 0 ? (
                <p className="text-center text-sm text-slate-400">Resend in {countdown}s</p>
              ) : (
                <button type="button" onClick={sendOtp} className="w-full text-emerald-400 hover:text-emerald-300 font-semibold text-sm">
                  Resend OTP
                </button>
              )}
            </>
          )}

          {/* Step 3 — Success */}
          {step === 'success' && (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">✅</div>
              <p className="text-xl font-bold text-white mb-2">Account Created!</p>
              <p className="text-slate-400">Redirecting...</p>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          By continuing, you agree to our Terms & Privacy Policy
        </p>
      </div>
    </div>
  );
}
