import Link from "next/link";
import type { Metadata } from "next";
import { PageHeading } from "@/components/layout/PageHeading";
import { listAirports } from "@/lib/db/catalog";
import { getFlightById } from "@/lib/db/flights";
import { getCabinAvailabilityPublic } from "@/lib/db/inventory";
import { faresForFlightId } from "@/lib/db/search";
import {
  formatCurrency,
  formatUtcDate,
  formatDurationMinutes,
  formatUtcDateTime,
} from "@/lib/utils/format";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Flight details",
};

export default async function FlightDetailsPage({
  params,
}: {
  params: Promise<{ flightId: string }>;
}) {
  const { flightId: flightIdParam } = await params;
  const flightId = Number(flightIdParam);
  const [flight, airports] = await Promise.all([
    Number.isFinite(flightId) ? getFlightById(flightId) : Promise.resolve(null),
    listAirports(),
  ]);

  const airportByCode = new Map(airports.map((a) => [a.airport_code, a]));

  if (!flight) {
    return (
      <div className="space-y-6">
        <PageHeading
          title="Flight not found"
          description="This flight ID is not in the database."
        />
        <Link
          href="/search"
          className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
        >
          Back to search
        </Link>
      </div>
    );
  }

  const [fares, inv] = await Promise.all([
    faresForFlightId(flight.flight_id),
    getCabinAvailabilityPublic(flight.flight_id),
  ]);
  const { economy, first } = fares;
  const origin = airportByCode.get(flight.origin_airport_code);
  const dest = airportByCode.get(flight.destination_airport_code);
  const econInv = inv?.economy ?? { total: 1, booked: 0, remaining: 0 };
  const firstInv = inv?.first ?? { total: 1, booked: 0, remaining: 0 };

  return (
    <div className="space-y-6">
      <PageHeading
        title="Flight details"
        description={`${formatUtcDate(flight.scheduled_departure)} · ${flight.origin_airport_code} → ${flight.destination_airport_code}`}
      />

      <Card className="p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {flight.airline_name} · {flight.iata_code}
              {flight.flight_number}
            </p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {flight.origin_airport_code} ({origin?.city ?? "—"}) →{" "}
              {flight.destination_airport_code} ({dest?.city ?? "—"})
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <ButtonLink href="/search" variant="secondary" size="sm">
              Back
            </ButtonLink>
            <ButtonLink href={`/book?flightId=${flight.flight_id}`} variant="primary" size="sm">
              Book this flight
            </ButtonLink>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/20">
            <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              Departure
            </p>
            <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {formatUtcDateTime(flight.scheduled_departure)} (UTC)
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/20">
            <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              Arrival
            </p>
            <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {formatUtcDateTime(flight.scheduled_arrival)} (UTC)
            </p>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
              Duration · {formatDurationMinutes(flight.duration_minutes)}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/20">
            <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              Prices
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950">
                <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Economy
                </p>
                <p className="mt-0.5 font-semibold text-zinc-900 dark:text-zinc-50">
                  {economy
                    ? formatCurrency(economy.amount, economy.currency_code)
                    : "—"}
                </p>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950">
                <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  First
                </p>
                <p className="mt-0.5 font-semibold text-zinc-900 dark:text-zinc-50">
                  {first ? formatCurrency(first.amount, first.currency_code) : "—"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/20">
            <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              Seat inventory
            </p>
            <div className="mt-2 space-y-3 text-sm">
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Economy
                  </p>
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-50">
                    {econInv.remaining}/{econInv.total}
                  </p>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <div
                    className="h-2 rounded-full bg-sky-600"
                    style={{
                      width: `${Math.max(
                        3,
                        Math.round((econInv.remaining / Math.max(1, econInv.total)) * 100),
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    First
                  </p>
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-50">
                    {firstInv.remaining}/{firstInv.total}
                  </p>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <div
                    className="h-2 rounded-full bg-emerald-600"
                    style={{
                      width: `${Math.max(
                        8,
                        Math.round((firstInv.remaining / Math.max(1, firstInv.total)) * 100),
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
