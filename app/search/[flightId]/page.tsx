import Link from "next/link";
import type { Metadata } from "next";
import { PageHeading } from "@/components/layout/PageHeading";
import { AIRLINES, AIRPORTS, FLIGHT_PRICES, FLIGHTS } from "@/lib/data";
import {
  formatCurrency,
  formatUtcDate,
  formatDurationMinutes,
  formatUtcDateTime,
} from "@/lib/utils/format";
import { getSeatCapacitySummary } from "@/lib/utils/mockSeats";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Flight details",
};

function getFlight(flightId: number) {
  return FLIGHTS.find((f) => f.flight_id === flightId);
}

function getAirline(airline_id: number) {
  return AIRLINES.find((a) => a.airline_id === airline_id);
}

function getAirport(code: string) {
  return AIRPORTS.find((a) => a.airport_code === code);
}

function getPrices(flight_id: number) {
  const economy = FLIGHT_PRICES.find(
    (p) => p.flight_id === flight_id && p.cabin_class === "economy",
  );
  const first = FLIGHT_PRICES.find(
    (p) => p.flight_id === flight_id && p.cabin_class === "first",
  );
  return { economy, first };
}

export default function FlightDetailsPage({
  params,
}: {
  params: { flightId: string };
}) {
  const flightId = Number(params.flightId);
  const flight = Number.isFinite(flightId) ? getFlight(flightId) : undefined;

  if (!flight) {
    return (
      <div className="space-y-6">
        <PageHeading
          title="Flight not found"
          description="This flight ID doesn’t exist in the mock schedule."
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

  const airline = getAirline(flight.airline_id);
  const origin = getAirport(flight.origin_airport_code);
  const dest = getAirport(flight.destination_airport_code);
  const { economy, first } = getPrices(flight.flight_id);
  const seats = getSeatCapacitySummary(flight.flight_id);

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
              {airline?.airline_name ?? "Airline"} ·{" "}
              {(airline?.iata_code ?? "?") + flight.flight_number}
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
                  {first
                    ? formatCurrency(first.amount, first.currency_code)
                    : "—"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/20">
            <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              Seats (demo)
            </p>
            <div className="mt-2 space-y-3 text-sm">
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Economy
                  </p>
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-50">
                    {seats.economy_remaining}/{seats.economy_capacity}
                  </p>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <div
                    className="h-2 rounded-full bg-sky-600"
                    style={{
                      width: `${Math.max(
                        3,
                        Math.round(
                          (seats.economy_remaining / seats.economy_capacity) *
                            100,
                        ),
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
                    {seats.first_remaining}/{seats.first_capacity}
                  </p>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <div
                    className="h-2 rounded-full bg-emerald-600"
                    style={{
                      width: `${Math.max(
                        8,
                        Math.round(
                          (seats.first_remaining / seats.first_capacity) * 100,
                        ),
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

