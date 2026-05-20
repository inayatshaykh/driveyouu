import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, Star } from "lucide-react";
import { Navbar } from "@/components/Navbar";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "UR's Chauffeur — Professional Driver Service" },
      {
        name: "description",
        content:
          "Book professional drivers for your vehicle. On-demand, scheduled, hourly, airport & outstation. Background-verified chauffeurs. 30-min arrival.",
      },
      { property: "og:title", content: "UR's Chauffeur — Professional Driver Service" },
      {
        property: "og:description",
        content:
          "Professional driver service with background-verified chauffeurs. We provide the driver for your vehicle — you just sit back.",
      },
    ],
  }),
  component: LandingPage,
});

const testimonials = [
  {
    name: "Rohan Sharma",
    city: "New Delhi",
    rating: 5,
    quote:
      "Booked a driver for an airport drop at 4 AM. Driver was professional, on time, and handled my BMW like his own.",
  },
  {
    name: "Anjali Verma",
    city: "Gurugram",
    rating: 5,
    quote:
      "I use UR's Chauffeur every weekend for parties. No more worrying about driving back home — totally worth it.",
  },
  {
    name: "Karan Mehta",
    city: "Chandigarh",
    rating: 5,
    quote:
      "Took a chauffeur for a Delhi-to-Shimla trip. Calm, experienced driver. Made our family vacation stress-free.",
  },
];

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* HERO */}
      <section className="min-h-screen flex items-center justify-center text-center px-6 py-20 bg-slate-950">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight">
            Your Vehicle. Our Driver. Anytime.
          </h1>
          <p className="text-xl text-slate-400 mt-4 max-w-xl mx-auto">
            Professional drivers for your vehicle — background-verified chauffeurs
          </p>
          <Link 
            to="/booking" 
            className="mt-8 inline-block bg-white hover:bg-slate-100 text-slate-900 font-bold text-lg px-10 py-4 rounded-full transition-all duration-200"
          >
            Book a Driver →
          </Link>
          <p className="mt-5 text-slate-500 text-sm">
            ·  300+ Verified Drivers  ·  
          </p>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="bg-slate-900 border-t border-b border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-black text-white">500+</div>
              <div className="text-sm text-slate-500 mt-1">Drivers</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-black text-white">10,000+</div>
              <div className="text-sm text-slate-500 mt-1">Rides</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-black text-white">4.8★</div>
              <div className="text-sm text-slate-500 mt-1">Rating</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-black text-white">24/7</div>
              <div className="text-sm text-slate-500 mt-1">Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* PREMIUM CHAUFFEUR SERVICES section removed */}

      {/* OUR TAILORED CHAUFFEUR SERVICES */}
      <section className="bg-slate-900 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-black text-white text-center mb-12">
            Our Tailored Chauffeur Services
          </h2>

          <div className="max-w-2xl mx-auto space-y-5">
            {/* Card 1: Hourly */}
            <div className="bg-slate-950 text-white rounded-2xl p-6 flex gap-5 items-start border border-slate-800">
              <div className="text-5xl">🕐</div>
              <div className="flex-1">
                <h3 className="text-white font-black text-xl">HOURLY BASIS</h3>
                <p className="text-slate-500 text-sm">(By The Hour)</p>
                <p className="text-slate-400 text-sm mt-2">
                  Perfect for city meetings, shopping trips, or quick transfers. 
                  Minimum booking: 4 hours. Flexible, on-demand service.
                </p>
              </div>
            </div>

            {/* Card 2: Daily */}
            <div className="bg-slate-950 text-white rounded-2xl p-6 flex gap-5 items-start border border-slate-800">
              <div className="text-5xl">📅</div>
              <div className="flex-1">
                <h3 className="text-white font-black text-xl">DAILY BASIS</h3>
                <p className="text-slate-500 text-sm">(Full Day Rental)</p>
                <p className="text-slate-400 text-sm mt-2">
                  Complete mobility for 8-12 hours. Business itineraries, 
                  sightseeing tours, multi-stop engagements. All-inclusive daily rate.
                </p>
              </div>
            </div>

            {/* Card 3: Multiple Day */}
            <div className="bg-slate-950 text-white rounded-2xl p-6 flex gap-5 items-start border border-slate-800">
              <div className="text-5xl">🗺️</div>
              <div className="flex-1">
                <h3 className="text-white font-black text-xl">MULTIPLE DAY</h3>
                <p className="text-slate-500 text-sm">(Extended Engagements)</p>
                <p className="text-slate-400 text-sm mt-2">
                  Long-distance travel, corporate roadshows, and leisure getaways. 
                  Travel with confidence across cities. Custom pricing, consistent vehicle.
                </p>
              </div>
            </div>
          </div>

          <Link 
            to="/booking" 
            className="bg-white hover:bg-slate-100 text-slate-900 font-bold text-lg px-10 py-4 rounded-full block w-fit mx-auto mt-10 transition-all"
          >
            Book a Driver →
          </Link>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="bg-slate-950 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white">How It Works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
              <div className="text-5xl mb-4">📍</div>
              <h3 className="text-xl font-bold text-white mb-3">Enter Your Location</h3>
              <p className="text-slate-300">Tell us where you are and where you're headed.</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
              <div className="text-5xl mb-4">🧑‍✈️</div>
              <h3 className="text-xl font-bold text-white mb-3">We Assign a Driver</h3>
              <p className="text-slate-300">A background-verified driver is matched instantly.</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
              <div className="text-5xl mb-4">🌟</div>
              <h3 className="text-xl font-bold text-white mb-3">Sit Back & Relax</h3>
              <p className="text-slate-300">We provide the driver for your vehicle. You just sit back and enjoy the ride.</p>
            </div>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="bg-slate-900 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white">Why Choose UR's Chauffeur?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
              <div className="text-3xl mb-3">✅</div>
              <h3 className="text-lg font-bold text-white mb-2">Verified Drivers</h3>
              <p className="text-sm text-slate-300">All drivers are background-checked and trained.</p>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
              <div className="text-3xl mb-3">🕐</div>
              <h3 className="text-lg font-bold text-white mb-2">On-Demand & Scheduled</h3>
              <p className="text-sm text-slate-300">Book instantly or plan ahead.</p>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
              <div className="text-3xl mb-3">🛣️</div>
              <h3 className="text-lg font-bold text-white mb-2">Outstation Trips</h3>
              <p className="text-sm text-slate-300">Long-distance travel made easy.</p>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
              <div className="text-3xl mb-3">💰</div>
              <h3 className="text-lg font-bold text-white mb-2">Transparent Pricing</h3>
              <p className="text-sm text-slate-300">No hidden charges, ever.</p>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="reviews" className="px-6 py-20 lg:py-28 bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-semibold tracking-widest text-slate-500 uppercase">
              Reviews
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-white">
              Loved by riders across the region
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col"
              >
                <div className="flex gap-0.5 text-slate-300">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} size={16} fill="currentColor" />
                  ))}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-slate-300 flex-1">
                  "{t.quote}"
                </p>
                <div className="mt-5 pt-4 border-t border-slate-800">
                  <div className="font-semibold text-sm text-white">{t.name}</div>
                  <div className="text-xs text-slate-500">{t.city}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA STRIP */}
      <section className="px-6 py-16 bg-slate-950 text-white border-t border-slate-800">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold">Ready for your next ride?</h2>
          <p className="mt-3 text-slate-300">
            A verified professional driver is 30 minutes away. We provide the driver for your vehicle.
          </p>
          <Link 
            to="/booking" 
            className="mt-6 inline-flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-900 font-bold px-8 py-3 rounded-full transition-all"
          >
            Book a Driver <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="contact" className="bg-slate-950 text-white py-12 px-6 border-t border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            {/* Col 1: Logo and tagline */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
                  <ShieldCheck size={20} className="text-white" />
                </div>
                <div className="font-bold text-lg text-white">UR's Chauffeur</div>
              </div>
              <p className="text-sm text-slate-500">
                Professional drivers nationwide
              </p>
            </div>

            {/* Col 2: Links */}
            <div>
              <h3 className="font-semibold mb-4 text-white">Quick Links</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link to="/" className="hover:text-white transition">Home</Link></li>
                <li><Link to="/booking" className="hover:text-white transition">Book a Driver</Link></li>
                <li><a href="#how-it-works" className="hover:text-white transition">How it Works</a></li>
                <li><a href="#contact" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>

            {/* Col 3: Copyright */}
            <div>
              <p className="text-sm text-slate-500">
                © 2025 UR's Chauffeur. All rights reserved.
              </p>
              <p className="text-sm text-slate-500 mt-2">
                Made with ❤️ in India
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
