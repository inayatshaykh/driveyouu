import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { getSession } from '@/utils/session';
import { fetchCarModels, getCarAvailability, submitEnquiry, type CarModel } from '@/lib/carService';
import { toast } from 'sonner';

export const Route = createFileRoute('/cars')({
  head: () => ({
    meta: [{ title: "Car Rentals — UR's Chauffeur" }],
  }),
  component: CarsPage,
});

const TYPE_LABELS: Record<string, string> = {
  sedan: '🚘 Sedan', suv: '🚙 SUV', hatchback: '🚗 Hatchback',
  luxury: '🏎️ Luxury', van: '🚐 Van', other: '🚖 Other',
};

interface CarWithAvailability extends CarModel {
  available: number;
  booked: number;
  isAvailable: boolean;
}

function EnquiryModal({ car, onClose }: { car: CarWithAvailability; onClose: () => void }) {
  const session = getSession();
  const [form, setForm] = useState({
    customer_name: session?.name || '',
    customer_phone: session?.mobile || '',
    pickup_date: '',
    return_date: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.customer_name.trim() || !form.customer_phone.trim()) {
      toast.error('Please enter your name and phone number');
      return;
    }
    if (!/^\d{10}$/.test(form.customer_phone.replace(/\D/g, ''))) {
      toast.error('Enter a valid 10-digit phone number');
      return;
    }
    setSubmitting(true);
    const { error } = await submitEnquiry({
      car_model_id: car.id,
      car_name: car.name,
      customer_name: form.customer_name.trim(),
      customer_phone: form.customer_phone.trim(),
      pickup_date: form.pickup_date || null,
      return_date: form.return_date || null,
      message: form.message.trim() || null,
    });
    setSubmitting(false);
    if (error) { toast.error('Failed to submit. Please try again.'); return; }
    toast.success('Enquiry submitted! Our team will call you shortly with pricing details.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-1">Enquire: {car.name}</h2>
        <p className="text-sm text-slate-400 mb-5">
          Our team will call you with pricing and availability details.
        </p>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Your Name *</label>
            <input value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))}
              placeholder="Full name"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Phone Number *</label>
            <div className="flex items-stretch rounded-xl overflow-hidden border border-slate-700 focus-within:ring-2 focus-within:ring-emerald-500">
              <span className="flex items-center px-3 bg-slate-800 text-slate-400 text-sm border-r border-slate-700">+91</span>
              <input type="tel" inputMode="numeric" maxLength={10}
                value={form.customer_phone.replace('+91', '').replace(/\D/g, '')}
                onChange={e => setForm(f => ({ ...f, customer_phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                placeholder="10 digit number"
                className="flex-1 px-4 py-3 bg-slate-800 text-white text-sm focus:outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Pickup Date</label>
              <input type="date" value={form.pickup_date} onChange={e => setForm(f => ({ ...f, pickup_date: e.target.value }))}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 [color-scheme:dark]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Return Date</label>
              <input type="date" value={form.return_date} onChange={e => setForm(f => ({ ...f, return_date: e.target.value }))}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 [color-scheme:dark]" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Message (optional)</label>
            <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              rows={2} placeholder="Any specific requirements..."
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-3 bg-slate-800 text-slate-300 font-semibold rounded-xl text-sm hover:bg-slate-700 transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting}
            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-colors">
            {submitting ? 'Submitting...' : 'Submit Enquiry'}
          </button>
        </div>
        <p className="text-xs text-slate-500 text-center mt-3">
          📞 We'll call you within 3 hours with pricing details
        </p>
      </div>
    </div>
  );
}

function CarsPage() {
  const [cars, setCars] = useState<CarWithAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCar, setSelectedCar] = useState<CarWithAvailability | null>(null);
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    loadCars();
  }, []);

  const loadCars = async () => {
    setLoading(true);
    const models = await fetchCarModels();
    const withAvail = await Promise.all(models.map(async m => {
      const avail = await getCarAvailability(m.id, m.quantity);
      return { ...m, ...avail };
    }));
    setCars(withAvail);
    setLoading(false);
  };

  const types = ['all', ...Array.from(new Set(cars.map(c => c.type)))];
  const filtered = typeFilter === 'all' ? cars : cars.filter(c => c.type === typeFilter);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-16 md:pb-0">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-b from-slate-900 to-slate-950 py-8 px-6 text-center border-b border-slate-800">
        <h1 className="text-4xl sm:text-5xl font-black text-white mb-3">Car Rentals</h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto">
          Self-drive or with driver — premium vehicles available for rent. Contact us for pricing.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Call us: +91 70870 10425
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-6 pb-16 md:pb-6">
        {/* Type filters */}
        {types.length > 1 && (
          <div className="flex gap-2 flex-wrap mb-8">
            {types.map(t => (
              <button key={t} onClick={() => setTypeFilter(t)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${
                  typeFilter === t ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}>
                {t === 'all' ? 'All Vehicles' : (TYPE_LABELS[t] ?? t)}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <div className="text-5xl mb-4">🚗</div>
            <p className="text-lg font-semibold text-slate-400">No vehicles available right now</p>
            <p className="text-sm mt-2">Check back soon or call us directly</p>
            <a href="tel:+917087010425" className="mt-4 inline-block px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-colors">
              📞 Call Now
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(car => (
              <div key={car.id} className={`bg-slate-900 border rounded-2xl overflow-hidden transition-all hover:shadow-xl ${car.isAvailable ? 'border-slate-800 hover:border-slate-700' : 'border-slate-800 opacity-75'}`}>
                {/* Car image or placeholder */}
                <div className="h-44 bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center relative">
                  {car.image_url ? (
                    <img src={car.image_url} alt={car.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-6xl">{TYPE_LABELS[car.type]?.split(' ')[0] ?? '🚗'}</span>
                  )}
                  {/* Availability badge */}
                  <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-lg text-xs font-bold ${
                    car.isAvailable
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {car.isAvailable ? `${car.available} Available` : 'Fully Booked'}
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-bold text-white">{car.name}</h3>
                      <span className="text-xs text-slate-400 capitalize">{TYPE_LABELS[car.type] ?? car.type}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500">Fleet</div>
                      <div className="text-sm font-bold text-white">{car.quantity} units</div>
                    </div>
                  </div>

                  {car.description && (
                    <p className="text-sm text-slate-400 mb-3 leading-relaxed">{car.description}</p>
                  )}

                  {car.features && car.features.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {car.features.map((f, i) => (
                        <span key={i} className="px-2 py-0.5 bg-slate-800 text-slate-300 text-xs rounded-lg border border-slate-700">{f}</span>
                      ))}
                    </div>
                  )}

                  <div className="bg-slate-800/60 rounded-xl p-3 mb-4 text-center">
                    <div className="text-xs text-slate-400">Pricing</div>
                    <div className="text-sm font-bold text-emerald-400 mt-0.5">Contact us for rates</div>
                    <div className="text-xs text-slate-500">Customized per trip duration</div>
                  </div>

                  <button
                    onClick={() => car.isAvailable && setSelectedCar(car)}
                    disabled={!car.isAvailable}
                    className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                      car.isAvailable
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}>
                    {car.isAvailable ? 'Enquire Now' : 'Fully Booked'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Contact strip */}
        <div className="mt-12 bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center">
          <h3 className="text-xl font-bold text-white mb-2">Need help choosing?</h3>
          <p className="text-slate-400 text-sm mb-4">Call us directly and we'll help you find the right vehicle at the best price.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="tel:+917087010425" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-colors">
              📞 +91 70870 10425
            </a>
            <a href="https://wa.me/919988440119" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600/20 hover:bg-green-600/30 text-green-400 font-bold rounded-xl text-sm border border-green-500/30 transition-colors">
              💬 WhatsApp Us
            </a>
          </div>
        </div>
      </div>

      {selectedCar && <EnquiryModal car={selectedCar} onClose={() => setSelectedCar(null)} />}
    </div>
  );
}
