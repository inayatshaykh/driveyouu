import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      {/* Back Button */}
      <div className="max-w-2xl mx-auto mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-semibold transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Home
        </Link>
      </div>

      {/* Booking Form */}
      <NewBookingForm />
    </div>
  );
}
