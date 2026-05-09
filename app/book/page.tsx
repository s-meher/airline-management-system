import type { Metadata } from "next";
import { PageHeading } from "@/components/layout/PageHeading";
import { BookingWizard } from "@/components/booking/BookingWizard";

export const metadata: Metadata = {
  title: "Book",
};

function parseFlightIds(sp: {
  flightId?: string | string[];
  flightIds?: string | string[];
}): number[] {
  const rawIds = sp.flightIds;
  if (rawIds) {
    const s = Array.isArray(rawIds) ? rawIds[0] : rawIds;
    return s
      .split(",")
      .map((x) => Number(x.trim()))
      .filter((n) => Number.isFinite(n) && n > 0);
  }
  const rawOne = sp.flightId;
  const one = Array.isArray(rawOne) ? rawOne[0] : rawOne;
  const n = one ? Number(one) : NaN;
  return Number.isFinite(n) && n > 0 ? [n] : [];
}

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ flightId?: string | string[]; flightIds?: string | string[] }>;
}) {
  const sp = await searchParams;
  const flightIds = parseFlightIds(sp);

  return (
    <div>
      <PageHeading
        title="Book"
        description="Choose cabin class, pick a saved card, and confirm. Bookings are saved in PostgreSQL."
      />
      <BookingWizard flightIds={flightIds} />
    </div>
  );
}
