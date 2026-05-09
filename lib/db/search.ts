import { getPool } from "@/lib/db/pool";
import type { FarePair, SearchFlightRow, SearchHit } from "@/lib/models/search";
import type { CabinClass } from "@/lib/models/types";

export type { FarePair, SearchFlightRow, SearchHit } from "@/lib/models/search";

export interface SearchFlightParams {
  origin_airport_code: string;
  destination_airport_code: string;
  travel_date_start: string;
  travel_date_end?: string;
  cabin_class: "any" | CabinClass;
  airline_ids?: number[];
}

export async function faresForFlightId(flight_id: number): Promise<FarePair> {
  const pool = getPool();
  const res = await pool.query<{
    cabin_class: CabinClass;
    amount: number;
    currency_code: string;
  }>(
    `SELECT cabin_class, amount::float8 AS amount, currency_code
     FROM flight_price WHERE flight_id = $1`,
    [flight_id],
  );
  let economy: FarePair["economy"] = null;
  let first: FarePair["first"] = null;
  for (const r of res.rows) {
    if (r.cabin_class === "economy") economy = { amount: r.amount, currency_code: r.currency_code };
    if (r.cabin_class === "first") first = { amount: r.amount, currency_code: r.currency_code };
  }
  return { economy, first };
}

function sumFares(a: FarePair, b: FarePair): FarePair {
  let economy: FarePair["economy"] = null;
  if (a.economy && b.economy && a.economy.currency_code === b.economy.currency_code) {
    economy = {
      amount: a.economy.amount + b.economy.amount,
      currency_code: a.economy.currency_code,
    };
  }
  let first: FarePair["first"] = null;
  if (a.first && b.first && a.first.currency_code === b.first.currency_code) {
    first = {
      amount: a.first.amount + b.first.amount,
      currency_code: a.first.currency_code,
    };
  }
  return { economy, first };
}

function mapFlightRow(r: Record<string, unknown>): SearchFlightRow {
  return {
    flight_id: Number(r.flight_id),
    airline_id: Number(r.airline_id),
    flight_number: String(r.flight_number),
    origin_airport_code: String(r.origin_airport_code),
    destination_airport_code: String(r.destination_airport_code),
    scheduled_departure: String(r.scheduled_departure),
    scheduled_arrival: String(r.scheduled_arrival),
    duration_minutes: Number(r.duration_minutes),
  };
}

function buildParams(origin: string, dest: string, params: SearchFlightParams) {
  const vals: unknown[] = [origin, dest];
  const useRange =
    Boolean(params.travel_date_end) && params.travel_date_end !== params.travel_date_start;

  let i = 3;
  let dateClauseDirect: string;
  if (useRange) {
    vals.push(params.travel_date_start, params.travel_date_end!);
    dateClauseDirect = `(scheduled_departure AT TIME ZONE 'UTC')::date BETWEEN $${i}::date AND $${i + 1}::date`;
    i += 2;
  } else {
    vals.push(params.travel_date_start);
    dateClauseDirect = `(scheduled_departure AT TIME ZONE 'UTC')::date = $${i}::date`;
    i += 1;
  }

  const dateClauseConn = dateClauseDirect.replaceAll("scheduled_departure", "f1.scheduled_departure");

  let airlineClauseDirect = "";
  let airlineClauseConn = "";
  const ids = params.airline_ids?.filter((n) => Number.isFinite(n) && n > 0) ?? [];
  if (ids.length > 0) {
    vals.push(ids);
    airlineClauseDirect = ` AND airline_id = ANY($${i}::int[])`;
    airlineClauseConn = ` AND f1.airline_id = ANY($${i}::int[]) AND f2.airline_id = ANY($${i}::int[])`;
    i += 1;
  }

  return { vals, dateClauseDirect, dateClauseConn, airlineClauseDirect, airlineClauseConn };
}

export async function searchFlights(params: SearchFlightParams): Promise<SearchHit[]> {
  const pool = getPool();
  const {
    origin_airport_code,
    destination_airport_code,
    cabin_class,
  } = params;

  const { vals, dateClauseDirect, dateClauseConn, airlineClauseDirect, airlineClauseConn } =
    buildParams(origin_airport_code, destination_airport_code, params);

  const directRes = await pool.query(
    `SELECT flight_id, airline_id, flight_number, origin_airport_code, destination_airport_code,
            scheduled_departure::text AS scheduled_departure,
            scheduled_arrival::text AS scheduled_arrival,
            duration_minutes
     FROM flight
     WHERE origin_airport_code = $1
       AND destination_airport_code = $2
       AND ${dateClauseDirect}
       ${airlineClauseDirect}
     ORDER BY scheduled_departure`,
    vals,
  );

  const hits: SearchHit[] = [];
  for (const row of directRes.rows) {
    const flight = mapFlightRow(row as Record<string, unknown>);
    const fares = await faresForFlightId(flight.flight_id);
    if (cabin_class === "any") {
      hits.push({ kind: "direct", flight, fares });
    } else if (cabin_class === "economy" && fares.economy) {
      hits.push({ kind: "direct", flight, fares });
    } else if (cabin_class === "first" && fares.first) {
      hits.push({ kind: "direct", flight, fares });
    }
  }

  const connRes = await pool.query(
    `SELECT
        f1.flight_id AS leg1_flight_id,
        f1.airline_id AS leg1_airline_id,
        f1.flight_number AS leg1_flight_number,
        f1.origin_airport_code AS leg1_origin,
        f1.destination_airport_code AS leg1_dest,
        f1.scheduled_departure::text AS leg1_dep,
        f1.scheduled_arrival::text AS leg1_arr,
        f1.duration_minutes AS leg1_dur,
        f2.flight_id AS leg2_flight_id,
        f2.airline_id AS leg2_airline_id,
        f2.flight_number AS leg2_flight_number,
        f2.origin_airport_code AS leg2_origin,
        f2.destination_airport_code AS leg2_dest,
        f2.scheduled_departure::text AS leg2_dep,
        f2.scheduled_arrival::text AS leg2_arr,
        f2.duration_minutes AS leg2_dur,
        EXTRACT(EPOCH FROM (f2.scheduled_departure - f1.scheduled_arrival)) / 60 AS layover_minutes
     FROM flight f1
     JOIN flight f2
       ON f1.destination_airport_code = f2.origin_airport_code
       AND f1.origin_airport_code <> f2.destination_airport_code
     WHERE f1.origin_airport_code = $1
       AND f2.destination_airport_code = $2
       AND ${dateClauseConn}
       AND f2.scheduled_departure >= f1.scheduled_arrival
       AND f2.scheduled_departure <= f1.scheduled_arrival + interval '12 hours'
       ${airlineClauseConn}
     ORDER BY f1.scheduled_departure, f2.scheduled_departure
     LIMIT 80`,
    vals,
  );

  for (const row of connRes.rows) {
    const leg1: SearchFlightRow = {
      flight_id: Number(row.leg1_flight_id),
      airline_id: Number(row.leg1_airline_id),
      flight_number: String(row.leg1_flight_number),
      origin_airport_code: String(row.leg1_origin),
      destination_airport_code: String(row.leg1_dest),
      scheduled_departure: String(row.leg1_dep),
      scheduled_arrival: String(row.leg1_arr),
      duration_minutes: Number(row.leg1_dur),
    };
    const leg2: SearchFlightRow = {
      flight_id: Number(row.leg2_flight_id),
      airline_id: Number(row.leg2_airline_id),
      flight_number: String(row.leg2_flight_number),
      origin_airport_code: String(row.leg2_origin),
      destination_airport_code: String(row.leg2_dest),
      scheduled_departure: String(row.leg2_dep),
      scheduled_arrival: String(row.leg2_arr),
      duration_minutes: Number(row.leg2_dur),
    };

    const f1 = await faresForFlightId(leg1.flight_id);
    const f2 = await faresForFlightId(leg2.flight_id);
    const fares = sumFares(f1, f2);
    const layover = Math.round(Number(row.layover_minutes));

    const includeAny = (f1.economy && f2.economy) || (f1.first && f2.first);
    const includeEcon = f1.economy && f2.economy;
    const includeFirst = f1.first && f2.first;

    if (cabin_class === "any" && includeAny) {
      hits.push({
        kind: "connection",
        leg1,
        leg2,
        fares,
        layover_minutes: layover,
        total_duration_minutes: leg1.duration_minutes + leg2.duration_minutes + layover,
      });
    } else if (cabin_class === "economy" && includeEcon) {
      hits.push({
        kind: "connection",
        leg1,
        leg2,
        fares,
        layover_minutes: layover,
        total_duration_minutes: leg1.duration_minutes + leg2.duration_minutes + layover,
      });
    } else if (cabin_class === "first" && includeFirst) {
      hits.push({
        kind: "connection",
        leg1,
        leg2,
        fares,
        layover_minutes: layover,
        total_duration_minutes: leg1.duration_minutes + leg2.duration_minutes + layover,
      });
    }
  }

  return hits;
}
