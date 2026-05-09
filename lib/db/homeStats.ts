import { getPool } from "@/lib/db/pool";
import type { Flight } from "@/lib/models/types";

export async function countFlights(): Promise<number> {
  const pool = getPool();
  const r = await pool.query<{ n: string }>(`SELECT COUNT(*)::text AS n FROM flight`);
  return Number(r.rows[0]?.n ?? 0);
}

export async function countAirports(): Promise<number> {
  const pool = getPool();
  const r = await pool.query<{ n: string }>(`SELECT COUNT(*)::text AS n FROM airport`);
  return Number(r.rows[0]?.n ?? 0);
}

export async function countConfirmedBookings(): Promise<number> {
  const pool = getPool();
  const r = await pool.query<{ n: string }>(
    `SELECT COUNT(*)::text AS n FROM booking WHERE booking_status = 'confirmed'`,
  );
  return Number(r.rows[0]?.n ?? 0);
}

export async function upcomingFlights(limit: number): Promise<Flight[]> {
  const pool = getPool();
  const res = await pool.query<Flight>(
    `SELECT flight_id, airline_id, flight_number, origin_airport_code, destination_airport_code,
            scheduled_departure::text AS scheduled_departure,
            scheduled_arrival::text AS scheduled_arrival,
            duration_minutes
     FROM flight
     WHERE scheduled_departure >= timezone('utc', now())
     ORDER BY scheduled_departure ASC
     LIMIT $1`,
    [limit],
  );
  return res.rows;
}

export interface BookingHomePreview {
  booking_id: number;
  total_amount: number;
  currency_code: string;
  segment_count: number;
  origin_airport_code: string;
  destination_airport_code: string;
}

export async function recentConfirmedBookingsPreview(limit: number): Promise<BookingHomePreview[]> {
  const pool = getPool();
  const bookings = await pool.query<{ booking_id: number; total_amount: number; currency_code: string }>(
    `SELECT booking_id, total_amount::float8 AS total_amount, currency_code
     FROM booking
     WHERE booking_status = 'confirmed'
     ORDER BY booked_at DESC, booking_id DESC
     LIMIT $1`,
    [limit],
  );

  const out: BookingHomePreview[] = [];
  for (const b of bookings.rows) {
    const legs = await pool.query<{ flight_id: number; segment_number: number; origin_airport_code: string; destination_airport_code: string }>(
      `SELECT bf.segment_number, f.origin_airport_code, f.destination_airport_code
       FROM booking_flight bf
       JOIN flight f ON f.flight_id = bf.flight_id
       WHERE bf.booking_id = $1
       ORDER BY bf.segment_number`,
      [b.booking_id],
    );
    if (legs.rows.length === 0) continue;
    const first = legs.rows[0]!;
    const last = legs.rows[legs.rows.length - 1]!;
    out.push({
      booking_id: b.booking_id,
      total_amount: b.total_amount,
      currency_code: b.currency_code,
      segment_count: legs.rows.length,
      origin_airport_code: first.origin_airport_code,
      destination_airport_code: last.destination_airport_code,
    });
  }
  return out;
}
