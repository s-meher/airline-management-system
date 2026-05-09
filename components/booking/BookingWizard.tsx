"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CabinClass } from "@/lib/models/types";
import { AIRPORTS } from "@/lib/data";
import { formatCurrency, formatDurationMinutes, formatUtcDate, formatUtcDateTime } from "@/lib/utils/format";
import { Card } from "@/components/ui/Card";
import { Button, ButtonLink } from "@/components/ui/Button";
import { SESSION_CHANGED_EVENT } from "@/components/account/SessionUser";
import type { DbCustomer } from "@/lib/db/customers";
import type { DbCreditCard } from "@/lib/db/creditCards";
import type { FlightLegWithFares } from "@/lib/db/flights";

type Step = "class" | "payment" | "confirm" | "success";

function getAirport(code: string) {
  return AIRPORTS.find((a) => a.airport_code === code);
}

type DbFare = { amount: number; currency_code: string };

function cardLabel(card: DbCreditCard) {
  return `${card.card_brand} •••• ${card.last_four} (exp ${String(card.exp_month).padStart(2, "0")}/${card.exp_year})`;
}

export function BookingWizard({ flightIds }: { flightIds: number[] }) {
  const [step, setStep] = useState<Step>("class");
  const [cabin_class, setCabinClass] = useState<CabinClass>("economy");
  const [credit_card_id, setCreditCardId] = useState<number | null>(null);
  const [createdBookingId, setCreatedBookingId] = useState<number | null>(null);
  const [activeCustomer, setActiveCustomer] = useState<DbCustomer | null>(null);
  const [cards, setCards] = useState<DbCreditCard[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [legs, setLegs] = useState<FlightLegWithFares[] | null>(null);
  const [legsError, setLegsError] = useState<string | null>(null);
  const [legsLoading, setLegsLoading] = useState(false);
  const [seatInventory, setSeatInventory] = useState<{
    economy: number;
    first: number;
  } | null>(null);

  const hasFlights = flightIds.length > 0;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadError(null);
      try {
        const activeRes = await fetch("/api/auth/me", { cache: "no-store" });
        const activeJson = (await activeRes.json().catch(() => null)) as
          | { customer: DbCustomer | null }
          | null;
        if (!activeRes.ok) throw new Error("Failed to load session.");

        if (cancelled) return;
        const cust = activeJson?.customer ?? null;
        setActiveCustomer(cust);

        if (!cust) {
          setCards([]);
          return;
        }

        const cardsRes = await fetch("/api/credit-cards", { cache: "no-store" });
        const cardsJson = (await cardsRes.json().catch(() => null)) as
          | { creditCards: DbCreditCard[] }
          | { errors: string[] }
          | null;

        if (!cardsRes.ok) {
          const msg =
            cardsJson && "errors" in cardsJson && cardsJson.errors?.[0]
              ? cardsJson.errors[0]
              : "Failed to load payment methods.";
          throw new Error(msg);
        }
        if (cancelled) return;
        setCards((cardsJson as { creditCards: DbCreditCard[] }).creditCards ?? []);
      } catch (e) {
        if (cancelled) return;
        setLoadError(e instanceof Error ? e.message : "Failed to load booking data.");
      }
    }
    void load();
    function onSession() {
      void load();
    }
    window.addEventListener(SESSION_CHANGED_EVENT, onSession);
    return () => {
      cancelled = true;
      window.removeEventListener(SESSION_CHANGED_EVENT, onSession);
    };
  }, []);

  useEffect(() => {
    if (!hasFlights) {
      queueMicrotask(() => {
        setLegs(null);
        setLegsError(null);
        setLegsLoading(false);
      });
      return;
    }
    let cancelled = false;
    void (async () => {
      setLegs(null);
      setLegsError(null);
      setLegsLoading(true);
      try {
        const res = await fetch(`/api/flights?ids=${flightIds.join(",")}`, { cache: "no-store" });
        const json = (await res.json().catch(() => null)) as
          | { flights: FlightLegWithFares[] }
          | { errors: string[] }
          | null;
        if (!res.ok) {
          const msg =
            json && "errors" in json && json.errors?.[0]
              ? json.errors[0]
              : "Failed to load flights.";
          throw new Error(msg);
        }
        if (cancelled) return;
        setLegs((json as { flights: FlightLegWithFares[] }).flights ?? []);
      } catch (e) {
        if (cancelled) return;
        setLegsError(e instanceof Error ? e.message : "Failed to load flights.");
        setLegs([]);
      } finally {
        if (!cancelled) setLegsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [flightIds, hasFlights]);

  const sumFareRow = useCallback(
    (get: (leg: FlightLegWithFares) => DbFare | null): DbFare | null => {
      if (!legs || legs.length === 0) return null;
      const parts: DbFare[] = [];
      for (const leg of legs) {
        const f = get(leg);
        if (!f) return null;
        parts.push(f);
      }
      const currency = parts[0]!.currency_code;
      for (const f of parts) {
        if (f.currency_code !== currency) return null;
      }
      return {
        amount: parts.reduce((s, f) => s + f.amount, 0),
        currency_code: currency,
      };
    },
    [legs],
  );

  const economyPrice = useMemo(
    () => sumFareRow((leg) => leg.fares.economy),
    [sumFareRow],
  );
  const firstPrice = useMemo(() => sumFareRow((leg) => leg.fares.first), [sumFareRow]);

  const chosenPrice: DbFare | null =
    cabin_class === "economy" ? economyPrice : firstPrice;

  const faresMissingInDb = Boolean(
    legs &&
      legs.length > 0 &&
      !legsLoading &&
      !legsError &&
      !economyPrice &&
      !firstPrice,
  );

  useEffect(() => {
    if (!legs || legs.length !== 1) {
      queueMicrotask(() => setSeatInventory(null));
      return;
    }
    let cancelled = false;
    const id = legs[0]!.flight_id;
    void (async () => {
      const res = await fetch(`/api/flights/${id}/prices`, { cache: "no-store" });
      const json = (await res.json().catch(() => null)) as {
        inventory?: { economy: { remaining: number }; first: { remaining: number } };
      } | null;
      if (cancelled || !json?.inventory) return;
      setSeatInventory({
        economy: json.inventory.economy.remaining,
        first: json.inventory.first.remaining,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [legs]);

  if (!hasFlights) {
    return (
      <Card className="p-8 text-center text-zinc-600 dark:text-zinc-400">
        <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Select flights to book
        </p>
        <p className="mt-2">
          Open this page from search results or flight details. The URL should include{" "}
          <span className="font-mono">?flightId=…</span> for a nonstop flight or{" "}
          <span className="font-mono">?flightIds=…</span> (comma-separated) for a connection.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/search" variant="primary" size="md">
            Back to search
          </ButtonLink>
        </div>
      </Card>
    );
  }

  const header = (
    <Card>
      <div className="space-y-4">
        {legs?.map((leg) => {
          const origin = getAirport(leg.origin_airport_code);
          const dest = getAirport(leg.destination_airport_code);
          return (
            <div
              key={leg.flight_id}
              className="flex flex-col gap-4 border-b border-zinc-200 pb-4 last:border-b-0 last:pb-0 dark:border-zinc-800"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {leg.airline_name} · {leg.iata_code}
                    {leg.flight_number}
                  </p>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {formatUtcDate(leg.scheduled_departure)} · {leg.origin_airport_code} ({origin?.city ?? "—"}) →{" "}
                    {leg.destination_airport_code} ({dest?.city ?? "—"})
                  </p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                    Departs {formatUtcDateTime(leg.scheduled_departure)} (UTC) · Arrives{" "}
                    {formatUtcDateTime(leg.scheduled_arrival)} (UTC) ·{" "}
                    {formatDurationMinutes(leg.duration_minutes)}
                  </p>
                </div>
                <ButtonLink href={`/search/${leg.flight_id}`} variant="secondary" size="sm">
                  View details
                </ButtonLink>
              </div>
            </div>
          );
        })}
        {legsLoading ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading flight details…</p>
        ) : null}
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      {header}

      {legsError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
          {legsError}
        </div>
      ) : null}
      {faresMissingInDb ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
          No fares for one of these flights in the database. From the project root run{" "}
          <span className="font-mono">npm run db:reset</span> so <span className="font-mono">flight_price</span> is
          seeded, then refresh this page.
        </div>
      ) : null}

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
                1) Active customer
              </p>
              {loadError ? (
                <p className="mt-2 text-xs text-rose-700 dark:text-rose-300">
                  {loadError}
                </p>
              ) : null}
              {!activeCustomer ? (
                <div className="mt-3 flex flex-col gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
                  <p>Sign in before booking.</p>
                  <ButtonLink href="/login" variant="secondary" size="sm">
                    Sign in
                  </ButtonLink>
                </div>
              ) : (
                <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
                  {activeCustomer.first_name} {activeCustomer.last_name} ·{" "}
                  <span className="text-zinc-600 dark:text-zinc-400">
                    {activeCustomer.email}
                  </span>
                </p>
              )}
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
                    {legsLoading
                      ? "Loading…"
                      : economyPrice
                        ? formatCurrency(economyPrice.amount, economyPrice.currency_code)
                        : "—"}
                  </p>
                  {seatInventory && legs?.length === 1 && cabin_class === "economy" ? (
                    <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                      {seatInventory.economy} seats left (economy)
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
                    {legsLoading
                      ? "Loading…"
                      : firstPrice
                        ? formatCurrency(firstPrice.amount, firstPrice.currency_code)
                        : "—"}
                  </p>
                  {seatInventory && legs?.length === 1 && cabin_class === "first" ? (
                    <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                      {seatInventory.first} seats left (first)
                    </p>
                  ) : null}
                </button>
              </div>
            </div>

            <div className="lg:col-span-2 flex justify-end">
              <Button
                type="button"
                disabled={
                  !activeCustomer ||
                  legsLoading ||
                  !legs ||
                  legs.length === 0 ||
                  faresMissingInDb ||
                  !chosenPrice
                }
                onClick={() => setStep("payment")}
              >
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

            {cards.length === 0 ? (
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-6 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-zinc-400">
                No saved cards for this customer yet. Add one in My Account.
              </div>
            ) : (
              <div className="grid gap-3">
                {cards.map((card) => (
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
              onClick={async () => {
                if (!credit_card_id || !chosenPrice) return;
                setSubmitting(true);
                try {
                  const res = await fetch("/api/bookings", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({
                      credit_card_id,
                      flight_ids: flightIds,
                      cabin_class,
                    }),
                  });
                  const json = (await res.json().catch(() => null)) as
                    | { booking_id: number }
                    | { errors: string[] }
                    | null;
                  if (!res.ok) {
                    const msg =
                      json && "errors" in json && json.errors?.[0]
                        ? json.errors[0]
                        : "Failed to create booking.";
                    alert(msg);
                    return;
                  }
                  const booking_id = (json as { booking_id: number }).booking_id;
                  setCreatedBookingId(booking_id);
                  setStep("success");
                } finally {
                  setSubmitting(false);
                }
              }}
              className="w-full"
            >
              {submitting ? "Booking…" : "Confirm and book"}
            </Button>

            <p className="text-xs text-zinc-500 dark:text-zinc-500">
              Bookings are stored in PostgreSQL. No payment processor is attached.
            </p>
          </div>
        ) : null}

        {step === "success" ? (
          <div className="mt-6 space-y-5">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-100">
              <p className="text-base font-semibold">Booking confirmed</p>
              <p className="mt-1 text-sm opacity-90">
                Your booking was stored in PostgreSQL.
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
