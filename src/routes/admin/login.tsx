import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Shield } from 'lucide-react';
import { toast } from 'sonner';
import {
  sendAdminOtp,
  verifyAdminOtp,
  setAdminSession,
  getAdminSession,
} from '@/utils/adminSession';
import { setSession } from '@/utils/session';

export const Route = createFileRoute('/admin/login')({
  // If already logged in as admin, skip straight to dashboard
  beforeLoad: () => {
    if (getAdminSession()) {
      throw redirect({ to: '/admin/dashboard' });
    }
  },
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'mobile' | 'otp' | 'success'>('mobile');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [countdown, setCd] = useState(0);
  const [loading, setLoading] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  // Countdown timer
  useEffect(() => {
    if (step !== 'otp' || countdown <= 0) {
      clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => setCd(c => c - 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [step, countdown]);

  useEffect(() => () => clearInterval(timerRef.current), []);

  const focusOtp = (idx: number) => {
    setTimeout(() => otpRefs.current[idx]?.focus(), 50);
  };

  const handleSendOtp = useCallback(async () => {
    if (!/^\d{10}$/.test(mobile)) {
      toast.error('Enter a valid 10-digit mobile number');
      return;
    }
    setLoading(true);
    const { error } = await sendAdminOtp(mobile);
    setLoading(false);
    if (error) {
      toast.error(error);
      return;
    }
    setStep('otp');
    setCd(30);
    setOtp(['', '', '', '']);
    focusOtp(0);
    toast.success('OTP sent to +91 ' + mobile);
  }, [mobile]);

  const handleVerifyOtp = useCallback(async (digits: string[]) => {
    const enteredOtp = digits.join('');
    if (enteredOtp.length < 4) return;
    setLoading(true);
    const { user, error } = await verifyAdminOtp(mobile, enteredOtp);
    setLoading(false);
    if (error || !user) {
      toast.error(error || 'Verification failed');
      setOtp(['', '', '', '']);
      focusOtp(0);
      return;
    }
    setAdminSession(user);
    setSession({ mobile: user.mobile, name: user.name, role: 'admin', verified: true });
    setStep('success');
    toast.success(`Welcome, ${user.name}!`);
    setTimeout(() => navigate({ to: '/admin/dashboard' }), 800);
  }, [mobile, navigate]);

  const handleOtpChange = useCallback((i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    setOtp(prev => {
      const next = [...prev];
      next[i] = val;
      if (val && i < 3) focusOtp(i + 1);
      if (next.every(d => d)) setTimeout(() => handleVerifyOtp(next), 50);
      return next;
    });
  }, [handleVerifyOtp]);

  const handleKeyDown = useCallback((i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) focusOtp(i - 1);
  }, [otp]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-900 border border-slate-700 mb-4">
            <Shield size={32} className="text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">Admin Login</h1>
          <p className="text-slate-400 text-sm">UR's Chauffeur — Admin Panel</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">

          {/* Step 1 — Mobile */}
          {step === 'mobile' && (
            <>
              <h2 className="text-lg font-bold text-white mb-5">Enter Admin Mobile Number</h2>
              <label className="block text-sm font-medium text-slate-300 mb-2">Mobile Number</label>
              <div className="flex gap-2 mb-6">
                <span className="flex items-center px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-semibold text-sm">
                  +91
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={mobile}
                  onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                  placeholder="10 digit number"
                  className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  autoComplete="tel"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                />
              </div>
              <button
                type="button"
                disabled={mobile.length !== 10 || loading}
                onClick={handleSendOtp}
                className="w-full bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : null}
                Send OTP
              </button>
              <p className="text-xs text-slate-600 text-center mt-5">
                Only authorized admin numbers can access this panel.
              </p>
            </>
          )}

          {/* Step 2 — OTP */}
          {step === 'otp' && (
            <>
              <button
                onClick={() => { setStep('mobile'); setOtp(['','','','']); setCd(0); }}
                className="text-slate-400 hover:text-white text-sm mb-6 flex items-center gap-1"
              >
                ← Change number
              </button>
              <h2 className="text-lg font-bold text-white mb-1">Verify OTP</h2>
              <p className="text-sm text-slate-400 mb-6">Sent to +91 {mobile}</p>

              <div className="flex justify-center gap-3 mb-4">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    disabled={loading}
                    className="w-14 h-14 text-center bg-slate-800 border-2 border-slate-700 rounded-xl text-white text-xl font-bold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none disabled:opacity-50"
                    autoComplete="one-time-code"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                  />
                ))}
              </div>

              {/* Demo hint — remove this when real OTP is integrated */}
              <p className="text-xs text-emerald-400 text-center bg-emerald-500/10 py-2 rounded-lg mb-4">
                Demo OTP: <span className="font-bold">1234</span>
              </p>

              {loading && (
                <p className="text-center text-sm text-slate-400 mb-3">Verifying...</p>
              )}

              {countdown > 0 ? (
                <p className="text-center text-sm text-slate-400">Resend OTP in {countdown}s</p>
              ) : (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="w-full text-emerald-400 hover:text-emerald-300 font-semibold text-sm disabled:opacity-50"
                >
                  Resend OTP
                </button>
              )}
            </>
          )}

          {/* Step 3 — Success */}
          {step === 'success' && (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">✅</div>
              <p className="text-xl font-bold text-white mb-2">Access Granted</p>
              <p className="text-slate-400">Redirecting to dashboard...</p>
            </div>
          )}
        </div>

        {/* Back to main site */}
        <p className="text-center text-xs text-slate-600 mt-6">
          Not an admin?{' '}
          <a href="/" className="text-slate-400 hover:text-white transition">
            Go to main site →
          </a>
        </p>
      </div>
    </div>
  );
}
