import type { Metadata } from "next";
import { PageHeading } from "@/components/layout/PageHeading";

export const metadata: Metadata = {
  title: "Bookings",
};

export default function BookingsPage() {
  return (
    <div>
      <PageHeading
        title="Bookings"
        description="View and manage reservations tied to bookings and booking-flight rows."
      />
      <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center text-zinc-500 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
        <p className="text-base">
          Placeholder: itinerary list and detail views will ship in a future
          step.
        </p>
      </div>
    </div>
  );
}
