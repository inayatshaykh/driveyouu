import { createFileRoute, Link } from '@tanstack/react-router';
import { Navbar } from '@/components/Navbar';
import { ArrowRight } from 'lucide-react';

export const Route = createFileRoute('/about')({
  head: () => ({
    meta: [
      { title: "About Us — UR's Chauffeur" },
      { name: 'description', content: "Learn about UR's Chauffeur — India's trusted professional driver service. Our story, mission, values and team." },
    ],
  }),
  component: AboutPage,
});

const STATS = [
  { value: '1000+', label: 'Rides Completed', sub: 'In just 3 months' },
  { value: '100+', label: 'Verified Drivers', sub: 'Background checked' },
  { value: '24/7', label: 'Available', sub: 'Round the clock' },
  { value: '5★', label: 'Avg. Rating', sub: 'Customer satisfaction' },
];

const VALUES = [
  {
    icon: '🛡️',
    title: 'Safety First',
    desc: 'Every driver undergoes thorough background verification, police verification, and KYC before being onboarded. Your safety is non-negotiable.',
  },
  {
    icon: '💎',
    title: 'Professionalism',
    desc: 'Our chauffeurs are trained to handle all vehicle types — manual, automatic, luxury — with courtesy and punctuality.',
  },
  {
    icon: '💰',
    title: 'Transparent Pricing',
    desc: 'No hidden charges. No surge pricing. What you see is what you pay — always.',
  },
  {
    icon: '⚡',
    title: 'Instant Booking',
    desc: 'Book a driver in under a minute. Our team assigns a verified chauffeur and confirms within 1–3 hours.',
  },
  {
    icon: '🤝',
    title: 'Driver Welfare',
    desc: 'We believe in fair pay. Drivers keep 75% of every fare. We invest in their growth, training, and financial stability.',
  },
  {
    icon: '🌍',
    title: 'Nationwide Reach',
    desc: 'From Delhi NCR to outstation trips across India — we operate wherever you need us.',
  },
];

const SERVICES = [
  { icon: '🕐', title: 'Hourly Basis', desc: 'Minimum 4 hours. Perfect for city meetings, shopping, or quick transfers.' },
  { icon: '📅', title: 'Daily Basis', desc: '8–12 hour full-day service for business itineraries and multi-stop engagements.' },
  { icon: '🗺️', title: 'Multi-Day', desc: 'Long-distance travel, corporate roadshows, and leisure getaways across cities.' },
  { icon: '🚕', title: 'Taxi Services', desc: 'One-way drop or round trip with auto fare calculation based on distance.' },
  { icon: '✈️', title: 'Airport Transfers', desc: 'Reliable, on-time airport pickups and drops — any time of day or night.' },
  { icon: '🏢', title: 'Corporate Accounts', desc: 'Dedicated driver solutions for businesses with monthly billing and priority support.' },
];

const TEAM = [
  {
    name: 'Inayat Shaikh',
    role: 'Founder & CEO',
    desc: 'Passionate about transforming personal mobility in India. Built UR\'s Chauffeur to solve the real problem of finding a trusted driver for your own vehicle.',
    initials: 'IS',
  },
];

function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white pb-16 md:pb-0">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-950 py-20 px-6 text-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/8 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-500/6 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Our Story
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight mb-6">
            We Provide the Driver.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-300">
              You Keep the Wheel.
            </span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            UR's Chauffeur was born from a simple idea — what if you could have a professional, verified driver for your own car, anytime you need one? No rental. No cab. Just your vehicle, driven safely.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-slate-900 border-t border-b border-slate-800 py-10 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {STATS.map(s => (
            <div key={s.label}>
              <div className="text-3xl font-black text-emerald-400">{s.value}</div>
              <div className="text-sm font-semibold text-white mt-1">{s.label}</div>
              <div className="text-xs text-slate-500 mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 px-6 bg-slate-950">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-black text-white mb-6">Our Story</h2>
          <div className="space-y-4 text-slate-400 leading-relaxed text-base">
            <p>
              UR's Chauffeur started in Delhi NCR with one mission: make professional driver services accessible to every car owner in India. Whether you've had a long night out, a medical appointment, or simply don't want to drive on a highway — we're here.
            </p>
            <p>
              We noticed a gap in the market. Cab services take you in their car. Car rentals give you a vehicle. But nobody was solving the problem of <span className="text-white font-semibold">providing a trusted driver for your own vehicle</span>. That's exactly what we do.
            </p>
            <p>
              In just 3 months since launch, we've completed over 1,000 rides across Delhi, Gurugram, Chandigarh, and beyond. Our network of 100+ verified drivers continues to grow — each one background-checked, trained, and committed to your safety.
            </p>
            <p>
              We're not just a service. We're a movement towards safer roads, empowered drivers, and stress-free travel for every Indian family.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 px-6 bg-slate-900">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-black text-white mb-3">Our Mission</h3>
            <p className="text-slate-400 leading-relaxed">
              To make professional, verified chauffeur services available to every car owner in India — on-demand, affordable, and trustworthy. We exist to give you peace of mind every time you're behind the wheel.
            </p>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8">
            <div className="text-4xl mb-4">🔭</div>
            <h3 className="text-xl font-black text-white mb-3">Our Vision</h3>
            <p className="text-slate-400 leading-relaxed">
              To become India's most trusted driver-on-demand platform — where every driver is a professional, every ride is safe, and every customer feels valued. We envision a future where no one has to worry about driving.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-6 bg-slate-950">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-white">What We Stand For</h2>
            <p className="text-slate-400 mt-3">The principles that guide every decision we make</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {VALUES.map(v => (
              <div key={v.title} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-emerald-500/30 transition-all">
                <div className="text-3xl mb-3">{v.icon}</div>
                <h3 className="text-lg font-bold text-white mb-2">{v.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 px-6 bg-slate-900">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-white">What We Offer</h2>
            <p className="text-slate-400 mt-3">Flexible services designed around your lifestyle</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SERVICES.map(s => (
              <div key={s.title} className="bg-slate-950 border border-slate-800 rounded-2xl p-6 flex gap-4 items-start">
                <div className="text-3xl flex-shrink-0">{s.icon}</div>
                <div>
                  <h3 className="font-bold text-white mb-1">{s.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 px-6 bg-slate-950">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-white">The People Behind It</h2>
            <p className="text-slate-400 mt-3">Built with passion, driven by purpose</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            {TEAM.map(m => (
              <div key={m.name} className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center flex-1 max-w-sm mx-auto">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-black text-2xl mx-auto mb-4">
                  {m.initials}
                </div>
                <h3 className="text-xl font-black text-white">{m.name}</h3>
                <p className="text-emerald-400 text-sm font-semibold mt-1 mb-3">{m.role}</p>
                <p className="text-slate-400 text-sm leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why choose us */}
      <section className="py-16 px-6 bg-slate-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-black text-white mb-4">Why Customers Choose Us</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 text-left">
            {[
              '✅ Your own vehicle — no rental, no cab',
              '✅ 100% background-verified drivers',
              '✅ Available 24/7 including nights & holidays',
              '✅ Hourly, daily, outstation & taxi options',
              '✅ Online & offline payment accepted',
              '✅ Transparent pricing — no hidden charges',
              '✅ Real-time booking confirmation',
              '✅ Dedicated customer support via WhatsApp & call',
            ].map(item => (
              <div key={item} className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-300">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-slate-950 border-t border-slate-800 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Ready to experience the difference?</h2>
        <p className="text-slate-400 mb-8 max-w-md mx-auto">Join thousands of satisfied customers who trust UR's Chauffeur for every journey.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/booking"
            className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-8 py-3 rounded-full transition-all">
            Book a Driver <ArrowRight size={18} />
          </Link>
          <Link to="/help"
            className="inline-flex items-center justify-center gap-2 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white font-semibold px-8 py-3 rounded-full transition-all">
            Contact Us
          </Link>
        </div>
      </section>
    </div>
  );
}
