import { createFileRoute } from "@tanstack/react-router";
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

const services = [
  {
    label: "On-Demand",
    desc: "Get a driver in 30 minutes whenever you need one.",
    price: "₹199",
    icon: Car,
  },
  {
    label: "Scheduled",
    desc: "Book in advance for meetings, events or trips.",
    price: "₹249",
    icon: Calendar,
  },
  {
    label: "Hourly",
    desc: "Keep a chauffeur for as many hours as you want.",
    price: "₹150/hr",
    icon: Clock,
  },
  {
    label: "Airport",
    desc: "Reliable pickups & drops to IGI and beyond.",
    price: "₹399",
    icon: Plane,
  },
  {
    label: "Outstation",
    desc: "Inter-city travel with overnight allowance included.",
    price: "₹1,999",
    icon: RouteIcon,
  },
];

const steps = [
  { n: "1", title: "Enter location", desc: "Tell us where to pick you up and where you're headed." },
  { n: "2", title: "Get matched", desc: "We assign a verified chauffeur near you in 30 minutes." },
  { n: "3", title: "Relax in your car", desc: "Sit back while our driver takes the wheel of your car." },
];

const comparison = [
  { feature: "Police-verified drivers", us: true, them: false },
  { feature: "In-office KYC", us: true, them: false },
  { feature: "80% earnings to driver", us: true, them: false },
  { feature: "North India coverage", us: true, them: false },
  { feature: "Trained for premium cars", us: true, them: false },
  { feature: "Flat, transparent pricing", us: true, them: false },
];

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
  const [tab, setTab] = useState<"Now" | "Scheduled" | "Hourly" | "Outstation" | "Airport">("Now");

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* NAV */}
      <header className="absolute top-0 inset-x-0 z-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-5 flex items-center justify-between">
          <a href="#" className="flex items-center gap-2 text-white">
            <div className="w-9 h-9 rounded-lg bg-accent/20 ring-1 ring-accent/50 flex items-center justify-center">
              <ShieldCheck size={20} className="text-accent" />
            </div>
            <div className="leading-tight">
              <div className="font-bold tracking-tight">UR's Chauffeur</div>
              <div className="text-[10px] text-white/70 -mt-0.5">Premium drivers · North India</div>
            </div>
          </a>
          <nav className="hidden md:flex items-center gap-7 text-sm text-white/90">
            <a href="#services" className="hover:text-accent transition">Services</a>
            <a href="#how" className="hover:text-accent transition">How it works</a>
            <a href="#why" className="hover:text-accent transition">Why us</a>
            <a href="#reviews" className="hover:text-accent transition">Reviews</a>
          </nav>
          <a
            href="#book"
            className="hidden sm:inline-flex items-center gap-2 bg-accent text-accent-foreground font-semibold px-4 py-2 rounded-full text-sm hover:brightness-105 transition"
          >
            Book Now <ArrowRight size={16} />
          </a>
        </div>
      </header>

      {/* HERO */}
      <section
        className="relative min-h-screen flex items-center justify-center text-center px-6 pt-28 pb-40 overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #1A3C5E 0%, #14304B 100%)",
        }}
      >
        {/* diagonal pattern */}
        <div
          className="absolute inset-0 opacity-[0.08] pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, #ffffff 0 1px, transparent 1px 22px)",
          }}
        />
        <div
          className="absolute -top-32 -right-32 w-[480px] h-[480px] rounded-full blur-3xl opacity-20"
          style={{ background: "#F5A623" }}
        />

        <div className="relative max-w-3xl mx-auto text-white">
          <span className="inline-flex items-center gap-2 bg-white/10 ring-1 ring-white/20 backdrop-blur px-3 py-1.5 rounded-full text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-accent pulse-dot" />
            Trusted by 25,000+ riders across North India
          </span>
          <h1 className="mt-6 font-bold tracking-tight text-[36px] sm:text-5xl lg:text-[56px] leading-[1.05]">
            Your Car. Our Driver.
          </h1>
          <p className="mt-5 text-white/85 text-base sm:text-lg lg:text-xl max-w-2xl mx-auto">
            Professional verified chauffeurs on demand across North India.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <a href="#book" className="btn-saffron px-7 text-base">
              Book a Driver <ArrowRight size={18} />
            </a>
            <a
              href="#how"
              className="inline-flex items-center justify-center gap-2 h-[56px] px-7 rounded-full font-semibold text-white border border-white/30 hover:bg-white/10 transition"
            >
              How it Works
            </a>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs sm:text-sm text-white/85">
            {[
              "Police Verified",
              "Background Checked",
              "North India Wide",
              "30 Min Arrival",
            ].map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5">
                <Check size={16} className="text-accent" /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* BOOKING WIDGET */}
      <section id="book" className="relative px-4 -mt-24 z-10">
        <div className="max-w-[600px] mx-auto bg-white rounded-2xl shadow-xl p-5 sm:p-7 border border-border">
          <h2 className="text-lg sm:text-xl font-bold mb-4">Book your chauffeur</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 border border-border rounded-xl px-4 h-14">
              <MapPin size={18} className="text-accent shrink-0" />
              <input
                placeholder="Pickup location"
                defaultValue="Connaught Place, New Delhi"
                className="flex-1 text-sm font-medium bg-transparent outline-none"
              />
            </div>
            <div className="flex items-center gap-3 border border-border rounded-xl px-4 h-14">
              <Circle size={16} className="text-primary fill-primary/10 shrink-0" />
              <input
                placeholder="Drop location"
                className="flex-1 text-sm font-medium bg-transparent outline-none"
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {(["Now", "Scheduled", "Hourly", "Outstation", "Airport"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 h-9 rounded-full text-xs font-semibold transition ${
                  tab === t
                    ? "bg-accent text-accent-foreground shadow"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/70"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <button className="btn-saffron w-full mt-5 text-base">
            Find a Driver <ArrowRight size={18} />
          </button>
          <p className="mt-3 text-center text-[11px] text-muted-foreground">
            No credit card required · Pay after the ride
          </p>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="px-6 py-20 lg:py-28">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-semibold tracking-widest text-accent uppercase">
              Our Services
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-primary">
              A driver for every kind of ride
            </h2>
            <p className="mt-3 text-muted-foreground">
              From midnight airport runs to weekend road trips — book the right chauffeur for the job.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-5">
            {services.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className="bg-white border border-border rounded-2xl p-5 hover:shadow-lg hover:-translate-y-1 transition"
                >
                  <div className="w-11 h-11 rounded-xl bg-accent/15 flex items-center justify-center">
                    <Icon size={22} className="text-primary" />
                  </div>
                  <div className="mt-4 font-semibold">{s.label}</div>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    {s.desc}
                  </p>
                  <div className="mt-4 pt-3 border-t border-border flex items-baseline gap-1">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide">From</span>
                    <span className="money text-primary font-bold">{s.price}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="px-6 py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-semibold tracking-widest text-accent uppercase">
              How it works
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-primary">
              Three steps to a chauffeured ride
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10 relative">
            {steps.map((s, i) => (
              <div key={s.n} className="relative text-center md:text-left">
                <div className="font-bold text-accent leading-none" style={{ fontSize: "72px" }}>
                  {s.n}
                </div>
                <div className="mt-2 text-xl font-semibold text-primary">{s.title}</div>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto md:mx-0">
                  {s.desc}
                </p>
                {i < steps.length - 1 && (
                  <ArrowRight
                    size={28}
                    className="hidden md:block absolute top-6 -right-5 text-accent/60"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY US */}
      <section id="why" className="px-6 py-20 lg:py-28">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs font-semibold tracking-widest text-accent uppercase">
              Why UR's Chauffeur
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-primary leading-tight">
              The premium chauffeur service North India trusts.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Every driver passes a strict in-office KYC and police background check. We pay our drivers 80% of every fare — that's why they stay long, drive well, and treat your car with the respect it deserves.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Police-verified, in-person KYC",
                "Trained for luxury & manual transmission cars",
                "Flat fares — no surge, no surprises",
                "Live tracking + 24/7 SOS support",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                    <Check size={13} className="text-accent" />
                  </span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white border border-border rounded-2xl shadow-md overflow-hidden">
            <div className="grid grid-cols-3 text-xs sm:text-sm font-semibold bg-primary text-primary-foreground">
              <div className="px-4 py-3">Feature</div>
              <div className="px-4 py-3 text-center">UR's Chauffeur</div>
              <div className="px-4 py-3 text-center">Others</div>
            </div>
            {comparison.map((row, i) => (
              <div
                key={row.feature}
                className={`grid grid-cols-3 text-xs sm:text-sm border-t border-border ${
                  i % 2 ? "bg-secondary/40" : ""
                }`}
              >
                <div className="px-4 py-3">{row.feature}</div>
                <div className="px-4 py-3 flex justify-center">
                  {row.us ? (
                    <Check size={18} className="text-success" />
                  ) : (
                    <X size={18} className="text-muted-foreground" />
                  )}
                </div>
                <div className="px-4 py-3 flex justify-center">
                  {row.them ? (
                    <Check size={18} className="text-success" />
                  ) : (
                    <X size={18} className="text-muted-foreground" />
                  )}
                </div>
              </div>
            ))}
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
          <a href="#book" className="btn-saffron mt-6 inline-flex px-8">
            Book a Driver <ArrowRight size={18} />
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#14304B] text-white/80 px-6 py-14">
        <div className="max-w-7xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2 text-white">
              <div className="w-9 h-9 rounded-lg bg-accent/20 ring-1 ring-accent/50 flex items-center justify-center">
                <ShieldCheck size={20} className="text-accent" />
              </div>
              <div className="font-bold">UR's Chauffeur</div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-white/70">
              Premium on-demand chauffeurs for your own car. Operating across Delhi NCR, Punjab, Haryana, Chandigarh and Himachal.
            </p>
          </div>
          <div>
            <div className="text-sm font-semibold text-white mb-4">Services</div>
            <ul className="space-y-2 text-sm">
              <li><a href="#services" className="hover:text-accent">On-Demand</a></li>
              <li><a href="#services" className="hover:text-accent">Scheduled</a></li>
              <li><a href="#services" className="hover:text-accent">Hourly</a></li>
              <li><a href="#services" className="hover:text-accent">Airport</a></li>
              <li><a href="#services" className="hover:text-accent">Outstation</a></li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold text-white mb-4">Company</div>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-accent">About us</a></li>
              <li><a href="#" className="hover:text-accent">Drive with us</a></li>
              <li><a href="#" className="hover:text-accent">Careers</a></li>
              <li><a href="#" className="hover:text-accent">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-accent">Terms of Service</a></li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold text-white mb-4">Contact</div>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2"><Phone size={14} className="text-accent" /> +91 98100 00000</li>
              <li className="flex items-center gap-2"><Mail size={14} className="text-accent" /> hello@urschauffeur.in</li>
              <li className="flex items-start gap-2"><MapPinned size={14} className="text-accent mt-0.5" /> Connaught Place, New Delhi</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-white/10 text-xs flex flex-col sm:flex-row gap-2 sm:justify-between text-white/60">
          <div>© {new Date().getFullYear()} UR's Chauffeur Pvt. Ltd. All rights reserved.</div>
          <div>GSTIN: 07AABCU9603R1ZM</div>
        </div>
      </footer>
    </div>
  );
}
