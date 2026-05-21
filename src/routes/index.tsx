import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, Star, Loader2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { useState, useEffect } from "react";
import { fetchVisibleReviews, type Review } from "@/lib/reviewService";

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

// Fallback shown while loading or if no reviews in DB yet
const FALLBACK_REVIEWS: Review[] = [
  {
    id: '1',
    name: "Rohan Sharma",
    city: "New Delhi",
    rating: 5,
    quote: "Booked a driver for an airport drop at 4 AM. Driver was professional, on time, and handled my BMW like his own.",
    visible: true,
    created_at: '',
  },
  {
    id: '2',
    name: "Anjali Verma",
    city: "Gurugram",
    rating: 5,
    quote: "I use UR's Chauffeur every weekend for parties. No more worrying about driving back home — totally worth it.",
    visible: true,
    created_at: '',
  },
  {
    id: '3',
    name: "Karan Mehta",
    city: "Chandigarh",
    rating: 5,
    quote: "Took a chauffeur for a Delhi-to-Shimla trip. Calm, experienced driver. Made our family vacation stress-free.",
    visible: true,
    created_at: '',
  },
];

function LandingPage() {
  const [reviews, setReviews] = useState<Review[]>(FALLBACK_REVIEWS);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  useEffect(() => {
    fetchVisibleReviews().then(data => {
      if (data.length > 0) setReviews(data);
      setReviewsLoading(false);
    });
  }, []);
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-950">
        {/* Background decorative elements */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Radial glow top-left */}
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
          {/* Radial glow bottom-right */}
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-500/8 rounded-full blur-3xl" />
          {/* Subtle grid */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 py-20 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            300+ Verified Drivers · Available 24/7
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white tracking-tight leading-[1.05] mb-6">
            Your Vehicle.{' '}
            <span className="relative inline-block">
              <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-300">
                Our Driver.
              </span>
            </span>
            <br />
            Anytime.
          </h1>

          {/* Subtext */}
          <p className="text-lg sm:text-xl text-slate-400 max-w-xl mx-auto mb-10 leading-relaxed">
            Professional, background-verified chauffeurs for your vehicle —
            on-demand or scheduled, across Delhi NCR.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
            <Link
              to="/booking"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-lg px-8 py-4 rounded-2xl transition-all duration-200 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5"
            >
              Book a Driver
              <ArrowRight size={20} />
            </Link>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white font-semibold text-lg px-8 py-4 rounded-2xl transition-all duration-200 hover:-translate-y-0.5"
            >
              How It Works
            </a>
          </div>

          {/* Trust stats */}
          <p className="text-slate-500 text-sm">300+ drivers available 24/7</p>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
      </section>

      {/* STATS BAR */}
      <section className="bg-slate-900 border-t border-b border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-slate-400 text-sm font-medium">300+ drivers available 24/7</p>
        </div>
      </section>

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
          {reviewsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {reviews.map((t) => (
                <div
                  key={t.id}
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
          )}
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
                <img src="/logo.png" alt="UR's Chauffeur" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
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
