"use client";

import { useEffect, useMemo, useState } from "react";
import type { BookingStatus } from "@/lib/models/types";
import type { DbBookingWithLegs } from "@/lib/db/bookings";
import { formatCurrency, formatUtcDate } from "@/lib/utils/format";
import { Card } from "@/components/ui/Card";
import { SESSION_CHANGED_EVENT } from "@/components/account/SessionUser";
import { Button, ButtonLink } from "@/components/ui/Button";

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
  const [state, setState] = useState<
    | { kind: "loading" }
    | { kind: "error"; message: string }
    | { kind: "ready"; bookings: DbBookingWithLegs[] }
  >({ kind: "loading" });

  const [saving, setSaving] = useState(false);

  async function load() {
    setState({ kind: "loading" });
    try {
      const res = await fetch("/api/bookings", { cache: "no-store" });
      const json = (await res.json().catch(() => null)) as
        | { bookings: DbBookingWithLegs[] }
        | { errors: string[] }
        | null;
      if (!res.ok) {
        const msg =
          json && "errors" in json && json.errors?.[0]
            ? json.errors[0]
            : "Failed to load bookings.";
        setState({ kind: "error", message: msg });
        return;
      }
      setState({ kind: "ready", bookings: (json as any).bookings ?? [] });
    } catch (e) {
      setState({
        kind: "error",
        message: e instanceof Error ? e.message : "Failed to load bookings.",
      });
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    function onChanged() {
      void load();
    }
    window.addEventListener(SESSION_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(SESSION_CHANGED_EVENT, onChanged);
  }, []);

  const bookings = useMemo(
    () => (state.kind === "ready" ? state.bookings : []),
    [state],
  );

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Summary
            </p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Bookings are loaded from PostgreSQL for your signed-in account.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ButtonLink href="/search" variant="secondary" size="sm">
              Search flights
            </ButtonLink>
          </div>
        </div>
      </Card>

      <section className="grid gap-4">
        {state.kind === "error" ? (
          <Card className="p-8 text-center text-rose-700 dark:text-rose-300">
            {state.message}
          </Card>
        ) : null}

        {state.kind === "ready" && bookings.length === 0 ? (
          <Card className="p-8 text-center text-zinc-600 dark:text-zinc-400">
            No bookings for this customer yet. Try searching flights and booking one.
          </Card>
        ) : null}

        {state.kind === "ready"
          ? bookings.map((b) => {
          const legs = b.legs ?? [];
          const firstLeg = legs[0];
          const lastLeg = legs[legs.length - 1];
          const route =
            firstLeg && lastLeg
              ? `${firstLeg.origin_airport_code} → ${lastLeg.destination_airport_code}`
              : "—";

          const paymentSummary = b.payment
            ? `${b.payment.card_brand} •••• ${b.payment.last_four} (exp ${String(
                b.payment.exp_month,
              ).padStart(2, "0")}/${b.payment.exp_year})`
            : "Payment method unavailable";

          return (
            <Card
              key={b.booking_id}
              className="p-6"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    Booking #{b.booking_id}
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
                      {paymentSummary}
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
                    onClick={async () => {
                      setSaving(true);
                      try {
                        const res = await fetch(`/api/bookings/${b.booking_id}/cancel`, {
                          method: "POST",
                        });
                        if (!res.ok) {
                          const json = (await res.json().catch(() => null)) as { errors?: string[] } | null;
                          alert(json?.errors?.[0] ?? "Failed to cancel booking.");
                        }
                        await load();
                      } finally {
                        setSaving(false);
                      }
                    }}
                    variant="secondary"
                    size="sm"
                  >
                    Cancel booking
                  </Button>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                {legs.map((leg) => {
                  return (
                    <div
                      key={leg.booking_flight_id}
                      className="rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/20"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                          Segment {leg.segment_number}:{" "}
                          {(leg.airline_iata_code ?? "?") + leg.flight_number} ·{" "}
                          {leg.origin_airport_code} → {leg.destination_airport_code}
                        </p>
                        <p className="text-sm text-zinc-700 dark:text-zinc-300">
                          {leg.cabin_class === "economy" ? "Economy" : "First"} ·{" "}
                          {formatCurrency(leg.fare_amount, b.currency_code)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        }) : null}
      </section>
    </div>
  );
}

