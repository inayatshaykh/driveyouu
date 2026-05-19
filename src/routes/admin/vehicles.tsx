import { createFileRoute } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import { Search, Car, CheckCircle, XCircle, Clock, ChevronDown } from 'lucide-react';

export const Route = createFileRoute('/admin/vehicles')({
  component: VehiclesPage,
});

const VEHICLES = [
  { id: 'VH-001', driver: 'Amit Kumar', make: 'Honda City', number: 'DL 01 AB 1234', type: 'Sedan', year: 2021, status: 'active', insurance: 'valid', permit: 'valid', fitness: 'valid', color: 'White' },
  { id: 'VH-002', driver: 'Rajesh Singh', make: 'Maruti Swift', number: 'DL 02 CD 5678', type: 'Hatchback', year: 2020, status: 'active', insurance: 'valid', permit: 'valid', fitness: 'expiring', color: 'Silver' },
  { id: 'VH-003', driver: 'Suresh Yadav', make: 'Hyundai i20', number: 'DL 03 EF 9012', type: 'Hatchback', year: 2022, status: 'inactive', insurance: 'valid', permit: 'expired', fitness: 'valid', color: 'Blue' },
  { id: 'VH-004', driver: 'Manoj Tiwari', make: 'Toyota Innova', number: 'DL 04 GH 3456', type: 'SUV', year: 2021, status: 'active', insurance: 'valid', permit: 'valid', fitness: 'valid', color: 'Grey' },
  { id: 'VH-005', driver: 'Deepak Sharma', make: 'Maruti Ertiga', number: 'DL 05 IJ 7890', type: 'MPV', year: 2019, status: 'inactive', insurance: 'expiring', permit: 'valid', fitness: 'valid', color: 'White' },
  { id: 'VH-006', driver: 'Ravi Kumar', make: 'Honda Amaze', number: 'DL 06 KL 1234', type: 'Sedan', year: 2022, status: 'active', insurance: 'valid', permit: 'valid', fitness: 'valid', color: 'Red' },
  { id: 'VH-007', driver: 'Vinod Pal', make: 'Tata Nexon', number: 'DL 07 MN 5678', type: 'SUV', year: 2023, status: 'active', insurance: 'valid', permit: 'valid', fitness: 'valid', color: 'Black' },
  { id: 'VH-008', driver: 'Santosh Kumar', make: 'Maruti Dzire', number: 'DL 08 OP 9012', type: 'Sedan', year: 2018, status: 'suspended', insurance: 'expired', permit: 'expired', fitness: 'expired', color: 'White' },
];

const DOC_STATUS: Record<string, { color: string; icon: any }> = {
  valid: { color: 'text-emerald-400', icon: CheckCircle },
  expiring: { color: 'text-amber-400', icon: Clock },
  expired: { color: 'text-red-400', icon: XCircle },
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  inactive: 'bg-slate-500/15 text-slate-400 border border-slate-500/30',
  suspended: 'bg-red-500/15 text-red-400 border border-red-500/30',
};

function VehiclesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const filtered = useMemo(() => {
    return VEHICLES.filter(v => {
      const matchSearch = !search ||
        v.make.toLowerCase().includes(search.toLowerCase()) ||
        v.number.toLowerCase().includes(search.toLowerCase()) ||
        v.driver.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || v.status === statusFilter;
      const matchType = typeFilter === 'all' || v.type === typeFilter;
      return matchSearch && matchStatus && matchType;
    });
  }, [search, statusFilter, typeFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Vehicles</h1>
        <p className="text-slate-400 mt-1">Monitor vehicle documents and compliance status</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Vehicles', value: VEHICLES.length, color: 'text-white' },
          { label: 'Active', value: VEHICLES.filter(v => v.status === 'active').length, color: 'text-emerald-400' },
          { label: 'Docs Expiring', value: VEHICLES.filter(v => v.insurance === 'expiring' || v.permit === 'expiring' || v.fitness === 'expiring').length, color: 'text-amber-400' },
          { label: 'Docs Expired', value: VEHICLES.filter(v => v.insurance === 'expired' || v.permit === 'expired' || v.fitness === 'expired').length, color: 'text-red-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by vehicle, number, driver..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="pl-4 pr-8 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="pl-4 pr-8 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="Sedan">Sedan</option>
            <option value="Hatchback">Hatchback</option>
            <option value="SUV">SUV</option>
            <option value="MPV">MPV</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
        </div>
      </div>

      <p className="text-sm text-slate-500">
        Showing <span className="text-white font-semibold">{filtered.length}</span> of {VEHICLES.length} vehicles
      </p>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/60">
                <th className="text-left py-4 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Vehicle</th>
                <th className="text-left py-4 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Driver</th>
                <th className="text-left py-4 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Type</th>
                <th className="text-left py-4 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Insurance</th>
                <th className="text-left py-4 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Permit</th>
                <th className="text-left py-4 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Fitness</th>
                <th className="text-left py-4 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v, i) => {
                const ins = DOC_STATUS[v.insurance];
                const per = DOC_STATUS[v.permit];
                const fit = DOC_STATUS[v.fitness];
                const InsIcon = ins.icon;
                const PerIcon = per.icon;
                const FitIcon = fit.icon;
                return (
                  <tr key={v.id} className={`border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors ${i % 2 === 0 ? '' : 'bg-slate-800/10'}`}>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                          <Car className="h-5 w-5 text-emerald-400" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">{v.make}</div>
                          <div className="text-xs text-emerald-400 font-mono">{v.number}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-sm text-slate-300 font-medium">{v.driver}</td>
                    <td className="py-4 px-5">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">{v.type}</span>
                    </td>
                    <td className="py-4 px-5">
                      <div className={`flex items-center gap-1.5 text-xs font-semibold capitalize ${ins.color}`}>
                        <InsIcon className="h-3.5 w-3.5" />{v.insurance}
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <div className={`flex items-center gap-1.5 text-xs font-semibold capitalize ${per.color}`}>
                        <PerIcon className="h-3.5 w-3.5" />{v.permit}
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <div className={`flex items-center gap-1.5 text-xs font-semibold capitalize ${fit.color}`}>
                        <FitIcon className="h-3.5 w-3.5" />{v.fitness}
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${STATUS_COLORS[v.status]}`}>{v.status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
