import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  fetchAllCarModels, addCarModel, updateCarModel, deleteCarModel,
  fetchAllEnquiries, updateEnquiryStatus, getCarAvailability,
  type CarModel, type CarEnquiry,
} from '@/lib/carService';

export const Route = createFileRoute('/admin/cars')({
  component: AdminCarsPage,
});

const TYPE_OPTIONS = ['sedan', 'suv', 'hatchback', 'luxury', 'van', 'other'];
const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  pending:   { label: 'Pending',   cls: 'bg-amber-500/20 text-amber-400 border border-amber-500/30' },
  contacted: { label: 'Contacted', cls: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
  booked:    { label: 'Booked',    cls: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' },
  cancelled: { label: 'Cancelled', cls: 'bg-red-500/20 text-red-400 border border-red-500/30' },
};

const EMPTY_FORM = {
  name: '', type: 'sedan', quantity: 1, description: '',
  features: '', image_url: '', is_active: true,
};

function AdminCarsPage() {
  const [tab, setTab] = useState<'fleet' | 'enquiries'>('fleet');
  const [cars, setCars] = useState<CarModel[]>([]);
  const [enquiries, setEnquiries] = useState<CarEnquiry[]>([]);
  const [availability, setAvailability] = useState<Record<string, { available: number; booked: number }>>({});
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [allCars, allEnquiries] = await Promise.all([
      fetchAllCarModels(),
      fetchAllEnquiries(),
    ]);
    setCars(allCars);
    setEnquiries(allEnquiries);
    // Load availability for each car
    const avail: Record<string, { available: number; booked: number }> = {};
    await Promise.all(allCars.map(async c => {
      const a = await getCarAvailability(c.id, c.quantity);
      avail[c.id] = { available: a.available, booked: a.booked };
    }));
    setAvailability(avail);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Car name is required'); return; }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      type: form.type,
      quantity: Number(form.quantity),
      description: form.description.trim() || null,
      features: form.features ? form.features.split(',').map(f => f.trim()).filter(Boolean) : null,
      image_url: form.image_url.trim() || null,
      is_active: form.is_active,
    };
    if (editingId) {
      const { error } = await updateCarModel(editingId, payload);
      if (error) { toast.error('Failed to update: ' + error); setSaving(false); return; }
      toast.success('Car updated');
    } else {
      const { error } = await addCarModel(payload);
      if (error) { toast.error('Failed to add: ' + error); setSaving(false); return; }
      toast.success('Car added');
    }
    setSaving(false);
    setShowAdd(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    load();
  };

  const handleEdit = (car: CarModel) => {
    setForm({
      name: car.name, type: car.type, quantity: car.quantity,
      description: car.description ?? '',
      features: car.features?.join(', ') ?? '',
      image_url: car.image_url ?? '',
      is_active: car.is_active,
    });
    setEditingId(car.id);
    setShowAdd(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const { error } = await deleteCarModel(id);
    if (error) { toast.error('Failed to delete'); return; }
    toast.success('Car deleted');
    load();
  };

  const handleToggleActive = async (car: CarModel) => {
    await updateCarModel(car.id, { is_active: !car.is_active });
    toast.success(car.is_active ? 'Car hidden from customers' : 'Car visible to customers');
    load();
  };

  const handleEnquiryStatus = async (id: string, status: CarEnquiry['status']) => {
    await updateEnquiryStatus(id, status);
    setEnquiries(prev => prev.map(e => e.id === id ? { ...e, status } : e));
    toast.success('Status updated');
  };

  const pendingEnquiries = enquiries.filter(e => e.status === 'pending').length;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Car Service</h1>
          <p className="text-slate-400 mt-1 text-sm">Manage fleet and customer enquiries</p>
        </div>
        {tab === 'fleet' && (
          <button onClick={() => { setShowAdd(true); setEditingId(null); setForm(EMPTY_FORM); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-colors">
            + Add Car
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab('fleet')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === 'fleet' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}>
          Fleet ({cars.length})
        </button>
        <button onClick={() => setTab('enquiries')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all relative ${tab === 'enquiries' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}>
          Enquiries ({enquiries.length})
          {pendingEnquiries > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{pendingEnquiries}</span>
          )}
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAdd && tab === 'fleet' && (
        <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-5">
          <h3 className="font-bold text-white mb-4">{editingId ? 'Edit Car' : 'Add New Car'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Car Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Maruti Ertiga"
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none">
                {TYPE_OPTIONS.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Quantity (units)</label>
              <input type="number" min={1} value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: Number(e.target.value) }))}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Image URL (optional)</label>
              <input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                placeholder="https://..."
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2} placeholder="Brief description of the car..."
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Features (comma separated)</label>
              <input value={form.features} onChange={e => setForm(f => ({ ...f, features: e.target.value }))}
                placeholder="AC, Music System, GPS, 7 Seater"
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
              className={`relative w-11 h-6 rounded-full transition-colors ${form.is_active ? 'bg-emerald-600' : 'bg-slate-700'}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className="text-sm text-slate-300">{form.is_active ? 'Visible to customers' : 'Hidden from customers'}</span>
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setShowAdd(false); setEditingId(null); setForm(EMPTY_FORM); }}
              className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold rounded-xl text-sm transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.name.trim()}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold rounded-xl text-sm transition-colors">
              {saving ? 'Saving...' : editingId ? 'Update Car' : 'Add Car'}
            </button>
          </div>
        </div>
      )}

      {/* Fleet Tab */}
      {tab === 'fleet' && (
        loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : cars.length === 0 ? (
          <div className="py-16 text-center text-slate-500">No cars added yet. Add your first car above.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cars.map(car => {
              const avail = availability[car.id] ?? { available: car.quantity, booked: 0 };
              return (
                <div key={car.id} className={`bg-slate-900 border rounded-2xl p-5 ${car.is_active ? 'border-slate-800' : 'border-slate-800 opacity-60'}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-bold text-white">{car.name}</div>
                      <div className="text-xs text-slate-400 capitalize mt-0.5">{car.type} · {car.quantity} units</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleToggleActive(car)}
                        className={`relative w-10 h-5 rounded-full transition-colors ${car.is_active ? 'bg-emerald-600' : 'bg-slate-700'}`}>
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${car.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                  </div>
                  {/* Availability bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">Availability</span>
                      <span className={avail.available > 0 ? 'text-emerald-400' : 'text-red-400'}>
                        {avail.available}/{car.quantity} free
                      </span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${avail.available > 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                        style={{ width: `${(avail.available / car.quantity) * 100}%` }} />
                    </div>
                  </div>
                  {car.description && <p className="text-xs text-slate-400 mb-3">{car.description}</p>}
                  {car.features && car.features.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {car.features.map((f, i) => (
                        <span key={i} className="px-2 py-0.5 bg-slate-800 text-slate-300 text-xs rounded-lg">{f}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 pt-3 border-t border-slate-800">
                    <button onClick={() => handleEdit(car)}
                      className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors">Edit</button>
                    <button onClick={() => handleDelete(car.id, car.name)}
                      className="flex-1 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold rounded-xl border border-red-500/20 transition-colors">Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Enquiries Tab */}
      {tab === 'enquiries' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-800/50">
                  {['Car', 'Customer', 'Dates', 'Message', 'Status', 'Action'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {enquiries.length === 0 ? (
                  <tr><td colSpan={6} className="py-16 text-center text-slate-500">No enquiries yet</td></tr>
                ) : enquiries.map((e, i) => (
                  <tr key={e.id} className={`border-b border-slate-800/60 hover:bg-slate-800/20 transition-colors ${i % 2 === 0 ? '' : 'bg-slate-800/10'}`}>
                    <td className="py-3 px-4 text-sm font-medium text-white">{e.car_name}</td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-white">{e.customer_name}</div>
                      <a href={`tel:${e.customer_phone}`} className="text-xs text-emerald-400 hover:text-emerald-300">{e.customer_phone}</a>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400">
                      {e.pickup_date ? <div>From: {e.pickup_date}</div> : null}
                      {e.return_date ? <div>To: {e.return_date}</div> : null}
                      {!e.pickup_date && !e.return_date ? '—' : null}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400 max-w-[150px] truncate">{e.message || '—'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${STATUS_CFG[e.status]?.cls ?? 'bg-slate-700 text-slate-300'}`}>
                        {STATUS_CFG[e.status]?.label ?? e.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <select value={e.status} onChange={ev => handleEnquiryStatus(e.id, ev.target.value as CarEnquiry['status'])}
                        className="px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 appearance-none cursor-pointer">
                        <option value="pending">Pending</option>
                        <option value="contacted">Contacted</option>
                        <option value="booked">Booked</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
