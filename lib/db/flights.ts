import { getPool } from "@/lib/db/pool";
import { faresForFlightId } from "@/lib/db/search";
import type { FarePair } from "@/lib/models/search";

export interface FlightLegWithAirline {
  flight_id: number;
  airline_id: number;
  flight_number: string;
  origin_airport_code: string;
  destination_airport_code: string;
  scheduled_departure: string;
  scheduled_arrival: string;
  duration_minutes: number;
  airline_name: string;
  iata_code: string;
}

export interface FlightLegWithFares extends FlightLegWithAirline {
  fares: FarePair;
}

export async function getFlightById(flight_id: number): Promise<FlightLegWithAirline | null> {
  const pool = getPool();
  const res = await pool.query(
    `SELECT
        f.flight_id,
        f.airline_id,
        f.flight_number,
        f.origin_airport_code,
        f.destination_airport_code,
        f.scheduled_departure::text AS scheduled_departure,
        f.scheduled_arrival::text AS scheduled_arrival,
        f.duration_minutes,
        a.airline_name,
        a.iata_code
     FROM flight f
     JOIN airline a ON a.airline_id = f.airline_id
     WHERE f.flight_id = $1`,
    [flight_id],
  );
  const row = res.rows[0];
  if (!row) return null;
  return {
    flight_id: Number(row.flight_id),
    airline_id: Number(row.airline_id),
    flight_number: String(row.flight_number),
    origin_airport_code: String(row.origin_airport_code),
    destination_airport_code: String(row.destination_airport_code),
    scheduled_departure: String(row.scheduled_departure),
    scheduled_arrival: String(row.scheduled_arrival),
    duration_minutes: Number(row.duration_minutes),
    airline_name: String(row.airline_name),
    iata_code: String(row.iata_code),
  };
}

export async function listFlightsWithFaresInOrder(flight_ids: number[]): Promise<FlightLegWithFares[]> {
  if (flight_ids.length === 0) return [];
  const pool = getPool();
  const res = await pool.query(
    `SELECT
        f.flight_id,
        f.airline_id,
        f.flight_number,
        f.origin_airport_code,
        f.destination_airport_code,
        f.scheduled_departure::text AS scheduled_departure,
        f.scheduled_arrival::text AS scheduled_arrival,
        f.duration_minutes,
        a.airline_name,
        a.iata_code,
        t.ord
     FROM unnest($1::int[]) WITH ORDINALITY AS t(flight_id, ord)
     JOIN flight f ON f.flight_id = t.flight_id
     JOIN airline a ON a.airline_id = f.airline_id
     ORDER BY t.ord`,
    [flight_ids],
  );

  const legs: FlightLegWithFares[] = [];
  for (const row of res.rows) {
    const flight_id = Number(row.flight_id);
    const fares = await faresForFlightId(flight_id);
    legs.push({
      flight_id,
      airline_id: Number(row.airline_id),
      flight_number: String(row.flight_number),
      origin_airport_code: String(row.origin_airport_code),
      destination_airport_code: String(row.destination_airport_code),
      scheduled_departure: String(row.scheduled_departure),
      scheduled_arrival: String(row.scheduled_arrival),
      duration_minutes: Number(row.duration_minutes),
      airline_name: String(row.airline_name),
      iata_code: String(row.iata_code),
      fares,
    });
  }
  return legs;
}
