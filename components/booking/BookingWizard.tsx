"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { CabinClass, CreditCard, Customer, Flight, FlightPrice } from "@/lib/models/types";
import {
  AIRLINES,
  AIRPORTS,
  CREDIT_CARDS,
  CUSTOMERS,
  FLIGHT_PRICES,
  FLIGHTS,
} from "@/lib/data";
import { formatCurrency, formatDurationMinutes, formatUtcDate, formatUtcDateTime } from "@/lib/utils/format";
import { getSeatCapacitySummary } from "@/lib/utils/mockSeats";
import { useDemoBookings } from "@/lib/store/demoBookings";
import { Card } from "@/components/ui/Card";
import { Button, ButtonLink } from "@/components/ui/Button";
import { FieldLabel, SelectInput } from "@/components/ui/Field";

type Step = "class" | "payment" | "confirm" | "success";

function getFlight(flightId: number): Flight | undefined {
  return FLIGHTS.find((f) => f.flight_id === flightId);
}

function getAirline(airline_id: number) {
  return AIRLINES.find((a) => a.airline_id === airline_id);
}

function getAirport(code: string) {
  return AIRPORTS.find((a) => a.airport_code === code);
}

function getPrice(flight_id: number, cabin_class: CabinClass): FlightPrice | undefined {
  return FLIGHT_PRICES.find(
    (p) => p.flight_id === flight_id && p.cabin_class === cabin_class,
  );
}

function customerLabel(c: Customer) {
  return `${c.first_name} ${c.last_name}`;
}

function cardLabel(card: CreditCard) {
  return `${card.card_brand} •••• ${card.last_four} (exp ${String(card.exp_month).padStart(2, "0")}/${card.exp_year})`;
}

export function BookingWizard({ flightId }: { flightId: number }) {
  const { createBooking } = useDemoBookings();

  const flight = Number.isFinite(flightId) ? getFlight(flightId) : undefined;

  const [step, setStep] = useState<Step>("class");
  const [customer_id, setCustomerId] = useState<number>(CUSTOMERS[0]?.customer_id ?? 1);
  const [cabin_class, setCabinClass] = useState<CabinClass>("economy");
  const [credit_card_id, setCreditCardId] = useState<number | null>(null);
  const [createdBookingId, setCreatedBookingId] = useState<number | null>(null);

  const availableCards = useMemo(() => {
    return CREDIT_CARDS.filter((c) => c.customer_id === customer_id);
  }, [customer_id]);

  const economy = flight ? getPrice(flight.flight_id, "economy") : undefined;
  const first = flight ? getPrice(flight.flight_id, "first") : undefined;

  const chosenPrice = flight ? getPrice(flight.flight_id, cabin_class) : undefined;
  const seats = flight ? getSeatCapacitySummary(flight.flight_id) : null;

  if (!flight) {
    return (
      <Card className="p-8 text-center text-zinc-600 dark:text-zinc-400">
        <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Select a flight to book
        </p>
        <p className="mt-2">
          This page expects a <span className="font-mono">flightId</span> query
          parameter.
        </p>
        <div className="mt-6 flex justify-center">
          <ButtonLink href="/search" variant="primary" size="md">
          Back to search
          </ButtonLink>
        </div>
      </Card>
    );
  }

  const airline = getAirline(flight.airline_id);
  const origin = getAirport(flight.origin_airport_code);
  const dest = getAirport(flight.destination_airport_code);

  const header = (
    <Card>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {airline?.airline_name ?? "Airline"} ·{" "}
            {(airline?.iata_code ?? "?") + flight.flight_number}
          </p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {formatUtcDate(flight.scheduled_departure)} · {flight.origin_airport_code} ({origin?.city ?? "—"}) →{" "}
            {flight.destination_airport_code} ({dest?.city ?? "—"})
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
            Departs {formatUtcDateTime(flight.scheduled_departure)} (UTC) · Arrives{" "}
            {formatUtcDateTime(flight.scheduled_arrival)} (UTC) ·{" "}
            {formatDurationMinutes(flight.duration_minutes)}
          </p>
        </div>

        <ButtonLink href={`/search/${flight.flight_id}`} variant="secondary" size="sm">
          View details
        </ButtonLink>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      {header}

      <Card>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Booking flow
          </h2>
          <div className="text-xs text-zinc-500 dark:text-zinc-500">
            Step {step === "class" ? "1" : step === "payment" ? "2" : step === "confirm" ? "3" : "✓"} of 3
          </div>
        </div>

        {step === "class" ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                1) Choose customer (demo)
              </p>
              <SelectInput
                value={customer_id}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setCustomerId(next);
                  setCreditCardId(null);
                }}
              >
                {CUSTOMERS.map((c) => (
                  <option key={c.customer_id} value={c.customer_id}>
                    {customerLabel(c)}
                  </option>
                ))}
              </SelectInput>
              <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                No auth yet — this is a demo selector.
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                2) Choose cabin class
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setCabinClass("economy")}
                  className={`rounded-2xl border p-4 text-left transition ${
                    cabin_class === "economy"
                      ? "border-sky-300 bg-sky-50 ring-2 ring-sky-200 dark:border-sky-900/60 dark:bg-sky-950/30 dark:ring-sky-900/40"
                      : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-800"
                  }`}
                >
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    Economy
                  </p>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {economy
                      ? formatCurrency(economy.amount, economy.currency_code)
                      : "—"}
                  </p>
                  {seats ? (
                    <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                      {seats.economy_remaining} seats left (demo)
                    </p>
                  ) : null}
                </button>

                <button
                  type="button"
                  onClick={() => setCabinClass("first")}
                  className={`rounded-2xl border p-4 text-left transition ${
                    cabin_class === "first"
                      ? "border-sky-300 bg-sky-50 ring-2 ring-sky-200 dark:border-sky-900/60 dark:bg-sky-950/30 dark:ring-sky-900/40"
                      : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-800"
                  }`}
                >
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    First
                  </p>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {first ? formatCurrency(first.amount, first.currency_code) : "—"}
                  </p>
                  {seats ? (
                    <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                      {seats.first_remaining} seats left (demo)
                    </p>
                  ) : null}
                </button>
              </div>
            </div>

            <div className="lg:col-span-2 flex justify-end">
              <Button type="button" onClick={() => setStep("payment")}>
                Continue
              </Button>
            </div>
          </div>
        ) : null}

        {step === "payment" ? (
          <div className="mt-6 space-y-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                3) Select a saved payment method
              </p>
              <Button
                type="button"
                onClick={() => setStep("class")}
                variant="link"
                size="sm"
              >
                Back
              </Button>
            </div>

            {availableCards.length === 0 ? (
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-6 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-zinc-400">
                No saved cards for this customer in mock data.
              </div>
            ) : (
              <div className="grid gap-3">
                {availableCards.map((card) => (
                  <label
                    key={card.credit_card_id}
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                      credit_card_id === card.credit_card_id
                        ? "border-sky-300 bg-sky-50 ring-2 ring-sky-200 dark:border-sky-900/60 dark:bg-sky-950/30 dark:ring-sky-900/40"
                        : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <input
                      type="radio"
                      name="card"
                      className="mt-1"
                      checked={credit_card_id === card.credit_card_id}
                      onChange={() => setCreditCardId(card.credit_card_id)}
                    />
                    <div>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        {cardLabel(card)}
                      </p>
                      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                        Billing address id {card.billing_address_id}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Total:{" "}
                <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                  {chosenPrice
                    ? formatCurrency(chosenPrice.amount, chosenPrice.currency_code)
                    : "—"}
                </span>
              </p>
              <Button
                type="button"
                disabled={!credit_card_id || !chosenPrice}
                onClick={() => setStep("confirm")}
                className=""
              >
                Continue
              </Button>
            </div>
          </div>
        ) : null}

        {step === "confirm" ? (
          <div className="mt-6 space-y-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                4) Confirm booking
              </p>
              <Button
                type="button"
                onClick={() => setStep("payment")}
                variant="link"
                size="sm"
              >
                Back
              </Button>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-5 dark:border-zinc-800 dark:bg-zinc-950/20">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                    Cabin
                  </p>
                  <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {cabin_class === "economy" ? "Economy" : "First"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                    Total
                  </p>
                  <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {chosenPrice
                      ? formatCurrency(chosenPrice.amount, chosenPrice.currency_code)
                      : "—"}
                  </p>
                </div>
              </div>
            </div>

            <Button
              type="button"
              disabled={!credit_card_id || !chosenPrice}
              onClick={() => {
                if (!credit_card_id || !chosenPrice) return;
                const created = createBooking({
                  customer_id,
                  credit_card_id,
                  flight_id: flight.flight_id,
                  cabin_class,
                  fare_amount: chosenPrice.amount,
                  currency_code: chosenPrice.currency_code,
                });
                setCreatedBookingId(created.booking_id);
                setStep("success");
              }}
              className="w-full"
            >
              Confirm and book
            </Button>

            <p className="text-xs text-zinc-500 dark:text-zinc-500">
              This is a mock flow: no authentication and no real payment processing.
            </p>
          </div>
        ) : null}

        {step === "success" ? (
          <div className="mt-6 space-y-5">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-100">
              <p className="text-base font-semibold">Booking confirmed</p>
              <p className="mt-1 text-sm opacity-90">
                Your booking was stored in local demo state.
              </p>
              {createdBookingId ? (
                <p className="mt-3 text-sm font-semibold">
                  Booking #{createdBookingId}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/bookings" variant="primary" size="md">
                Go to bookings
              </ButtonLink>
              <ButtonLink href="/search" variant="secondary" size="md">
                Search more flights
              </ButtonLink>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
