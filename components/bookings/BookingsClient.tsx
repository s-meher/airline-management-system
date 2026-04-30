"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { Booking, BookingFlight } from "@/lib/models/types";
import {
  BOOKINGS,
  BOOKING_FLIGHTS,
  airlineById,
  flightById,
  itineraryForBooking,
} from "@/lib/data";
import { useDemoBookings } from "@/lib/store/demoBookings";
import { formatCurrency, formatUtcDate } from "@/lib/utils/format";

type AnyBooking = Booking & { _source: "seed" | "demo" };

function legsForDemoBooking(booking_id: number, legs: BookingFlight[]) {
  return legs
    .filter((bf) => bf.booking_id === booking_id)
    .sort((a, b) => a.segment_number - b.segment_number)
    .map((bf) => {
      const flight = flightById.get(bf.flight_id);
      if (!flight) return null;
      return { bf, flight };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
}

export function BookingsClient() {
  const { state, clear } = useDemoBookings();

  const allBookings = useMemo<AnyBooking[]>(() => {
    const seed = BOOKINGS.map((b) => ({ ...b, _source: "seed" as const }));
    const demo = state.bookings.map((b) => ({ ...b, _source: "demo" as const }));
    return [...demo, ...seed].sort(
      (a, b) => new Date(b.booked_at).getTime() - new Date(a.booked_at).getTime(),
    );
  }, [state.bookings]);

  const totalSeedLegs = BOOKING_FLIGHTS.length;
  const totalDemoLegs = state.booking_flights.length;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Summary
            </p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {state.bookings.length} demo booking(s) stored locally ·{" "}
              {totalDemoLegs} demo leg(s) · {BOOKINGS.length} seeded booking(s) ·{" "}
              {totalSeedLegs} seeded leg(s)
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/search"
              className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              Search flights
            </Link>
            <button
              type="button"
              onClick={clear}
              className="inline-flex items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-800 transition hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200 dark:hover:bg-rose-950/50"
            >
              Clear demo bookings
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4">
        {allBookings.map((b) => {
          const isDemo = b._source === "demo";
          const legs = isDemo
            ? legsForDemoBooking(b.booking_id, state.booking_flights)
            : itineraryForBooking(b.booking_id).map((seg) => ({
                bf: {
                  booking_flight_id: seg.booking_flight_id,
                  booking_id: b.booking_id,
                  flight_id: seg.flight.flight_id,
                  segment_number: seg.segment_number,
                  cabin_class: seg.cabin_class,
                  fare_amount: seg.fare_amount,
                },
                flight: seg.flight,
              }));

          const firstLeg = legs[0]?.flight;
          const lastLeg = legs[legs.length - 1]?.flight;
          const route =
            firstLeg && lastLeg
              ? `${firstLeg.origin_airport_code} → ${lastLeg.destination_airport_code}`
              : "—";

          return (
            <article
              key={`${b._source}-${b.booking_id}`}
              className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    Booking #{b.booking_id}{" "}
                    <span className="ml-2 rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                      {isDemo ? "demo" : "seeded"}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {formatUtcDate(b.booked_at)} · {route} · {legs.length} segment
                    {legs.length === 1 ? "" : "s"}
                  </p>
                </div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {formatCurrency(b.total_amount, b.currency_code)}
                </p>
              </div>

              <div className="mt-5 grid gap-3">
                {legs.map(({ bf, flight }) => {
                  const airline = airlineById.get(flight.airline_id);
                  return (
                    <div
                      key={bf.booking_flight_id}
                      className="rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/20"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                          Segment {bf.segment_number}:{" "}
                          {(airline?.iata_code ?? "?") + flight.flight_number} ·{" "}
                          {flight.origin_airport_code} →{" "}
                          {flight.destination_airport_code}
                        </p>
                        <p className="text-sm text-zinc-700 dark:text-zinc-300">
                          {bf.cabin_class === "economy" ? "Economy" : "First"} ·{" "}
                          {formatCurrency(bf.fare_amount, b.currency_code)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}

