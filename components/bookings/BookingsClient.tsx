"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Booking, BookingFlight, BookingStatus, CreditCard } from "@/lib/models/types";
import {
  BOOKINGS,
  BOOKING_FLIGHTS,
  CREDIT_CARDS,
  CUSTOMERS,
  airlineById,
  flightById,
  itineraryForBooking,
} from "@/lib/data";
import { useDemoBookings } from "@/lib/store/demoBookings";
import { formatCurrency, formatUtcDate } from "@/lib/utils/format";
import { Card } from "@/components/ui/Card";
import { Button, ButtonLink } from "@/components/ui/Button";
import { FieldLabel, SelectInput } from "@/components/ui/Field";

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

function cardById() {
  const map = new Map<number, CreditCard>();
  for (const c of CREDIT_CARDS) map.set(c.credit_card_id, c);
  return map;
}

function paymentSummary(card?: CreditCard) {
  if (!card) return "Payment method unavailable";
  return `${card.card_brand} •••• ${card.last_four} (exp ${String(card.exp_month).padStart(2, "0")}/${card.exp_year})`;
}

function statusStyles(status: BookingStatus) {
  if (status === "confirmed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-100";
  }
  if (status === "cancelled") {
    return "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300";
  }
  return "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100";
}

export function BookingsClient() {
  const { state, clear, cancelBooking } = useDemoBookings();
  const [customerId, setCustomerId] = useState<number>(CUSTOMERS[0]?.customer_id ?? 1);

  const allBookings = useMemo<AnyBooking[]>(() => {
    const seed = BOOKINGS.map((b) => ({ ...b, _source: "seed" as const }));
    const demo = state.bookings.map((b) => ({ ...b, _source: "demo" as const }));
    const merged = [...demo, ...seed]
      .map((b) => {
        if (b._source === "seed" && state.cancelled_seed_booking_ids.includes(b.booking_id)) {
          return { ...b, booking_status: "cancelled" as const };
        }
        return b;
      })
      .filter((b) => b.customer_id === customerId);

    return merged.sort(
      (a, b) => new Date(b.booked_at).getTime() - new Date(a.booked_at).getTime(),
    );
  }, [customerId, state.bookings, state.cancelled_seed_booking_ids]);

  const totalSeedLegs = BOOKING_FLIGHTS.length;
  const totalDemoLegs = state.booking_flights.length;
  const cards = useMemo(() => cardById(), []);

  return (
    <div className="space-y-6">
      <Card>
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
            <div className="mt-4">
              <label className="block sm:max-w-xs">
                <FieldLabel>Current customer (demo)</FieldLabel>
                <SelectInput
                  value={customerId}
                  onChange={(e) => setCustomerId(Number(e.target.value))}
                >
                  {CUSTOMERS.map((c) => (
                    <option key={c.customer_id} value={c.customer_id}>
                      {c.first_name} {c.last_name}
                    </option>
                  ))}
                </SelectInput>
              </label>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <ButtonLink href="/search" variant="secondary" size="sm">
              Search flights
            </ButtonLink>
            <Button
              type="button"
              onClick={clear}
              variant="danger"
              size="sm"
            >
              Clear demo bookings
            </Button>
          </div>
        </div>
      </Card>

      <section className="grid gap-4">
        {allBookings.length === 0 ? (
          <Card className="p-8 text-center text-zinc-600 dark:text-zinc-400">
            No bookings for this customer yet. Try searching flights and booking one.
          </Card>
        ) : null}

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

          const card = cards.get(b.credit_card_id);

          return (
            <Card
              key={`${b._source}-${b.booking_id}`}
              className="p-6"
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
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${statusStyles(
                        b.booking_status,
                      )}`}
                    >
                      {b.booking_status}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-500">
                      {paymentSummary(card)}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {formatCurrency(b.total_amount, b.currency_code)}
                  </p>
                  <Button
                    type="button"
                    disabled={b.booking_status !== "confirmed"}
                    onClick={() => cancelBooking(b.booking_id)}
                    variant="secondary"
                    size="sm"
                  >
                    Cancel booking
                  </Button>
                </div>
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
            </Card>
          );
        })}
      </section>
    </div>
  );
}

