import { createFileRoute, Link } from '@tanstack/react-router';
import { Navbar } from '@/components/Navbar';

export const Route = createFileRoute('/help')({
  head: () => ({
    meta: [{ title: "Help Center — UR's Chauffeur" }],
  }),
  component: HelpPage,
});

const PHONE = '+919988440119';
const WHATSAPP_MSG = encodeURIComponent("Hi, I need help with my booking on UR's Chauffeur.");

const FAQS = [
  { q: "How do I book a driver?", a: "Go to 'Book a Driver', enter your pickup location, select your booking type (Hourly, Multi-Day, or Outstation), choose your vehicle type, and confirm. A driver will be assigned shortly." },
  { q: "What is the minimum booking duration?", a: "Minimum booking is 4 hours for both local and outstation trips." },
  { q: "What are the charges?", a: "Local: 4hrs=₹500, 6hrs=₹700, 8hrs=₹900, 10hrs=₹1000, 12hrs=₹1100. Outstation 4hrs=₹600. Multi-day=₹1250/day. Night charge (after 9PM)=₹200. Cancellation=₹500." },
  { q: "Do you provide the vehicle?", a: "No — we provide the driver only. You use your own vehicle. Our drivers are trained to handle all vehicle types including automatic transmission." },
  { q: "How do I cancel a booking?", a: "Contact us via WhatsApp or call before the driver is assigned. A cancellation charge of ₹500 applies." },
  { q: "Is payment online or offline?", a: "Both. You can pay online or offline — whichever is convenient for you." },
  { q: "Who pays for food and lodging on outstation trips?", a: "Fooding and lodging for the driver on outstation trips is from the customer's side." },
  { q: "How do I track my driver?", a: "Once a driver is assigned, their contact number will be visible in your 'My Bookings' page. You can call them directly." },
];

function HelpPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 py-12 space-y-10">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-black text-white mb-3">Help Center</h1>
          <p className="text-slate-400">We're here to help. Reach us anytime.</p>
        </div>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Call */}
          <a href={`tel:${PHONE}`}
            className="flex items-center gap-4 bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-5 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/20 transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-emerald-400">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-0.5">Call Us</div>
              <div className="text-lg font-bold text-white">+91 99884 40119</div>
              <div className="text-xs text-emerald-400 mt-0.5">Tap to call</div>
            </div>
          </a>

          {/* WhatsApp */}
          <a href={`https://wa.me/${PHONE}?text=${WHATSAPP_MSG}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-4 bg-slate-900 border border-slate-800 hover:border-green-500/40 rounded-2xl p-5 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-green-500/20 transition-colors">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-green-400">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
              </svg>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-0.5">WhatsApp</div>
              <div className="text-lg font-bold text-white">+91 99884 40119</div>
              <div className="text-xs text-green-400 mt-0.5">Chat with us</div>
            </div>
          </a>
        </div>

        {/* Hours */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-amber-400">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div>
            <div className="text-sm font-semibold text-white">Support Hours</div>
            <div className="text-xs text-slate-400 mt-0.5">Available 24/7 — We respond within 3 hours</div>
          </div>
        </div>

        {/* FAQs */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-5">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <details key={i} className="bg-slate-900 border border-slate-800 rounded-2xl group">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none">
                  <span className="text-sm font-semibold text-white pr-4">{faq.q}</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    className="w-4 h-4 text-slate-400 flex-shrink-0 transition-transform group-open:rotate-180">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </summary>
                <div className="px-5 pb-4 text-sm text-slate-400 leading-relaxed border-t border-slate-800 pt-3">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* Back */}
        <div className="text-center">
          <Link to="/" className="text-sm text-slate-500 hover:text-white transition">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
