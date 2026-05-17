import { useState, useEffect, useRef } from 'react';
import { setUrsUser } from '@/utils/ursSession';

const DEMO_OTP = '1234'; // TODO: replace with MSG91

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onVerified: () => void;
}

export function AuthModal({ open, onClose, onVerified }: AuthModalProps) {
  const [step, setStep] = useState<'mobile' | 'otp' | 'success'>('mobile');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [countdown, setCountdown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!open) {
      setStep('mobile');
      setMobile('');
      setOtp(['', '', '', '']);
      setCountdown(0);
    }
  }, [open]);

  useEffect(() => {
    if (step !== 'otp' || countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [step, countdown]);

  const sendOtp = () => {
    if (!/^\d{10}$/.test(mobile)) return;
    setStep('otp');
    setCountdown(30);
    setOtp(['', '', '', '']);
    setTimeout(() => otpRefs.current[0]?.focus(), 100);
  };

  const verifyOtp = (digits: string[]) => {
    if (digits.join('') === DEMO_OTP) {
      setUrsUser({ mobile, verified: true });
      setStep('success');
      setTimeout(() => {
        onVerified();
        onClose();
      }, 1000);
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
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10 digit number"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none text-base"
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
            <p className="text-sm text-gray-500 mb-6">
              Sent to +91 {mobile}
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
              onClick={() => setStep('mobile')}
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
}
