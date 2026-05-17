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
  Menu,
  XIcon,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "UR's Chauffeur — Professional Drivers for Your Own Car | North India" },
      {
        name: "description",
        content:
          "Book a police-verified professional chauffeur to drive your own car. On-demand, scheduled, hourly, airport & outstation across North India. 30-min arrival.",
      },
      { property: "og:title", content: "UR's Chauffeur — Your Car. Our Driver." },
      {
        property: "og:description",
        content:
          "Premium on-demand chauffeur service across North India. Police-verified, background-checked drivers in 30 minutes.",
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* NAV */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/90 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-foreground">
            <div className="w-9 h-9 rounded-lg bg-accent/20 ring-1 ring-accent/50 flex items-center justify-center">
              <ShieldCheck size={20} className="text-accent" />
            </div>
            <div className="leading-tight">
              <div className="font-bold tracking-tight">UR's Chauffeur</div>
              <div className="text-[10px] text-muted-foreground -mt-0.5">Premium drivers · North India</div>
            </div>
          </Link>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-7 text-sm text-foreground">
            <Link to="/" className="hover:text-accent transition">Home</Link>
            <Link to="/booking" className="hover:text-accent transition">Book a Driver</Link>
            <a href="#how-it-works" className="hover:text-accent transition">How it Works</a>
            <a href="#contact" className="hover:text-accent transition">Contact</a>
          </nav>
          
          <Link
            to="/booking"
            className="hidden sm:inline-flex items-center gap-2 bg-accent text-accent-foreground font-semibold px-4 py-2 rounded-full text-sm hover:brightness-105 transition"
          >
            Book Now <ArrowRight size={16} />
          </Link>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-accent/10 rounded-lg transition"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <XIcon size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-white">
            <nav className="flex flex-col px-6 py-4 space-y-3">
              <Link 
                to="/" 
                className="text-foreground hover:text-accent transition py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                to="/booking" 
                className="text-foreground hover:text-accent transition py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Book a Driver
              </Link>
              <a 
                href="#how-it-works" 
                className="text-foreground hover:text-accent transition py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                How it Works
              </a>
              <a 
                href="#contact" 
                className="text-foreground hover:text-accent transition py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact
              </a>
            </nav>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className="min-h-screen flex items-center justify-center text-center px-6 py-20 bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight">
            Your Car. Our Driver. Anytime.
          </h1>
          <p className="text-xl text-gray-300 mt-4 max-w-xl mx-auto">
            Background-verified chauffeurs at your doorstep — across North India
          </p>
          <Link 
            to="/booking" 
            className="mt-8 inline-block bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-lg px-10 py-4 rounded-full transition-all duration-200 shadow-lg hover:shadow-yellow-400/40 hover:scale-105"
          >
            Book a Driver →
          </Link>
          <p className="mt-5 text-gray-400 text-sm">
            ⭐ 4.8 Rated  ·  500+ Verified Drivers  ·  Across North India
          </p>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="bg-yellow-400 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-black text-black">500+</div>
              <div className="text-sm font-semibold text-black/80 mt-1">Drivers</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-black text-black">10,000+</div>
              <div className="text-sm font-semibold text-black/80 mt-1">Rides</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-black text-black">4.8★</div>
              <div className="text-sm font-semibold text-black/80 mt-1">Rating</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-black text-black">North India</div>
              <div className="text-sm font-semibold text-black/80 mt-1">Coverage</div>
            </div>
          </div>
        </div>
      </section>

      {/* PREMIUM CHAUFFEUR SERVICES */}
      <section className="bg-slate-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-black text-yellow-400 text-center mb-12 uppercase tracking-wide">
            Premium Chauffeur Services
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Card 1 */}
            <div className="bg-slate-800 rounded-2xl p-6 border border-yellow-400/20">
              <div className="text-4xl mb-3">🛡️</div>
              <h3 className="text-yellow-400 font-bold text-lg mb-2">Trust & Safety First</h3>
              <div className="text-gray-300 text-sm space-y-1">
                <p>• Your Journey, Our Responsibility</p>
                <p>• Safe Rides. Every Time.</p>
                <p>• Where Reliability Meets the Road</p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-slate-800 rounded-2xl p-6 border border-yellow-400/20">
              <div className="text-4xl mb-3">👔</div>
              <h3 className="text-yellow-400 font-bold text-lg mb-2">Professional & Premium</h3>
              <div className="text-gray-300 text-sm space-y-1">
                <p>• Driven by Excellence</p>
                <p>• Arrive in Style, Arrive on Time</p>
                <p>• The Professional Way to Travel</p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-slate-800 rounded-2xl p-6 border border-yellow-400/20">
              <div className="text-4xl mb-3">🤝</div>
              <h3 className="text-yellow-400 font-bold text-lg mb-2">Friendly & Local</h3>
              <div className="text-gray-300 text-sm space-y-1">
                <p>• Your City, Our Drivers</p>
                <p>• Yes Boss, We're On The Way</p>
                <p>• Neighbours Driving Neighbours</p>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-slate-800 rounded-2xl p-6 border border-yellow-400/20">
              <div className="text-4xl mb-3">⚡</div>
              <h3 className="text-yellow-400 font-bold text-lg mb-2">Speed & Convenience</h3>
              <div className="text-gray-300 text-sm space-y-1">
                <p>• One Call. We're There.</p>
                <p>• Skip the Hassle, Book a Driver</p>
                <p>• Your Destination, No Detours</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-400 text-black rounded-xl p-4 text-center mt-8 font-semibold max-w-3xl mx-auto">
            Explore at your own pace: Hourly Rates · Daily Packages · Multi-Day Tours
          </div>
        </div>
      </section>

      {/* OUR TAILORED CHAUFFEUR SERVICES */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-black text-slate-900 text-center mb-12">
            Our Tailored Chauffeur Services
          </h2>

          <div className="max-w-2xl mx-auto space-y-6">
            {/* Card 1: Hourly */}
            <div className="bg-slate-900 text-white rounded-2xl p-6 flex gap-4 items-start">
              <div className="text-4xl">🕐</div>
              <div className="flex-1">
                <h3 className="text-yellow-400 font-black text-xl">HOURLY BASIS</h3>
                <p className="text-gray-400 text-sm">(By The Hour)</p>
                <p className="text-gray-300 text-sm mt-2">
                  Perfect for city meetings, shopping trips, or quick transfers. 
                  Minimum booking applies. Flexible, on-demand service.
                </p>
              </div>
            </div>

            {/* Card 2: Daily */}
            <div className="bg-slate-900 text-white rounded-2xl p-6 flex gap-4 items-start">
              <div className="text-4xl">📅</div>
              <div className="flex-1">
                <h3 className="text-yellow-400 font-black text-xl">DAILY BASIS</h3>
                <p className="text-gray-400 text-sm">(Full Day Rental)</p>
                <p className="text-gray-300 text-sm mt-2">
                  Complete mobility for 8-12 hours. Business itineraries, 
                  sightseeing tours, and multi-stop engagements. All-inclusive daily rate.
                </p>
              </div>
            </div>

            {/* Card 3: Multiple Day */}
            <div className="bg-slate-900 text-white rounded-2xl p-6 flex gap-4 items-start">
              <div className="text-4xl">🗺️</div>
              <div className="flex-1">
                <h3 className="text-yellow-400 font-black text-xl">MULTIPLE DAY</h3>
                <p className="text-gray-400 text-sm">(Extended Engagements)</p>
                <p className="text-gray-300 text-sm mt-2">
                  Long-distance travel, corporate roadshows, and leisure getaways. 
                  Travel with confidence across cities. Custom pricing and vehicle consistency.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 text-center">
            <Link 
              to="/booking" 
              className="inline-block bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-lg px-12 py-4 rounded-full transition-all hover:scale-105"
            >
              Book Your Chauffeur →
            </Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary">How It Works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
              <div className="text-5xl mb-4">📍</div>
              <h3 className="text-xl font-bold text-primary mb-3">Enter Your Location</h3>
              <p className="text-muted-foreground">Tell us where you are and where you're headed.</p>
            </div>
            <div className="rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
              <div className="text-5xl mb-4">🧑‍✈️</div>
              <h3 className="text-xl font-bold text-primary mb-3">We Assign a Driver</h3>
              <p className="text-muted-foreground">A background-verified driver is matched instantly.</p>
            </div>
            <div className="rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
              <div className="text-5xl mb-4">🌟</div>
              <h3 className="text-xl font-bold text-primary mb-3">Sit Back & Relax</h3>
              <p className="text-muted-foreground">Your driver arrives in your own car. You enjoy the ride.</p>
            </div>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary">Why Choose UR's Chauffeur?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="text-3xl mb-3">✅</div>
              <h3 className="text-lg font-bold text-primary mb-2">Verified Drivers</h3>
              <p className="text-sm text-muted-foreground">All drivers are background-checked and trained.</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="text-3xl mb-3">🕐</div>
              <h3 className="text-lg font-bold text-primary mb-2">On-Demand & Scheduled</h3>
              <p className="text-sm text-muted-foreground">Book instantly or plan ahead.</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="text-3xl mb-3">🛣️</div>
              <h3 className="text-lg font-bold text-primary mb-2">Outstation Trips</h3>
              <p className="text-sm text-muted-foreground">Long-distance travel made easy.</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="text-3xl mb-3">💰</div>
              <h3 className="text-lg font-bold text-primary mb-2">Transparent Pricing</h3>
              <p className="text-sm text-muted-foreground">No hidden charges, ever.</p>
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
      <section className="px-6 py-16 bg-primary text-primary-foreground">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold">Ready for your next ride?</h2>
          <p className="mt-3 text-white/80">
            A verified chauffeur is 30 minutes away. Your car stays with you.
          </p>
          <Link to="/booking" className="btn-saffron mt-6 inline-flex px-8">
            Book a Driver <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="contact" className="bg-gray-900 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            {/* Col 1: Logo and tagline */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-lg bg-accent/20 ring-1 ring-accent/50 flex items-center justify-center">
                  <ShieldCheck size={20} className="text-accent" />
                </div>
                <div className="font-bold text-lg">UR's Chauffeur</div>
              </div>
              <p className="text-sm text-gray-400">
                Professional drivers across North India
              </p>
            </div>

            {/* Col 2: Links */}
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/" className="hover:text-accent transition">Home</Link></li>
                <li><Link to="/booking" className="hover:text-accent transition">Book a Driver</Link></li>
                <li><a href="#how-it-works" className="hover:text-accent transition">How it Works</a></li>
                <li><a href="#contact" className="hover:text-accent transition">Contact</a></li>
              </ul>
            </div>

            {/* Col 3: Copyright */}
            <div>
              <p className="text-sm text-gray-400">
                © 2025 UR's Chauffeur. All rights reserved.
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Made with ❤️ in India
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
