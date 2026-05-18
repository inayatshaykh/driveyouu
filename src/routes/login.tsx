import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { ShieldCheck, User, UserCog, Car } from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/login')({
  component: LoginPage,
});

// Demo accounts
const DEMO_ACCOUNTS = [
  {
    mobile: '9876543210',
    role: 'customer',
    name: 'Demo Customer',
    email: 'customer@demo.com',
    icon: User,
    color: 'bg-blue-500',
    description: 'Access customer booking panel',
  },
  {
    mobile: '9876543212',
    role: 'admin',
    name: 'Demo Admin',
    email: 'admin@demo.com',
    icon: UserCog,
    color: 'bg-purple-500',
    description: 'Access admin dashboard',
  },
  {
    mobile: '9876543211',
    role: 'driver',
    name: 'Demo Driver',
    email: 'driver@demo.com',
    icon: Car,
    color: 'bg-green-500',
    description: 'Access driver portal',
  },
];

const DEMO_OTP = '123456';

function LoginPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'select' | 'otp'>('select');
  const [selectedAccount, setSelectedAccount] = useState<typeof DEMO_ACCOUNTS[0] | null>(null);
  const [otp, setOtp] = useState('');

  const handleAccountSelect = (account: typeof DEMO_ACCOUNTS[0]) => {
    setSelectedAccount(account);
    setStep('otp');
    setOtp('');
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otp !== DEMO_OTP) {
      toast.error('Invalid OTP. Use: 123456');
      return;
    }

    if (!selectedAccount) return;

    // Set auth data in localStorage
    localStorage.setItem('auth_token', 'demo-token-' + Date.now());
    localStorage.setItem('auth_user', JSON.stringify({
      id: selectedAccount.mobile,
      mobile: selectedAccount.mobile,
      role: selectedAccount.role,
      name: selectedAccount.name,
      email: selectedAccount.email,
    }));

    toast.success(`Logged in as ${selectedAccount.name}`);

    // Redirect based on role
    setTimeout(() => {
      if (selectedAccount.role === 'admin') {
        navigate({ to: '/admin' });
      } else if (selectedAccount.role === 'driver') {
        navigate({ to: '/driver' });
      } else {
        navigate({ to: '/booking' });
      }
    }, 500);
  };

  const handleBack = () => {
    setStep('select');
    setSelectedAccount(null);
    setOtp('');
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 mb-4">
            <ShieldCheck size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Demo Login System</h1>
          <p className="text-slate-400">
            Select a demo account to access different panels
          </p>
        </div>

        {step === 'select' && (
          <div className="space-y-4">
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 mb-6">
              <p className="text-yellow-500 text-sm font-medium text-center">
                🔐 Demo Mode: Use OTP <span className="font-bold">123456</span> for all accounts
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {DEMO_ACCOUNTS.map((account) => {
                const Icon = account.icon;
                return (
                  <button
                    key={account.mobile}
                    onClick={() => handleAccountSelect(account)}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-left hover:border-slate-700 hover:bg-slate-800/50 transition-all group"
                  >
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${account.color} mb-4`}>
                      <Icon size={24} className="text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">{account.name}</h3>
                    <p className="text-sm text-slate-400 mb-3">{account.description}</p>
                    <div className="text-xs text-slate-500 space-y-1">
                      <div>📱 {account.mobile}</div>
                      <div>✉️ {account.email}</div>
                    </div>
                    <div className="mt-4 text-sm font-medium text-slate-400 group-hover:text-white transition-colors">
                      Login as {account.role} →
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 'otp' && selectedAccount && (
          <div className="max-w-md mx-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
              <button
                onClick={handleBack}
                className="text-slate-400 hover:text-white text-sm mb-6 flex items-center gap-2"
              >
                ← Back to accounts
              </button>

              <div className="text-center mb-6">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${selectedAccount.color} mb-4`}>
                  {selectedAccount.icon && <selectedAccount.icon size={32} className="text-white" />}
                </div>
                <h2 className="text-xl font-bold text-white mb-1">Enter OTP</h2>
                <p className="text-sm text-slate-400">
                  Logging in as <span className="text-white font-medium">{selectedAccount.name}</span>
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Mobile: {selectedAccount.mobile}
                </p>
              </div>

              <form onSubmit={handleOtpSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Enter 6-digit OTP
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-center text-2xl tracking-widest focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    autoFocus
                  />
                  <p className="text-xs text-slate-500 mt-2 text-center">
                    Demo OTP: <span className="text-blue-400 font-bold">123456</span>
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={otp.length !== 6}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all"
                >
                  Verify & Login
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-12 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">📋 Demo Account Details</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <User size={16} className="text-blue-500" />
              </div>
              <div>
                <div className="text-white font-medium">Customer Account</div>
                <div className="text-slate-400">Mobile: 9876543210 | Access booking and customer features</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                <UserCog size={16} className="text-purple-500" />
              </div>
              <div>
                <div className="text-white font-medium">Admin Account</div>
                <div className="text-slate-400">Mobile: 9876543212 | Full admin dashboard access</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <Car size={16} className="text-green-500" />
              </div>
              <div>
                <div className="text-white font-medium">Driver Account</div>
                <div className="text-slate-400">Mobile: 9876543211 | Driver portal and ride management</div>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-800">
            <p className="text-xs text-slate-500">
              💡 <span className="text-slate-400">All accounts use the same OTP:</span> <span className="text-blue-400 font-bold">123456</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
