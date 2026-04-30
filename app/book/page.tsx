import type { Metadata } from "next";
import { PageHeading } from "@/components/layout/PageHeading";
import { BookingWizard } from "@/components/booking/BookingWizard";

export const metadata: Metadata = {
  title: "Book",
};

export default function BookPage({
  searchParams,
}: {
  searchParams: { flightId?: string };
}) {
  const flightId = searchParams.flightId ? Number(searchParams.flightId) : NaN;

  return (
    <div>
      <PageHeading
        title="Book"
        description="Mock booking flow — choose class, select a saved card, and confirm."
      />
      <BookingWizard flightId={flightId} />
    </div>
  );
}

