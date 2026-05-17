import { createFileRoute, Link } from "@tanstack/react-router";
import {
  MapPin,
  Circle,
  ArrowRight,
  Car,
  Calendar,
  Clock,
  Plane,
  Route as RouteIcon,
  ShieldCheck,
  Star,
  Check,
  X,
  Phone,
  Mail,
  MapPinned,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "UR's Chauffeur — Premium Cab Service with Driver | North India" },
      {
        name: "description",
        content:
          "Book a complete cab service with verified driver. We provide the car + driver. On-demand, scheduled, hourly, airport & outstation across North India. 30-min arrival.",
      },
      { property: "og:title", content: "UR's Chauffeur — We Provide Car + Driver" },
      {
        property: "og:description",
        content:
          "Premium cab service with verified drivers across North India. We provide the vehicle + driver — you just sit back.",
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
      <section className="min-h-screen flex items-center justify-center text-center px-6 py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight">
            We Provide Car + Driver. Anytime.
          </h1>
          <p className="text-xl text-slate-300 mt-4 max-w-xl mx-auto">
            Complete cab service with background-verified drivers — across North India
          </p>
          <Link 
            to="/booking" 
            className="mt-8 inline-block bg-amber-500 hover:bg-amber-400 text-slate-900 font-black text-lg px-10 py-4 rounded-full transition-all duration-200 shadow-lg shadow-amber-500/20 hover:scale-105"
          >
            Book a Cab →
          </Link>
          <p className="mt-5 text-slate-400 text-sm">
            ⭐ 4.8 Rated  ·  500+ Verified Drivers  ·  Across North India
          </p>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="bg-slate-800 border-t border-b border-slate-700 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-black text-amber-400">500+</div>
              <div className="text-sm font-semibold text-slate-400 mt-1">Drivers</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-black text-amber-400">10,000+</div>
              <div className="text-sm font-semibold text-slate-400 mt-1">Rides</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-black text-amber-400">4.8★</div>
              <div className="text-sm font-semibold text-slate-400 mt-1">Rating</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-black text-amber-400">North India</div>
              <div className="text-sm font-semibold text-slate-400 mt-1">Coverage</div>
            </div>
          </div>
        </div>
      </section>

      {/* PREMIUM CHAUFFEUR SERVICES */}
      <section className="bg-slate-900 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-black text-amber-400 text-center mb-12 uppercase tracking-widest">
            Premium Chauffeur Services
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Card 1 */}
            <div className="bg-slate-800 rounded-2xl p-6 border border-amber-400/20">
              <div className="text-4xl mb-3">🛡️</div>
              <h3 className="text-amber-400 font-bold text-lg mb-2">Trust & Safety First</h3>
              <div className="text-gray-300 text-sm space-y-1">
                <p>• Your Journey, Our Responsibility</p>
                <p>• Safe Rides. Every Time.</p>
                <p>• Where Reliability Meets the Road</p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-slate-800 rounded-2xl p-6 border border-amber-400/20">
              <div className="text-4xl mb-3">👔</div>
              <h3 className="text-amber-400 font-bold text-lg mb-2">Professional & Premium</h3>
              <div className="text-gray-300 text-sm space-y-1">
                <p>• Driven by Excellence</p>
                <p>• Arrive in Style, Arrive on Time</p>
                <p>• The Professional Way to Travel</p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-slate-800 rounded-2xl p-6 border border-amber-400/20">
              <div className="text-4xl mb-3">🤝</div>
              <h3 className="text-amber-400 font-bold text-lg mb-2">Friendly & Local</h3>
              <div className="text-gray-300 text-sm space-y-1">
                <p>• Your City, Our Drivers</p>
                <p>• Yes Boss, We're On The Way</p>
                <p>• Neighbours Driving Neighbours</p>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-slate-800 rounded-2xl p-6 border border-amber-400/20">
              <div className="text-4xl mb-3">⚡</div>
              <h3 className="text-amber-400 font-bold text-lg mb-2">Speed & Convenience</h3>
              <div className="text-gray-300 text-sm space-y-1">
                <p>• One Call. We're There.</p>
                <p>• Skip the Hassle, Book a Cab</p>
                <p>• Your Destination, No Detours</p>
              </div>
            </div>
          </div>

          <div className="bg-amber-500 text-slate-900 rounded-xl p-4 text-center font-bold mt-8 max-w-3xl mx-auto">
            Explore at your own pace: Hourly Rates · Daily Packages · Multi-Day Tours
          </div>
        </div>
      </section>

      {/* OUR TAILORED CHAUFFEUR SERVICES */}
      <section className="bg-slate-800 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-black text-white text-center mb-12">
            Our Tailored Chauffeur Services
          </h2>

          <div className="max-w-2xl mx-auto space-y-5">
            {/* Card 1: Hourly */}
            <div className="bg-slate-900 text-white rounded-2xl p-6 flex gap-5 items-start border border-slate-700">
              <div className="text-5xl">🕐</div>
              <div className="flex-1">
                <h3 className="text-amber-400 font-black text-xl">HOURLY BASIS</h3>
                <p className="text-gray-400 text-sm">(By The Hour)</p>
                <p className="text-gray-300 text-sm mt-2">
                  Perfect for city meetings, shopping trips, or quick transfers. 
                  Minimum booking: 4 hours. Flexible, on-demand service.
                </p>
              </div>
            </div>

            {/* Card 2: Daily */}
            <div className="bg-slate-900 text-white rounded-2xl p-6 flex gap-5 items-start border border-slate-700">
              <div className="text-5xl">📅</div>
              <div className="flex-1">
                <h3 className="text-amber-400 font-black text-xl">DAILY BASIS</h3>
                <p className="text-gray-400 text-sm">(Full Day Rental)</p>
                <p className="text-gray-300 text-sm mt-2">
                  Complete mobility for 8-12 hours. Business itineraries, 
                  sightseeing tours, multi-stop engagements. All-inclusive daily rate.
                </p>
              </div>
            </div>

            {/* Card 3: Multiple Day */}
            <div className="bg-slate-900 text-white rounded-2xl p-6 flex gap-5 items-start border border-slate-700">
              <div className="text-5xl">🗺️</div>
              <div className="flex-1">
                <h3 className="text-amber-400 font-black text-xl">MULTIPLE DAY</h3>
                <p className="text-gray-400 text-sm">(Extended Engagements)</p>
                <p className="text-gray-300 text-sm mt-2">
                  Long-distance travel, corporate roadshows, and leisure getaways. 
                  Travel with confidence across cities. Custom pricing, consistent vehicle.
                </p>
              </div>
            </div>
          </div>

          <Link 
            to="/booking" 
            className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-black text-lg px-12 py-4 rounded-full block w-fit mx-auto mt-10 hover:scale-105 transition-all"
          >
            Book Your Chauffeur →
          </Link>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="bg-slate-900 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white">How It Works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center">
              <div className="text-5xl mb-4">📍</div>
              <h3 className="text-xl font-bold text-white mb-3">Enter Your Location</h3>
              <p className="text-slate-300">Tell us where you are and where you're headed.</p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center">
              <div className="text-5xl mb-4">🧑‍✈️</div>
              <h3 className="text-xl font-bold text-white mb-3">We Assign a Driver</h3>
              <p className="text-slate-300">A background-verified driver is matched instantly.</p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center">
              <div className="text-5xl mb-4">🌟</div>
              <h3 className="text-xl font-bold text-white mb-3">Sit Back & Relax</h3>
              <p className="text-slate-300">We provide the car + driver. You just sit back and enjoy the ride.</p>
            </div>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="bg-slate-800 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white">Why Choose UR's Chauffeur?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-900/60 border border-slate-700 rounded-2xl p-6">
              <div className="text-3xl mb-3">✅</div>
              <h3 className="text-lg font-bold text-white mb-2">Verified Drivers</h3>
              <p className="text-sm text-slate-300">All drivers are background-checked and trained.</p>
            </div>
            <div className="bg-slate-900/60 border border-slate-700 rounded-2xl p-6">
              <div className="text-3xl mb-3">🕐</div>
              <h3 className="text-lg font-bold text-white mb-2">On-Demand & Scheduled</h3>
              <p className="text-sm text-slate-300">Book instantly or plan ahead.</p>
            </div>
            <div className="bg-slate-900/60 border border-slate-700 rounded-2xl p-6">
              <div className="text-3xl mb-3">🛣️</div>
              <h3 className="text-lg font-bold text-white mb-2">Outstation Trips</h3>
              <p className="text-sm text-slate-300">Long-distance travel made easy.</p>
            </div>
            <div className="bg-slate-900/60 border border-slate-700 rounded-2xl p-6">
              <div className="text-3xl mb-3">💰</div>
              <h3 className="text-lg font-bold text-white mb-2">Transparent Pricing</h3>
              <p className="text-sm text-slate-300">No hidden charges, ever.</p>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="reviews" className="px-6 py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-semibold tracking-widest text-accent uppercase">
              Reviews
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-primary">
              Loved by riders across the region
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="bg-background border border-border rounded-2xl p-6 flex flex-col"
              >
                <div className="flex gap-0.5 text-accent">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} size={16} fill="currentColor" />
                  ))}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-foreground/90 flex-1">
                  "{t.quote}"
                </p>
                <div className="mt-5 pt-4 border-t border-border">
                  <div className="font-semibold text-sm">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.city}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA STRIP */}
      <section className="px-6 py-16 bg-slate-900 text-white border-t border-slate-800">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold">Ready for your next ride?</h2>
          <p className="mt-3 text-slate-300">
            A verified cab with driver is 30 minutes away. We provide the vehicle + driver.
          </p>
          <Link 
            to="/booking" 
            className="mt-6 inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-8 py-3 rounded-full transition-all"
          >
            Book a Cab <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="contact" className="bg-slate-950 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            {/* Col 1: Logo and tagline */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-lg bg-amber-500/20 ring-1 ring-amber-500/50 flex items-center justify-center">
                  <ShieldCheck size={20} className="text-amber-400" />
                </div>
                <div className="font-bold text-lg">UR's Chauffeur</div>
              </div>
              <p className="text-sm text-slate-400">
                Professional drivers across North India
              </p>
            </div>

            {/* Col 2: Links */}
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link to="/" className="hover:text-amber-400 transition">Home</Link></li>
                <li><Link to="/booking" className="hover:text-amber-400 transition">Book a Cab</Link></li>
                <li><a href="#how-it-works" className="hover:text-amber-400 transition">How it Works</a></li>
                <li><a href="#contact" className="hover:text-amber-400 transition">Contact</a></li>
              </ul>
            </div>

            {/* Col 3: Copyright */}
            <div>
              <p className="text-sm text-slate-400">
                © 2025 UR's Chauffeur. All rights reserved.
              </p>
              <p className="text-sm text-slate-400 mt-2">
                Made with ❤️ in India
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
