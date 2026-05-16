import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bell,
  Edit3,
  MapPin,
  Circle,
  Clock,
  Calendar,
  Plane,
  Route,
  Car,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { BottomNav } from "@/components/BottomNav";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Home — UR's Chauffeur" },
      {
        name: "description",
        content:
          "Book a verified premium chauffeur for your own car. On-demand, scheduled, hourly, airport & outstation.",
      },
    ],
  }),
  component: HomePage,
});

const services = [
  { label: "On-Demand", sub: "Right now", icon: Car },
  { label: "Scheduled", sub: "Plan ahead", icon: Calendar },
  { label: "Hourly", sub: "Pay per hour", icon: Clock },
  { label: "Airport", sub: "IGI · DEL", icon: Plane },
  { label: "Outstation", sub: "Inter-city", icon: Route },
];

const recents = [
  {
    route: "Connaught Place → IGI Airport T3",
    date: "Yesterday · 8:42 PM",
    fare: "₹340",
  },
  {
    route: "Saket → Gurugram Cyber City",
    date: "12 May · 7:10 AM",
    fare: "₹520",
  },
];

function HomePage() {
  const [tab, setTab] = useState<"Now" | "Scheduled" | "Hourly">("Now");

  return (
    <PhoneFrame>
      <div className="pb-24">
        {/* Top bar */}
        <header className="bg-primary text-primary-foreground px-4 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-accent/20 ring-1 ring-accent/40 flex items-center justify-center">
                <ShieldCheck size={18} className="text-accent" />
              </div>
              <div className="leading-tight">
                <div className="font-bold tracking-tight">UR's Chauffeur</div>
                <div className="text-[10px] text-white/70 -mt-0.5">
                  Premium drivers · North India
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button aria-label="Notifications" className="relative">
                <Bell size={20} className="text-white/90" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-accent" />
              </button>
              <div className="w-9 h-9 rounded-full bg-white/15 ring-1 ring-white/25 flex items-center justify-center text-sm font-semibold">
                RS
              </div>
            </div>
          </div>
        </header>

        {/* Location bar */}
        <div className="bg-white px-4 py-3 flex items-center gap-2 border-b border-border">
          <MapPin size={18} className="text-accent" />
          <div className="flex-1 text-sm">
            <span className="text-muted-foreground">Pickup near </span>
            <span className="font-semibold">Connaught Place, New Delhi</span>
          </div>
          <button className="text-muted-foreground" aria-label="Edit location">
            <Edit3 size={16} />
          </button>
        </div>

        {/* Booking card */}
        <div className="px-4 pt-4">
          <div className="card-base">
            <div className="space-y-0">
              <div className="flex items-center gap-3 py-2">
                <MapPin size={18} className="text-accent" />
                <input
                  defaultValue="Connaught Place, New Delhi"
                  className="flex-1 text-sm font-medium bg-transparent outline-none"
                />
              </div>
              <div className="border-t border-border ml-7" />
              <div className="flex items-center gap-3 py-2">
                <Circle size={16} className="text-primary fill-primary/10" />
                <input
                  placeholder="Where to?"
                  defaultValue="Indira Gandhi Airport T3"
                  className="flex-1 text-sm font-medium bg-transparent outline-none placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div className="mt-3 flex gap-2 bg-secondary rounded-full p-1">
              {(["Now", "Scheduled", "Hourly"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 h-9 rounded-full text-xs font-semibold transition ${
                    tab === t
                      ? "bg-accent text-accent-foreground shadow"
                      : "text-muted-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <Link
              to="/booking"
              className="btn-saffron w-full mt-3 text-[15px]"
            >
              Find a Driver <ArrowRight size={18} />
            </Link>
          </div>
        </div>

        {/* Services */}
        <div className="pt-5">
          <div className="px-4 mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Services</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-none">
            {services.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className="shrink-0 w-[120px] bg-white border border-border rounded-xl p-3 flex flex-col gap-2"
                >
                  <div className="w-9 h-9 rounded-lg bg-accent/15 flex items-center justify-center">
                    <Icon size={20} className="text-primary" />
                  </div>
                  <div className="text-[13px] font-semibold leading-tight">
                    {s.label}
                  </div>
                  <div className="text-[11px] text-muted-foreground leading-tight">
                    {s.sub}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent rides */}
        <div className="px-4 pt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Recent Rides</h2>
            <button className="text-xs font-semibold text-accent">
              See all
            </button>
          </div>
          <div className="space-y-3">
            {recents.map((r) => (
              <div key={r.route} className="card-base flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <Car size={18} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold truncate">
                    {r.route}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-2">
                    <span>{r.date}</span>
                    <span>·</span>
                    <span className="money text-foreground">{r.fare}</span>
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-success/10 text-success text-[10px] font-semibold">
                      Completed
                    </span>
                  </div>
                </div>
                <button className="text-[11px] font-semibold text-primary px-2 py-1 rounded-full hover:bg-secondary">
                  Rebook
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
      <BottomNav />
    </PhoneFrame>
  );
}
