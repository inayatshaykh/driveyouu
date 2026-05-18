import { useState, useEffect, useRef, memo, useCallback } from 'react';
import { setUrsUser } from '@/utils/ursSession';

const DEMO_OTP = '1234'; // TODO: replace with MSG91

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onVerified: () => void;
}

export const AuthModal = memo(function AuthModal({ open, onClose, onVerified }: AuthModalProps) {
  const [step, setStep] = useState<'mobile' | 'otp' | 'success'>('mobile');
  const [mobile, setMobile] = useState('');
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
    if (!open) {
      setStep('mobile');
      setMobile('');
      setOtp(['', '', '', '']);
      setCountdown(0);
    }
  }, [open]);

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

  const sendOtp = useCallback(() => {
    if (!/^\d{10}$/.test(mobile)) return;
    setStep('otp');
    setCountdown(30);
    setOtp(['', '', '', '']);
    
    // Use requestAnimationFrame for smooth focus on mobile
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = requestAnimationFrame(() => {
        otpRefs.current[0]?.focus();
      });
    });
  }, [mobile]);

  const verifyOtp = useCallback((digits: string[]) => {
    const enteredOtp = digits.join('');
    if (enteredOtp === DEMO_OTP) {
      setUrsUser({ mobile, verified: true });
      setStep('success');
      
      // Use requestAnimationFrame for smooth transition
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = requestAnimationFrame(() => {
          onVerified();
          onClose();
        });
      });
    } else if (enteredOtp.length === 4) {
      // Invalid OTP - reset
      setOtp(['', '', '', '']);
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = requestAnimationFrame(() => {
          otpRefs.current[0]?.focus();
        });
      });
    }
  }, [mobile, onVerified, onClose]);

  const handleOtpChange = useCallback((index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    
    setOtp(prev => {
      const next = [...prev];
      next[index] = value;
      
      // Auto-focus next input
      if (value && index < 3) {
        rafRef.current = requestAnimationFrame(() => {
          otpRefs.current[index + 1]?.focus();
        });
      }
      
      // Auto-verify when all filled
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

  const handleMobileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setMobile(e.target.value.replace(/\D/g, '').slice(0, 10));
  }, []);

  const handleBackToMobile = useCallback(() => {
    setStep('mobile');
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 pb-8 sm:pb-6 animate-in slide-in-from-bottom duration-300">
        {step === 'mobile' && (
          <>
            <h3 className="text-xl font-bold text-gray-900 mb-1">Login / Sign Up</h3>
            <p className="text-sm text-gray-500 mb-6">Enter your mobile number to continue</p>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
            <div className="flex gap-2 mb-6">
              <span className="flex items-center px-4 py-3 bg-gray-100 rounded-xl text-gray-700 font-semibold text-sm border border-gray-200">
                +91
              </span>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={mobile}
                onChange={handleMobileChange}
                placeholder="10 digit number"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none text-base"
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
              className="w-full bg-gradient-to-r from-slate-800 to-emerald-800 text-white rounded-xl py-3 font-semibold disabled:opacity-50 transition-opacity"
            >
              Send OTP
            </button>
          </>
        )}

        {step === 'otp' && (
          <>
            <h3 className="text-xl font-bold text-gray-900 mb-1">Verify OTP</h3>
            <p className="text-sm text-gray-500 mb-2">
              Sent to +91 {mobile}
            </p>
            <p className="text-xs text-blue-600 font-semibold mb-6 bg-blue-50 p-2 rounded-lg text-center">
              Demo OTP: 1234
            </p>
            <div className="flex justify-center gap-3 mb-6">
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
                  className="w-12 h-12 text-center border-2 border-gray-300 rounded-xl text-lg font-bold focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 focus:outline-none"
                  autoComplete="one-time-code"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                />
              ))}
            </div>
            {countdown > 0 ? (
              <p className="text-center text-sm text-gray-500 mb-4">Resend OTP in {countdown}s</p>
            ) : (
              <button
                type="button"
                onClick={sendOtp}
                className="w-full text-emerald-700 font-semibold text-sm mb-4 hover:underline"
              >
                Resend OTP
              </button>
            )}
            <button
              type="button"
              onClick={handleBackToMobile}
              className="w-full text-gray-500 text-sm hover:text-gray-700"
            >
              Change number
            </button>
          </>
        )}

        {step === 'success' && (
          <div className="text-center py-8">
            <p className="text-lg font-semibold text-emerald-700">
              ✅ Verified! Loading your booking...
            </p>
          </div>
        )}
      </div>
    </div>
  );
});
