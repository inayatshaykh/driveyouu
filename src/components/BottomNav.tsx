import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Car, History, Shield, User } from "lucide-react";

export function BottomNav() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const items = [
    { to: "/customer", label: "Home", icon: Home },
    { to: "/customer/history", label: "History", icon: History },
    { to: "/customer/emergency", label: "Safety", icon: Shield },
    { to: "/customer/profile", label: "Profile", icon: User },
  ];
  return (
    <nav className="absolute bottom-0 left-0 right-0 bg-white border-t border-border shadow-[0_-4px_14px_-6px_rgba(26,60,94,0.12)] px-2 py-2 flex items-center justify-around">
      {items.map((it) => {
        const active = path === it.to;
        const Icon = it.icon;
        return (
          <Link
            key={it.to}
            to={it.to}
            className="flex flex-col items-center gap-1 py-1 px-3 relative"
          >
            <Icon
              size={20}
              className={active ? "text-accent" : "text-muted-foreground"}
              strokeWidth={active ? 2.4 : 1.8}
            />
            <span
              className={`text-[11px] font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}
            >
              {it.label}
            </span>
            {active && (
              <span className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-accent" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
