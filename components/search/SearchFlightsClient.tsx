"use client";

import { useMemo, useState } from "react";
import type { Airline, Airport, CabinClass } from "@/lib/models/types";
import type { SearchHit } from "@/lib/models/search";
import type { SearchSortOption } from "@/lib/search/sortSearchHits";
import {
  formatCurrency,
  formatDurationMinutes,
  formatUtcDateTime,
} from "@/lib/utils/format";
import { Card } from "@/components/ui/Card";
import { Button, ButtonLink } from "@/components/ui/Button";
import { FieldLabel, SelectInput, TextInput } from "@/components/ui/Field";

type CabinFilter = "any" | CabinClass;

const PAGE_SIZE = 20;

export interface SearchFlightsClientProps {
  airports: readonly Airport[];
  airlines: readonly Airline[];
}

interface SearchCriteria {
  origin_airport_code: string;
  destination_airport_code: string;
  travel_date: string;
  travel_date_end: string;
  cabin_class: CabinFilter;
  sort: SearchSortOption;
  airline_ids: number[];
}

interface LastQuery {
  origin_airport_code: string;
  destination_airport_code: string;
  travel_date: string;
  travel_date_end: string;
  cabin_class: CabinFilter;
  sort: SearchSortOption;
  airline_ids: number[];
}

function searchUrl(
  p: LastQuery & { offset: number; limit: number },
) {
  const q = new URLSearchParams({
    origin: p.origin_airport_code,
    destination: p.destination_airport_code,
    date: p.travel_date,
    cabin: p.cabin_class,
    sort: p.sort,
    limit: String(p.limit),
    offset: String(p.offset),
  });
  if (p.travel_date_end.trim()) q.set("date_end", p.travel_date_end.trim());
  if (p.airline_ids.length > 0) q.set("airlines", p.airline_ids.join(","));
  return `/api/search?${q.toString()}`;
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
  if (
    criteria.travel_date_end.trim() &&
    criteria.travel_date_end < criteria.travel_date
  ) {
    errors.push("Return / end date cannot be before departure date.");
  }
  return errors;
}

function hitKey(hit: SearchHit, index: number) {
  if (hit.kind === "direct") return `d-${hit.flight.flight_id}`;
  return `c-${hit.leg1.flight_id}-${hit.leg2.flight_id}-${index}`;
}

export function SearchFlightsClient({ airports, airlines }: SearchFlightsClientProps) {
  const airportByCode = useMemo(() => buildAirportIndex(airports), [airports]);
  const airlineById = useMemo(() => buildAirlineIndex(airlines), [airlines]);

  const [form, setForm] = useState<SearchCriteria>({
    origin_airport_code: "",
    destination_airport_code: "",
    travel_date: "",
    travel_date_end: "",
    cabin_class: "any",
    sort: "departure",
    airline_ids: [],
  });

  const [submitted, setSubmitted] = useState<SearchCriteria | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [lastQuery, setLastQuery] = useState<LastQuery | null>(null);
  const [searching, setSearching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const summaryText = submitted
    ? `${submitted.origin_airport_code} → ${submitted.destination_airport_code} · ${submitted.travel_date}${submitted.travel_date_end.trim() ? `–${submitted.travel_date_end}` : ""}`
    : "Choose airports and a date to see flights.";

  return (
    <div className="space-y-6">
      <Card>
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
            Schedule · UTC times
          </div>
        </div>

        <form
          className="mt-6 grid gap-4 md:grid-cols-5"
          onSubmit={async (e) => {
            e.preventDefault();
            const nextErrors = validate(form);
            setErrors(nextErrors);
            if (nextErrors.length > 0) return;
            setSubmitted(form);
            setSearchError(null);
            setSearching(true);
            setHits([]);
            setOffset(0);
            const snap: LastQuery = {
              origin_airport_code: form.origin_airport_code,
              destination_airport_code: form.destination_airport_code,
              travel_date: form.travel_date,
              travel_date_end: form.travel_date_end,
              cabin_class: form.cabin_class,
              sort: form.sort,
              airline_ids: [...form.airline_ids],
            };
            try {
              const res = await fetch(
                searchUrl({ ...snap, offset: 0, limit: PAGE_SIZE }),
                { cache: "no-store" },
              );
              const json = (await res.json().catch(() => null)) as
                | { hits: SearchHit[]; total?: number }
                | { errors: string[] }
                | null;
              if (!res.ok) {
                const msg =
                  json && "errors" in json && json.errors?.[0]
                    ? json.errors[0]
                    : "Search failed.";
                setSearchError(msg);
                setHits([]);
                setTotal(0);
                setLastQuery(null);
                return;
              }
              const data = json as { hits: SearchHit[]; total?: number };
              setHits(data.hits ?? []);
              setTotal(typeof data.total === "number" ? data.total : data.hits?.length ?? 0);
              setOffset(data.hits?.length ?? 0);
              setLastQuery(snap);
            } catch {
              setSearchError("Search failed.");
              setHits([]);
              setTotal(0);
              setLastQuery(null);
            } finally {
              setSearching(false);
            }
          }}
        >
          <label className="md:col-span-2">
            <FieldLabel>Departure</FieldLabel>
            <SelectInput
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
            </SelectInput>
          </label>

          <label className="md:col-span-2">
            <FieldLabel>Destination</FieldLabel>
            <SelectInput
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
            </SelectInput>
          </label>

          <label>
            <FieldLabel>Depart from (UTC date)</FieldLabel>
            <TextInput
              type="date"
              value={form.travel_date}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, travel_date: e.target.value }))
              }
            />
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
              Examples: <span className="font-mono">2026-05-08</span>,{" "}
              <span className="font-mono">2026-06-25</span>.
            </p>
          </label>

          <label>
            <FieldLabel>Through date (optional)</FieldLabel>
            <TextInput
              type="date"
              value={form.travel_date_end}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, travel_date_end: e.target.value }))
              }
            />
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
              Inclusive range on first-leg UTC date.
            </p>
          </label>

          <label className="md:col-span-2">
            <FieldLabel>Sort</FieldLabel>
            <SelectInput
              value={form.sort}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  sort: e.target.value as SearchSortOption,
                }))
              }
            >
              <option value="departure">Departure time</option>
              <option value="duration">Trip duration</option>
              <option value="price_economy">Economy price</option>
              <option value="price_first">First price</option>
            </SelectInput>
          </label>

          <label className="md:col-span-5">
            <FieldLabel>Airlines (optional)</FieldLabel>
            <div className="mt-2 flex flex-wrap gap-3">
              {airlines.map((a) => (
                <label key={a.airline_id} className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="rounded border-zinc-300"
                    checked={form.airline_ids.includes(a.airline_id)}
                    onChange={(e) => {
                      setForm((prev) => ({
                        ...prev,
                        airline_ids: e.target.checked
                          ? [...prev.airline_ids, a.airline_id]
                          : prev.airline_ids.filter((id) => id !== a.airline_id),
                      }));
                    }}
                  />
                  <span>
                    {a.iata_code} · {a.airline_name}
                  </span>
                </label>
              ))}
            </div>
          </label>

          <label className="md:col-span-2">
            <FieldLabel>Class (optional)</FieldLabel>
            <SelectInput
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
            </SelectInput>
          </label>

          <div className="md:col-span-3">
            {errors.length > 0 ? (
              <ul className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
                {errors.map((err) => (
                  <li key={err}>{err}</li>
                ))}
              </ul>
            ) : null}
            {searchError ? (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
                {searchError}
              </p>
            ) : null}
          </div>

          <div className="md:col-span-2 md:flex md:justify-end">
            <Button type="submit" className="w-full md:w-auto" disabled={searching}>
              {searching ? "Searching…" : "Search"}
            </Button>
          </div>
        </form>
      </Card>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Results
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {submitted ? `${total} total · showing ${hits.length}` : "—"}
          </p>
        </div>

        {submitted && !searching && hits.length === 0 && !searchError ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            <p className="font-medium text-zinc-800 dark:text-zinc-200">
              No flights found for that route and date.
            </p>
            <p className="mt-2 text-sm">
              Try another date or set class to{" "}
              <span className="font-semibold">Any</span>. Example:{" "}
              <span className="font-mono">ORD → SFO</span>,{" "}
              <span className="font-mono">2026-05-08</span>,{" "}
              <span className="font-mono">2026-06-10</span>, or{" "}
              <span className="font-mono">2026-06-25</span>.
            </p>
          </div>
        ) : null}

        <div className="grid gap-4">
          {hits.map((hit, index) => {
            if (hit.kind === "direct") {
              const { flight, fares } = hit;
              const airline = airlineById.get(flight.airline_id);
              const origin = airportByCode.get(flight.origin_airport_code);
              const dest = airportByCode.get(flight.destination_airport_code);
              const { economy, first } = fares;

              return (
                <Card key={hitKey(hit, index)} className="p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-300">
                        Nonstop
                      </p>
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
                      <ButtonLink
                        href={`/search/${flight.flight_id}`}
                        variant="secondary"
                        size="sm"
                      >
                        View details
                      </ButtonLink>
                      <ButtonLink
                        href={`/book?flightId=${flight.flight_id}`}
                        variant="primary"
                        size="sm"
                      >
                        Continue booking
                      </ButtonLink>
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
                </Card>
              );
            }

            const { leg1, leg2, fares, layover_minutes, total_duration_minutes } = hit;
            const a1 = airlineById.get(leg1.airline_id);
            const a2 = airlineById.get(leg2.airline_id);
            const o1 = airportByCode.get(leg1.origin_airport_code);
            const hub = airportByCode.get(leg1.destination_airport_code);
            const d2 = airportByCode.get(leg2.destination_airport_code);
            const { economy, first } = fares;
            const bookQs = `flightIds=${leg1.flight_id},${leg2.flight_id}`;

            return (
              <Card key={hitKey(hit, index)} className="p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200">
                      1 stop · {layover_minutes}m layover ·{" "}
                      {formatDurationMinutes(total_duration_minutes)} total
                    </p>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      {leg1.origin_airport_code} ({o1?.city ?? "—"}) →{" "}
                      {leg1.destination_airport_code} ({hub?.city ?? "—"}) →{" "}
                      {leg2.destination_airport_code} ({d2?.city ?? "—"})
                    </p>
                    <p className="mt-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      {a1?.iata_code ?? "?"}
                      {leg1.flight_number} + {a2?.iata_code ?? "?"}
                      {leg2.flight_number}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    <ButtonLink href={`/search/${leg1.flight_id}`} variant="secondary" size="sm">
                      Leg 1 details
                    </ButtonLink>
                    <ButtonLink href={`/search/${leg2.flight_id}`} variant="secondary" size="sm">
                      Leg 2 details
                    </ButtonLink>
                    <ButtonLink href={`/book?${bookQs}`} variant="primary" size="sm">
                      Book itinerary
                    </ButtonLink>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/20">
                    <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                      Leg 1 departs
                    </p>
                    <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      {formatUtcDateTime(leg1.scheduled_departure)} (UTC)
                    </p>
                  </div>
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/20">
                    <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                      Layover / Leg 2
                    </p>
                    <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      {formatUtcDateTime(leg2.scheduled_departure)} (UTC)
                    </p>
                  </div>
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 py-3 md:col-span-2 dark:border-zinc-800 dark:bg-zinc-950/20">
                    <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                      Combined fare
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
              </Card>
            );
          })}
        </div>

        {submitted && lastQuery && hits.length < total ? (
          <div className="flex justify-center">
            <Button
              type="button"
              variant="secondary"
              disabled={loadingMore || searching}
              onClick={async () => {
                if (!lastQuery) return;
                setLoadingMore(true);
                setSearchError(null);
                try {
                  const res = await fetch(
                    searchUrl({ ...lastQuery, offset, limit: PAGE_SIZE }),
                    { cache: "no-store" },
                  );
                  const json = (await res.json().catch(() => null)) as
                    | { hits: SearchHit[]; total?: number }
                    | { errors: string[] }
                    | null;
                  if (!res.ok) {
                    const msg =
                      json && "errors" in json && json.errors?.[0]
                        ? json.errors[0]
                        : "Could not load more.";
                    setSearchError(msg);
                    return;
                  }
                  const data = json as { hits: SearchHit[] };
                  const page = data.hits ?? [];
                  setHits((prev) => [...prev, ...page]);
                  setOffset((o) => o + page.length);
                } catch {
                  setSearchError("Could not load more.");
                } finally {
                  setLoadingMore(false);
                }
              }}
            >
              {loadingMore ? "Loading…" : "Load more"}
            </Button>
          </div>
        ) : null}

        <p className="text-xs text-zinc-500 dark:text-zinc-500">
          Connections require a same-day first leg and a second leg within 12 hours at the hub.
        </p>
      </section>
    </div>
  );
}
