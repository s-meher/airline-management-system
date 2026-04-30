import { HeroSection } from "@/components/home/HeroSection";
import { FlightPreviewList } from "@/components/home/FlightPreviewList";
import { SummaryCard } from "@/components/home/SummaryCard";
import { AIRPORTS, BOOKINGS, FLIGHTS, itineraryForBooking } from "@/lib/data";
import { formatCurrency } from "@/lib/utils/format";

export default function HomePage() {
  const activeBookings = BOOKINGS.filter((b) => b.booking_status === "confirmed");
  const sampleFlights = [...FLIGHTS]
    .sort(
      (a, b) =>
        new Date(a.scheduled_departure).getTime() -
        new Date(b.scheduled_departure).getTime(),
    )
    .slice(0, 4);

  const recentBookings = [...activeBookings]
    .sort(
      (a, b) => new Date(b.booked_at).getTime() - new Date(a.booked_at).getTime(),
    )
    .slice(0, 2);

  return (
    <div className="space-y-10 md:space-y-12">
      <HeroSection />

      <section className="grid gap-6 lg:grid-cols-3">
        <SummaryCard
          title="Available flights"
          value={String(FLIGHTS.length)}
          description="Mock schedule across ORD, JFK, and SFO. Times shown in UTC."
          href="/search"
          hrefLabel="Search"
        >
          <FlightPreviewList flights={sampleFlights} />
        </SummaryCard>

        <SummaryCard
          title="Supported airports"
          value={String(AIRPORTS.length)}
          description="Demo hubs with realistic city/region metadata."
        >
          <div className="flex flex-wrap gap-2">
            {AIRPORTS.map((a) => (
              <span
                key={a.airport_code}
                className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm font-semibold text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
              >
                <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-xs text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100">
                  {a.airport_code}
                </span>
                <span className="text-zinc-600 dark:text-zinc-400">
                  {a.city}, {a.region}
                </span>
              </span>
            ))}
          </div>
        </SummaryCard>

        <SummaryCard
          title="Active bookings"
          value={String(activeBookings.length)}
          description="Each booking can include multiple flight segments."
          href="/bookings"
          hrefLabel="Manage"
        >
          <ul className="space-y-3">
            {recentBookings.map((b) => {
              const legs = itineraryForBooking(b.booking_id);
              return (
                <li
                  key={b.booking_id}
                  className="rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/20"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        Booking #{b.booking_id}
                      </p>
                      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                        {legs.length} segment{legs.length === 1 ? "" : "s"} ·{" "}
                        {legs[0]?.flight.origin_airport_code} →{" "}
                        {legs[legs.length - 1]?.flight.destination_airport_code}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      {formatCurrency(b.total_amount, b.currency_code)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </SummaryCard>
      </section>
    </div>
  );
}
