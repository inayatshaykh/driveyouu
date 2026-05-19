import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Save, Bell, Shield, CreditCard, Percent, Phone, Globe } from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/admin/settings')({
  component: SettingsPage,
});

function SettingsPage() {
  const [commission, setCommission] = useState('20');
  const [driverCommission, setDriverCommission] = useState('80');
  const [baseFare, setBaseFare] = useState('50');
  const [perKm, setPerKm] = useState('12');
  const [perMin, setPerMin] = useState('2');
  const [notifications, setNotifications] = useState({ email: true, sms: true, push: false });
  const [appName, setAppName] = useState("UR's Chauffeur");
  const [supportPhone, setSupportPhone] = useState('+91 98765 00000');
  const [supportEmail, setSupportEmail] = useState('support@urschauffeur.com');

  const handleSave = (section: string) => {
    toast.success(`${section} settings saved successfully`);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 mt-1">Configure platform settings and preferences</p>
      </div>

      {/* General Settings */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-slate-800 rounded-xl">
            <Globe className="h-5 w-5 text-emerald-400" />
          </div>
          <h2 className="text-lg font-bold text-white">General</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">App Name</label>
            <input
              type="text"
              value={appName}
              onChange={e => setAppName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Support Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  value={supportPhone}
                  onChange={e => setSupportPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Support Email</label>
              <input
                type="email"
                value={supportEmail}
                onChange={e => setSupportEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>
        <button
          onClick={() => handleSave('General')}
          className="mt-5 flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors text-sm"
        >
          <Save className="h-4 w-4" /> Save Changes
        </button>
      </div>

      {/* Commission Settings */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-slate-800 rounded-xl">
            <Percent className="h-5 w-5 text-emerald-400" />
          </div>
          <h2 className="text-lg font-bold text-white">Commission Split</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Platform Commission (%)</label>
            <input
              type="number"
              min="0" max="100"
              value={commission}
              onChange={e => { setCommission(e.target.value); setDriverCommission(String(100 - Number(e.target.value))); }}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Driver Commission (%)</label>
            <input
              type="number"
              min="0" max="100"
              value={driverCommission}
              onChange={e => { setDriverCommission(e.target.value); setCommission(String(100 - Number(e.target.value))); }}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-xl border border-slate-700 mb-5">
          <div className="flex-1 h-3 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all" style={{ width: `${driverCommission}%` }} />
          </div>
          <span className="text-xs text-slate-400 whitespace-nowrap">Driver {driverCommission}% · Platform {commission}%</span>
        </div>
        <button
          onClick={() => handleSave('Commission')}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors text-sm"
        >
          <Save className="h-4 w-4" /> Save Changes
        </button>
      </div>

      {/* Pricing Settings */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-slate-800 rounded-xl">
            <CreditCard className="h-5 w-5 text-emerald-400" />
          </div>
          <h2 className="text-lg font-bold text-white">Fare Configuration</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Base Fare (₹)</label>
            <input
              type="number"
              value={baseFare}
              onChange={e => setBaseFare(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Per KM (₹)</label>
            <input
              type="number"
              value={perKm}
              onChange={e => setPerKm(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Per Minute (₹)</label>
            <input
              type="number"
              value={perMin}
              onChange={e => setPerMin(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
        <div className="mt-4 p-3 bg-slate-800 rounded-xl border border-slate-700">
          <p className="text-xs text-slate-400">
            Sample fare for 10km, 20min ride: <span className="text-white font-bold">₹{Number(baseFare) + (10 * Number(perKm)) + (20 * Number(perMin))}</span>
          </p>
        </div>
        <button
          onClick={() => handleSave('Pricing')}
          className="mt-5 flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors text-sm"
        >
          <Save className="h-4 w-4" /> Save Changes
        </button>
      </div>

      {/* Notification Settings */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-slate-800 rounded-xl">
            <Bell className="h-5 w-5 text-emerald-400" />
          </div>
          <h2 className="text-lg font-bold text-white">Notifications</h2>
        </div>
        <div className="space-y-4">
          {[
            { key: 'email', label: 'Email Notifications', desc: 'Receive booking and alert emails' },
            { key: 'sms', label: 'SMS Notifications', desc: 'Receive SMS for critical alerts' },
            { key: 'push', label: 'Push Notifications', desc: 'Browser push notifications' },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between p-4 bg-slate-800 rounded-xl border border-slate-700">
              <div>
                <div className="text-sm font-semibold text-white">{item.label}</div>
                <div className="text-xs text-slate-400 mt-0.5">{item.desc}</div>
              </div>
              <button
                onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))}
                className={`relative w-12 h-6 rounded-full transition-colors ${notifications[item.key as keyof typeof notifications] ? 'bg-emerald-600' : 'bg-slate-600'}`}
              >
                <div className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${notifications[item.key as keyof typeof notifications] ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={() => handleSave('Notification')}
          className="mt-5 flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors text-sm"
        >
          <Save className="h-4 w-4" /> Save Changes
        </button>
      </div>

      {/* Security */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-slate-800 rounded-xl">
            <Shield className="h-5 w-5 text-emerald-400" />
          </div>
          <h2 className="text-lg font-bold text-white">Security</h2>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Two-Factor Authentication', desc: 'Require OTP for admin login', enabled: true },
            { label: 'Session Timeout', desc: 'Auto logout after 30 minutes of inactivity', enabled: true },
            { label: 'IP Whitelist', desc: 'Restrict admin access to specific IPs', enabled: false },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between p-4 bg-slate-800 rounded-xl border border-slate-700">
              <div>
                <div className="text-sm font-semibold text-white">{item.label}</div>
                <div className="text-xs text-slate-400 mt-0.5">{item.desc}</div>
              </div>
              <div className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${item.enabled ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-slate-700 text-slate-400'}`}>
                {item.enabled ? 'Enabled' : 'Disabled'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
