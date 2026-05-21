import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useRef, useEffect, useCallback } from 'react';
import { ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { setSession } from '@/utils/session';

export const Route = createFileRoute('/login')({
  component: LoginPage,
});

const DEMO_OTP = '1234';

const DEMO_USERS: Record<string, { role: 'customer' | 'admin' | 'driver'; name: string }> = {
  '9876543210': { role: 'customer', name: 'Demo Customer' },
  '9876543212': { role: 'admin',    name: 'Demo Admin'    },
  '9876543211': { role: 'driver',   name: 'Demo Driver'   },
};

function LoginPage() {
  const navigate = useNavigate();
  const [step, setStep]         = useState<'mobile' | 'otp' | 'success'>('mobile');
  const [mobile, setMobile]     = useState('');
  const [otp, setOtp]           = useState(['', '', '', '']);
  const [countdown, setCd]      = useState(0);
  const otpRefs  = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  // countdown timer
  useEffect(() => {
    if (step !== 'otp' || countdown <= 0) {
      clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => setCd(c => c - 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [step, countdown]);

  // cleanup
  useEffect(() => () => clearInterval(timerRef.current), []);

  const focusOtp = (idx: number) => {
    setTimeout(() => otpRefs.current[idx]?.focus(), 50);
  };

  const sendOtp = useCallback(() => {
    if (!/^\d{10}$/.test(mobile)) {
      toast.error('Enter a valid 10-digit number');
      return;
    }
    setStep('otp');
    setCd(30);
    setOtp(['', '', '', '']);
    focusOtp(0);
  }, [mobile]);

  const verifyOtp = useCallback((digits: string[]) => {
    if (digits.join('') !== DEMO_OTP) {
      toast.error('Wrong OTP. Try 1234');
      setOtp(['', '', '', '']);
      focusOtp(0);
      return;
    }
    const info = DEMO_USERS[mobile] ?? { role: 'customer' as const, name: 'Customer' };
    setSession({ mobile, name: info.name, role: info.role, verified: true });
    setStep('success');
    toast.success(`Welcome, ${info.name}!`);
    setTimeout(() => {
      if (info.role === 'admin')  navigate({ to: '/admin/panel' });
      else if (info.role === 'driver') navigate({ to: '/driver' });
      else navigate({ to: '/booking' });
    }, 800);
  }, [mobile, navigate]);

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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 overflow-hidden">
            <img src="/logo.png" alt="UR's Chauffeur" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome</h1>
          <p className="text-slate-400">Login to book your ride</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">

          {/* STEP 1 — Mobile */}
          {step === 'mobile' && (
            <>
              <h2 className="text-xl font-bold text-white mb-6">Enter Mobile Number</h2>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Mobile Number
              </label>
              <div className="flex items-stretch mb-6 rounded-xl overflow-hidden border border-slate-700 focus-within:ring-2 focus-within:ring-emerald-500">
                <span className="flex items-center justify-center px-4 bg-slate-800 text-white font-semibold text-sm border-r border-slate-700 flex-shrink-0">
                  +91
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={mobile}
                  onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10 digit number"
                  className="flex-1 min-w-0 px-4 py-3 bg-slate-800 text-white focus:outline-none text-base"
                  autoComplete="tel"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                />
              </div>
              <button
                type="button"
                disabled={mobile.length !== 10}
                onClick={sendOtp}
                className="w-full bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all"
              >
                Send OTP
              </button>
              <div className="text-center mt-4">
                <p className="text-sm text-slate-400">
                  Don't have an account?{' '}
                  <button
                    onClick={() => navigate({ to: '/signup' })}
                    className="text-emerald-400 hover:text-emerald-300 font-semibold"
                  >
                    Sign up
                  </button>
                </p>
              </div>
              <p className="text-xs text-slate-500 text-center mt-4">
                By continuing, you agree to our Terms & Privacy Policy
              </p>
            </>
          )}

          {/* STEP 2 — OTP */}
          {step === 'otp' && (
            <>
              <button
                onClick={() => { setStep('mobile'); setOtp(['','','','']); setCd(0); }}
                className="text-slate-400 hover:text-white text-sm mb-6 flex items-center gap-1"
              >
                ← Change number
              </button>
              <h2 className="text-xl font-bold text-white mb-1">Verify OTP</h2>
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
                    className="w-14 h-14 text-center bg-slate-800 border-2 border-slate-700 rounded-xl text-white text-xl font-bold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none"
                    autoComplete="one-time-code"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                  />
                ))}
              </div>

              <p className="text-xs text-emerald-400 text-center bg-emerald-500/10 py-2 rounded-lg mb-4">
                Demo OTP: <span className="font-bold">1234</span>
              </p>

              {countdown > 0 ? (
                <p className="text-center text-sm text-slate-400">Resend in {countdown}s</p>
              ) : (
                <button
                  type="button"
                  onClick={sendOtp}
                  className="w-full text-emerald-400 hover:text-emerald-300 font-semibold text-sm"
                >
                  Resend OTP
                </button>
              )}
            </>
          )}

          {/* STEP 3 — Success */}
          {step === 'success' && (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">✅</div>
              <p className="text-xl font-bold text-white mb-2">Verified!</p>
              <p className="text-slate-400">Redirecting...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}