"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type {
  Airline,
  Airport,
  CabinClass,
  Flight,
  FlightPrice,
} from "@/lib/data";
import {
  formatCurrency,
  formatDurationMinutes,
  formatUtcDateTime,
} from "@/lib/utils/format";

type CabinFilter = "any" | CabinClass;

export interface SearchFlightsClientProps {
  airports: readonly Airport[];
  airlines: readonly Airline[];
  flights: readonly Flight[];
  flight_prices: readonly FlightPrice[];
}

interface SearchCriteria {
  origin_airport_code: string;
  destination_airport_code: string;
  travel_date: string; // yyyy-mm-dd
  cabin_class: CabinFilter;
}

function isoToUtcDateOnly(iso: string) {
  return iso.slice(0, 10);
}

function buildPriceIndex(flight_prices: readonly FlightPrice[]) {
  const map = new Map<number, Partial<Record<CabinClass, FlightPrice>>>();
  for (const fp of flight_prices) {
    const slot = map.get(fp.flight_id) ?? {};
    slot[fp.cabin_class] = fp;
    map.set(fp.flight_id, slot);
  }
  return map;
}

function buildAirlineIndex(airlines: readonly Airline[]) {
  const map = new Map<number, Airline>();
  for (const a of airlines) map.set(a.airline_id, a);
  return map;
}

function buildAirportIndex(airports: readonly Airport[]) {
  const map = new Map<string, Airport>();
  for (const a of airports) map.set(a.airport_code, a);
  return map;
}

function validate(criteria: SearchCriteria) {
  const errors: string[] = [];
  if (!criteria.origin_airport_code) errors.push("Select a departure airport.");
  if (!criteria.destination_airport_code)
    errors.push("Select a destination airport.");
  if (
    criteria.origin_airport_code &&
    criteria.destination_airport_code &&
    criteria.origin_airport_code === criteria.destination_airport_code
  ) {
    errors.push("Departure and destination cannot be the same.");
  }
  if (!criteria.travel_date) errors.push("Select a travel date.");
  return errors;
}

export function SearchFlightsClient({
  airports,
  airlines,
  flights,
  flight_prices,
}: SearchFlightsClientProps) {
  const airportByCode = useMemo(() => buildAirportIndex(airports), [airports]);
  const airlineById = useMemo(() => buildAirlineIndex(airlines), [airlines]);
  const pricesByFlightId = useMemo(
    () => buildPriceIndex(flight_prices),
    [flight_prices],
  );

  const [form, setForm] = useState<SearchCriteria>({
    origin_airport_code: "",
    destination_airport_code: "",
    travel_date: "",
    cabin_class: "any",
  });

  const [submitted, setSubmitted] = useState<SearchCriteria | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const results = useMemo(() => {
    if (!submitted) return [];

    const out = flights
      .filter((f) => {
        if (f.origin_airport_code !== submitted.origin_airport_code) return false;
        if (f.destination_airport_code !== submitted.destination_airport_code)
          return false;
        if (isoToUtcDateOnly(f.scheduled_departure) !== submitted.travel_date)
          return false;
        return true;
      })
      .sort(
        (a, b) =>
          new Date(a.scheduled_departure).getTime() -
          new Date(b.scheduled_departure).getTime(),
      )
      .map((f) => {
        const prices = pricesByFlightId.get(f.flight_id) ?? {};
        return {
          flight: f,
          economy: prices.economy,
          first: prices.first,
        };
      })
      .filter((row) => {
        if (submitted.cabin_class === "any") return true;
        return submitted.cabin_class === "economy"
          ? Boolean(row.economy)
          : Boolean(row.first);
      });

    return out;
  }, [flights, pricesByFlightId, submitted]);

  const summaryText = submitted
    ? `${submitted.origin_airport_code} → ${submitted.destination_airport_code} · ${submitted.travel_date}`
    : "Choose airports and a date to see flights.";

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              Find flights
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {summaryText}
            </p>
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-500">
            Mock schedule · UTC times
          </div>
        </div>

        <form
          className="mt-6 grid gap-4 md:grid-cols-5"
          onSubmit={(e) => {
            e.preventDefault();
            const nextErrors = validate(form);
            setErrors(nextErrors);
            if (nextErrors.length > 0) return;
            setSubmitted(form);
          }}
        >
          <label className="md:col-span-2">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Departure
            </span>
            <select
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-sky-700 dark:focus:ring-sky-900/40"
              value={form.origin_airport_code}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  origin_airport_code: e.target.value,
                }))
              }
            >
              <option value="">Select airport</option>
              {airports.map((a) => (
                <option key={a.airport_code} value={a.airport_code}>
                  {a.airport_code} · {a.city}
                </option>
              ))}
            </select>
          </label>

          <label className="md:col-span-2">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Destination
            </span>
            <select
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-sky-700 dark:focus:ring-sky-900/40"
              value={form.destination_airport_code}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  destination_airport_code: e.target.value,
                }))
              }
            >
              <option value="">Select airport</option>
              {airports.map((a) => (
                <option key={a.airport_code} value={a.airport_code}>
                  {a.airport_code} · {a.city}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Date
            </span>
            <input
              type="date"
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-sky-700 dark:focus:ring-sky-900/40"
              value={form.travel_date}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, travel_date: e.target.value }))
              }
            />
          </label>

          <label className="md:col-span-2">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Class (optional)
            </span>
            <select
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-sky-700 dark:focus:ring-sky-900/40"
              value={form.cabin_class}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  cabin_class: e.target.value as CabinFilter,
                }))
              }
            >
              <option value="any">Any</option>
              <option value="economy">Economy</option>
              <option value="first">First</option>
            </select>
          </label>

          <div className="md:col-span-3">
            {errors.length > 0 ? (
              <ul className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
                {errors.map((err) => (
                  <li key={err}>{err}</li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="md:col-span-2 md:flex md:justify-end">
            <button
              type="submit"
              className="w-full rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-sky-600/20 transition hover:bg-sky-700 md:w-auto"
            >
              Search
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Results
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {submitted ? `${results.length} found` : "—"}
          </p>
        </div>

        {submitted && results.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            No flights found for that route and date.
          </div>
        ) : null}

        <div className="grid gap-4">
          {results.map(({ flight, economy, first }) => {
            const airline = airlineById.get(flight.airline_id);
            const origin = airportByCode.get(flight.origin_airport_code);
            const dest = airportByCode.get(flight.destination_airport_code);

            return (
              <article
                key={flight.flight_id}
                className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
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

                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    <Link
                      href={`/search/${flight.flight_id}`}
                      className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-800"
                    >
                      View details
                    </Link>
                    <Link
                      href="/bookings"
                      className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
                    >
                      Continue booking
                    </Link>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-3">
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
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

