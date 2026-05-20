import { createFileRoute } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import { Search, Star, Phone, MapPin, Car, CheckCircle, XCircle, Clock, Filter, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/admin/drivers')({
  component: DriversPage,
});

const INITIAL_DRIVERS = [
  { id: 'DR-001', name: 'Amit Kumar',    phone: '+91 98765 43210', location: 'Connaught Place, Delhi', status: 'active',    rides: 342, rating: 4.8, earnings: '₹1,24,500', vehicle: 'Honda City · DL 01 AB 1234',   kyc: 'verified', joined: 'Jan 2023' },
  { id: 'DR-002', name: 'Rajesh Singh',  phone: '+91 98765 43211', location: 'Saket, Delhi',           status: 'active',    rides: 289, rating: 4.7, earnings: '₹98,200',   vehicle: 'Maruti Swift · DL 02 CD 5678', kyc: 'verified', joined: 'Mar 2023' },
  { id: 'DR-003', name: 'Suresh Yadav',  phone: '+91 98765 43212', location: 'Dwarka, Delhi',          status: 'offline',   rides: 156, rating: 4.5, earnings: '₹56,800',   vehicle: 'Hyundai i20 · DL 03 EF 9012',  kyc: 'verified', joined: 'Jun 2023' },
  { id: 'DR-004', name: 'Manoj Tiwari',  phone: '+91 98765 43213', location: 'Vasant Kunj, Delhi',     status: 'active',    rides: 421, rating: 4.9, earnings: '₹1,52,300', vehicle: 'Toyota Innova · DL 04 GH 3456', kyc: 'verified', joined: 'Nov 2022' },
  { id: 'DR-005', name: 'Deepak Sharma', phone: '+91 98765 43214', location: 'Lajpat Nagar, Delhi',    status: 'offline',   rides: 98,  rating: 4.3, earnings: '₹35,600',   vehicle: 'Maruti Ertiga · DL 05 IJ 7890', kyc: 'pending',  joined: 'Sep 2023' },
  { id: 'DR-006', name: 'Ravi Kumar',    phone: '+91 98765 43215', location: 'Janakpuri, Delhi',       status: 'active',    rides: 267, rating: 4.6, earnings: '₹89,400',   vehicle: 'Honda Amaze · DL 06 KL 1234',  kyc: 'verified', joined: 'Feb 2023' },
  { id: 'DR-007', name: 'Vinod Pal',     phone: '+91 98765 43216', location: 'Mayur Vihar, Delhi',     status: 'active',    rides: 198, rating: 4.7, earnings: '₹72,100',   vehicle: 'Tata Nexon · DL 07 MN 5678',   kyc: 'verified', joined: 'Apr 2023' },
  { id: 'DR-008', name: 'Santosh Kumar', phone: '+91 98765 43217', location: 'Hauz Khas, Delhi',       status: 'suspended', rides: 45,  rating: 3.8, earnings: '₹16,200',   vehicle: 'Maruti Dzire · DL 08 OP 9012', kyc: 'rejected', joined: 'Oct 2023' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  active:    { label: 'Active',    color: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30', dot: 'bg-emerald-400' },
  offline:   { label: 'Offline',   color: 'bg-slate-500/15 text-slate-400 border border-slate-500/30',     dot: 'bg-slate-400'   },
  suspended: { label: 'Suspended', color: 'bg-red-500/15 text-red-400 border border-red-500/30',           dot: 'bg-red-400'     },
};

const KYC_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  verified: { label: 'Verified', icon: CheckCircle, color: 'text-emerald-400' },
  pending:  { label: 'Pending',  icon: Clock,        color: 'text-amber-400'  },
  rejected: { label: 'Rejected', icon: XCircle,      color: 'text-red-400'   },
};

function DriversPage() {
  const [drivers, setDrivers] = useState(INITIAL_DRIVERS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [kycFilter, setKycFilter] = useState('all');

  const toggleStatus = (id: string) => {
    setDrivers(prev => prev.map(d => {
      if (d.id !== id || d.status === 'suspended') return d;
      const next = d.status === 'active' ? 'offline' : 'active';
      toast.success(`${d.name} marked as ${next}`);
      return { ...d, status: next };
    }));
  };

  const filtered = useMemo(() => drivers.filter(d => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      d.name.toLowerCase().includes(q) ||
      d.phone.includes(search) ||
      d.vehicle.toLowerCase().includes(q) ||
      d.location.toLowerCase().includes(q);
    return matchSearch &&
      (statusFilter === 'all' || d.status === statusFilter) &&
      (kycFilter === 'all' || d.kyc === kycFilter);
  }), [drivers, search, statusFilter, kycFilter]);

  const counts = {
    all:       drivers.length,
    active:    drivers.filter(d => d.status === 'active').length,
    offline:   drivers.filter(d => d.status === 'offline').length,
    suspended: drivers.filter(d => d.status === 'suspended').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Drivers</h1>
          <p className="text-slate-400 mt-1 text-sm">Manage driver accounts, KYC and status</p>
        </div>
        <div className="flex gap-3">
          <div className="text-center px-4 py-2 bg-slate-800 rounded-xl border border-slate-700">
            <div className="text-xl font-bold text-emerald-400">{counts.active}</div>
            <div className="text-xs text-slate-400">Online</div>
          </div>
          <div className="text-center px-4 py-2 bg-slate-800 rounded-xl border border-slate-700">
            <div className="text-xl font-bold text-slate-400">{counts.offline}</div>
            <div className="text-xs text-slate-400">Offline</div>
          </div>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'active', 'offline', 'suspended'] as const).map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all capitalize ${
              statusFilter === s
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700'
            }`}>
            {s} ({counts[s as keyof typeof counts]})
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
          <input type="text" placeholder="Search by name, phone, vehicle..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
          <select value={kycFilter} onChange={e => setKycFilter(e.target.value)}
            className="pl-9 pr-8 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer">
            <option value="all">All KYC</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
        </div>
      </div>

      <p className="text-sm text-slate-500">
        Showing <span className="text-white font-semibold">{filtered.length}</span> of {drivers.length} drivers
      </p>

      {/* Driver Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-3 py-16 text-center text-slate-500">
            <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium text-slate-400">No drivers found</p>
          </div>
        ) : filtered.map(driver => {
          const sc = STATUS_CONFIG[driver.status];
          const kc = KYC_CONFIG[driver.kyc];
          const KycIcon = kc.icon;
          return (
            <div key={driver.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all duration-200">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold text-lg">
                      {driver.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-slate-900 ${sc.dot}`} />
                  </div>
                  <div>
                    <div className="font-bold text-white">{driver.name}</div>
                    <div className="text-xs text-slate-400">{driver.id}</div>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${sc.color}`}>{sc.label}</span>
              </div>

              {/* Info */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Phone className="h-3.5 w-3.5 flex-shrink-0" />{driver.phone}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Car className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{driver.vehicle}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{driver.location}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-slate-800 rounded-xl p-2.5 text-center">
                  <div className="text-base font-bold text-white">{driver.rides}</div>
                  <div className="text-xs text-slate-500">Rides</div>
                </div>
                <div className="bg-slate-800 rounded-xl p-2.5 text-center">
                  <div className="text-base font-bold text-yellow-400 flex items-center justify-center gap-0.5">
                    <Star className="h-3 w-3 fill-yellow-400" />{driver.rating}
                  </div>
                  <div className="text-xs text-slate-500">Rating</div>
                </div>
                <div className="bg-slate-800 rounded-xl p-2.5 text-center">
                  <div className="text-xs font-bold text-emerald-400">{driver.earnings}</div>
                  <div className="text-xs text-slate-500">Earned</div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <div className={`flex items-center gap-1.5 text-xs font-medium ${kc.color}`}>
                  <KycIcon className="h-3.5 w-3.5" />KYC {kc.label}
                </div>
                {driver.status !== 'suspended' ? (
                  <button onClick={() => toggleStatus(driver.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                      driver.status === 'active'
                        ? 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                    }`}>
                    {driver.status === 'active' ? 'Set Offline' : 'Set Active'}
                  </button>
                ) : (
                  <span className="text-xs text-slate-500">Joined {driver.joined}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
