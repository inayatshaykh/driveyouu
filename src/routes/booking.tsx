import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  MapPin,
  Circle,
  Search,
  Tag,
  Phone,
  Share2,
  Siren,
  Check,
  BadgeCheck,
  Star,
} from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";

export const Route = createFileRoute("/booking")({
  head: () => ({
    meta: [
      { title: "Book a Driver — UR's Chauffeur" },
      { name: "description", content: "Pick up, drop off, and confirm your verified chauffeur in under a minute." },
    ],
  }),
  component: BookingPage,
});

type Step = 1 | 2 | 3;

const suggestions = [
  { name: "Indira Gandhi Airport T3", sub: "New Delhi · 16.2 km" },
  { name: "Aerocity Metro Station", sub: "New Delhi · 14.5 km" },
  { name: "DLF Cyber City, Gurugram", sub: "Haryana · 21.8 km" },
];

function BookingPage() {
  const [step, setStep] = useState<Step>(1);

  return (
    <PhoneFrame>
      <div className="relative h-[844px] flex flex-col">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-30 px-4 pt-4">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center"
              aria-label="Back"
            >
              <ArrowLeft size={18} />
            </Link>
            <StepDots step={step} />
            <div className="w-10" />
          </div>
        </div>

        {step === 1 && <StepLocation onNext={() => setStep(2)} />}
        {step === 2 && <StepSummary onNext={() => setStep(3)} onBack={() => setStep(1)} />}
        {step === 3 && <StepConfirmed />}
      </div>
    </PhoneFrame>
  );
}

function StepDots({ step }: { step: Step }) {
  return (
    <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur rounded-full px-3 py-1.5 shadow">
      {[1, 2, 3].map((n) => (
        <div
          key={n}
          className={`h-1.5 rounded-full transition-all ${
            n === step ? "w-6 bg-accent" : n < step ? "w-3 bg-primary" : "w-3 bg-border"
          }`}
        />
      ))}
    </div>
  );
}

/* ---------- Reusable fake map ---------- */
function FakeMap({ withRoute = false }: { withRoute?: boolean }) {
  return (
    <div className="absolute inset-0 bg-[#E8EEF4]">
      {/* grid streets */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 390 844" preserveAspectRatio="none">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0H0v40" fill="none" stroke="#D6DEE8" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="390" height="844" fill="url(#grid)" />
        {/* main road */}
        <path d="M-20 500 Q 100 480 200 520 T 420 480" stroke="#C8D2DF" strokeWidth="14" fill="none" />
        <path d="M-20 500 Q 100 480 200 520 T 420 480" stroke="#fff" strokeWidth="2" fill="none" strokeDasharray="6 6" />
        {/* park */}
        <ellipse cx="80" cy="260" rx="90" ry="60" fill="#D8E8D2" />
        {/* river */}
        <path d="M0 700 Q 200 660 390 720" stroke="#BFD6E6" strokeWidth="22" fill="none" />
        {withRoute && (
          <>
            <path d="M120 600 Q 200 500 280 280" stroke="#1A3C5E" strokeWidth="4" fill="none" strokeDasharray="6 6" />
            <path d="M280 280 Q 320 220 340 160" stroke="#F5A623" strokeWidth="4" fill="none" />
          </>
        )}
      </svg>
      {withRoute && (
        <>
          <div className="absolute" style={{ left: "28%", top: "70%" }}>
            <div className="w-4 h-4 rounded-full bg-accent ring-4 ring-accent/30" />
          </div>
          <div className="absolute" style={{ left: "85%", top: "18%" }}>
            <div className="w-4 h-4 rounded-full bg-primary ring-4 ring-primary/30" />
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- Step 1: pick location ---------- */
function StepLocation({ onNext }: { onNext: () => void }) {
  return (
    <>
      <FakeMap />
      <div className="relative z-20 pt-20 px-4">
        <div className="card-base !p-3 space-y-0">
          <div className="flex items-center gap-3 px-1 py-2">
            <MapPin size={18} className="text-accent" />
            <input
              defaultValue="Connaught Place, New Delhi"
              className="flex-1 text-sm font-medium bg-transparent outline-none"
            />
          </div>
          <div className="border-t border-border ml-7" />
          <div className="flex items-center gap-3 px-1 py-2">
            <Circle size={16} className="text-primary fill-primary/10" />
            <input
              placeholder="Where to?"
              defaultValue="Indira Gandhi Airport T3"
              className="flex-1 text-sm font-medium bg-transparent outline-none"
            />
          </div>
        </div>

        <div className="mt-3 bg-white rounded-2xl shadow-sm overflow-hidden">
          {suggestions.map((s, i) => (
            <button
              key={s.name}
              onClick={onNext}
              className={`w-full flex items-center gap-3 px-3 py-3 text-left ${
                i !== suggestions.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
                <MapPin size={16} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold truncate">{s.name}</div>
                <div className="text-[11px] text-muted-foreground">{s.sub}</div>
              </div>
              <Search size={14} className="text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>

      <div className="absolute bottom-4 left-4 right-4 z-30">
        <button onClick={onNext} className="btn-saffron w-full">
          Continue
        </button>
      </div>
    </>
  );
}

/* ---------- Step 2: summary ---------- */
function StepSummary({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const rows = [
    ["Base fare", "₹49"],
    ["Distance (16.2 km)", "₹120"],
    ["Time (45 min)", "₹30"],
  ];
  return (
    <>
      <FakeMap withRoute />
      <div className="relative z-20 pt-20 px-4 pb-32">
        <div className="flex gap-2 mb-3">
          {["On-Demand", "Scheduled", "Hourly"].map((p, i) => (
            <div
              key={p}
              className={`px-3 py-1.5 rounded-full text-[11px] font-semibold ${
                i === 0 ? "bg-accent text-accent-foreground shadow" : "bg-white text-muted-foreground border border-border"
              }`}
            >
              {p}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-md border-l-[3px] border-accent p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
            Fare breakdown
          </div>
          <div className="space-y-2">
            {rows.map(([k, v]) => (
              <div key={k} className="flex items-center justify-between text-[13px]">
                <span className="text-muted-foreground">{k}</span>
                <span className="money">{v}</span>
              </div>
            ))}
            <div className="border-t border-border my-2" />
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold">Total incl. GST</span>
              <span className="money text-lg font-bold text-primary">₹208</span>
            </div>
          </div>

          <button className="mt-3 flex items-center gap-2 text-[12px] font-semibold text-accent">
            <Tag size={14} /> Apply promo code
          </button>
        </div>

        <button onClick={onBack} className="mt-4 text-xs text-muted-foreground underline">
          Change pickup or drop
        </button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-30 bg-white border-t border-border px-4 py-3 flex items-center gap-3">
        <div className="flex-1">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Total
          </div>
          <div className="money text-xl font-bold text-primary">₹208</div>
        </div>
        <button onClick={onNext} className="btn-saffron flex-1">
          Confirm Booking
        </button>
      </div>
    </>
  );
}

/* ---------- Step 3: confirmed ---------- */
function StepConfirmed() {
  return (
    <div className="relative flex-1 bg-background pt-20 px-4 pb-6 overflow-y-auto">
      <div className="flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full bg-success/15 flex items-center justify-center">
          <svg width="44" height="44" viewBox="0 0 44 44">
            <circle cx="22" cy="22" r="20" fill="none" stroke="#16A34A" strokeWidth="3" />
            <path
              d="M13 23 L20 30 L32 16"
              fill="none"
              stroke="#16A34A"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                strokeDasharray: 40,
                strokeDashoffset: 40,
                animation: "drawCheck 0.6s ease-out 0.2s forwards",
              }}
            />
          </svg>
        </div>
        <div className="mt-3 text-lg font-bold">Driver Confirmed!</div>
        <div className="text-[12px] text-muted-foreground">
          Your chauffeur is on the way
        </div>
      </div>

      {/* Driver card */}
      <div className="mt-5 card-base">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-200 to-amber-400 ring-2 ring-accent/70 flex items-center justify-center text-2xl font-bold text-primary"
            >
              JS
            </div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 whitespace-nowrap">
              <BadgeCheck size={10} /> Verified
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-[15px]">Jagjit Singh</div>
            <div className="flex items-center gap-1 text-[12px] text-muted-foreground mt-0.5">
              <Star size={12} className="fill-accent text-accent" />
              <span className="font-semibold text-foreground">4.9</span>
              <span>· 312 trips</span>
            </div>
            <div className="text-[12px] text-muted-foreground mt-0.5">
              Honda City · <span className="money">DL 3C AB 1234</span>
            </div>
          </div>
        </div>

        <div className="mt-3 bg-amber-50 text-amber-800 rounded-xl px-3 py-2 text-[12px] font-semibold flex items-center justify-between">
          <span>Arriving in</span>
          <span className="money">~12 mins</span>
        </div>
      </div>

      {/* small map */}
      <div className="mt-4 h-40 rounded-2xl overflow-hidden relative shadow-sm border border-border">
        <FakeMap withRoute />
      </div>

      {/* action buttons */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <ActionBtn icon={Phone} label="Call" />
        <ActionBtn icon={Share2} label="Share" />
        <ActionBtn icon={Siren} label="SOS" danger />
      </div>

      <Link to="/" className="mt-6 block text-center text-xs text-muted-foreground underline">
        Back to home
      </Link>

      <div className="hidden">
        <Check />
      </div>
    </div>
  );
}

function ActionBtn({
  icon: Icon,
  label,
  danger,
}: {
  icon: typeof Phone;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      className={`h-14 rounded-xl border flex flex-col items-center justify-center gap-1 text-[11px] font-semibold ${
        danger
          ? "border-destructive/50 text-destructive bg-destructive/5"
          : "border-border bg-white text-foreground"
      }`}
    >
      <Icon size={18} />
      {label}
    </button>
  );
}
