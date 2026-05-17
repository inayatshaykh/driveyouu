import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { NewBookingForm } from "@/components/customer/NewBookingForm";

export const Route = createFileRoute("/booking")({
  head: () => ({
    meta: [
      { title: "Book a Cab — UR's Chauffeur" },
      { name: "description", content: "Book your ride with verified driver and vehicle in under a minute." },
    ],
  }),
  component: BookingPage,
});

function BookingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />
      <main className="py-8 px-4 max-w-2xl mx-auto">
        <NewBookingForm />
      </main>
    </div>
  );
}
