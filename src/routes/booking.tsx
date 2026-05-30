import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { NewBookingForm } from "@/components/customer/NewBookingForm";

export const Route = createFileRoute("/booking")({
  head: () => ({
    meta: [
      { title: "Book a Driver — UR's Chauffeur" },
      { name: "description", content: "Book a professional driver for your vehicle in under a minute." },
    ],
  }),
  component: BookingPage,
});

function BookingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-16 md:pb-0">
      <Navbar />
      <main className="pt-4 pb-4 px-4 max-w-2xl mx-auto">
        <NewBookingForm />
      </main>
    </div>
  );
}
