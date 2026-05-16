import type { ReactNode } from "react";

export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center py-6 px-2">
      <div
        className="relative bg-background overflow-hidden shadow-2xl"
        style={{
          width: "min(390px, 100vw)",
          minHeight: "844px",
          borderRadius: "min(40px, 6vw)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
