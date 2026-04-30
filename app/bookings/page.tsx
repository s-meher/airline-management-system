import type { Metadata } from "next";
import { PageHeading } from "@/components/layout/PageHeading";
import { BookingsClient } from "@/components/bookings/BookingsClient";

export const metadata: Metadata = {
  title: "Bookings",
};

export default function BookingsPage() {
  return (
    <div>
      <PageHeading
        title="Bookings"
        description="View seeded bookings and any demo bookings you create locally."
      />
      <BookingsClient />
    </div>
  );
}
