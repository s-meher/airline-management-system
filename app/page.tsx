import { FlightPreviewList } from "@/components/home/FlightPreviewList";
import { HeroSection } from "@/components/home/HeroSection";
import { SummaryCard } from "@/components/home/SummaryCard";
import { loadHomePageModel } from "@/lib/home/loadHomePage";
import { formatCurrency } from "@/lib/utils/format";

export default async function HomePage() {
  const home = await loadHomePageModel();

  const airportsBlurb =
    home.dataSource === "database"
      ? "Airports from PostgreSQL with city and region metadata."
      : "Hub airports from seed fixtures with city and region metadata.";

  const bookingsBlurb =
    home.dataSource === "database"
      ? "Confirmed bookings stored in PostgreSQL. Sign in to manage yours."
      : "Sample confirmed bookings from fixtures. Sign in after connecting the database.";

  return (
    <div className="space-y-10 md:space-y-12">
      <HeroSection />

      <section className="grid gap-6 lg:grid-cols-3">
        <SummaryCard
          title="Available flights"
          value={String(home.flightCount)}
          description={home.flightsCardDescription}
          href="/search"
          hrefLabel="Search"
        >
          <FlightPreviewList
            flights={home.sampleFlights}
            airlineById={home.airlineById}
            airportByCode={home.airportByCode}
          />
        </SummaryCard>

        <SummaryCard title="Supported airports" value={String(home.airportCount)} description={airportsBlurb}>
          <div className="flex flex-wrap gap-2">
            {home.airportsList.map((a) => (
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
          value={String(home.bookingCount)}
          description={bookingsBlurb}
          href="/bookings"
          hrefLabel="Manage"
        >
          <ul className="space-y-3">
            {home.recentBookings.map((b) => (
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
                      {b.segment_count} segment{b.segment_count === 1 ? "" : "s"} ·{" "}
                      {b.origin_airport_code} → {b.destination_airport_code}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {formatCurrency(b.total_amount, b.currency_code)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </SummaryCard>
      </section>
    </div>
  );
}
