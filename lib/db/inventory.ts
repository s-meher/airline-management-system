import type { PoolClient } from "pg";
import { getPool } from "@/lib/db/pool";
import type { CabinClass } from "@/lib/models/types";

export async function reserveSeat(
  client: PoolClient,
  flight_id: number,
  cabin_class: CabinClass,
): Promise<boolean> {
  const res = await client.query(
    `UPDATE flight_cabin_inventory
     SET seats_booked = seats_booked + 1
     WHERE flight_id = $1
       AND cabin_class = $2
       AND seats_booked < seats_total
     RETURNING flight_id`,
    [flight_id, cabin_class],
  );
  return (res.rowCount ?? 0) > 0;
}

export async function releaseSeat(
  client: PoolClient,
  flight_id: number,
  cabin_class: CabinClass,
): Promise<void> {
  await client.query(
    `UPDATE flight_cabin_inventory
     SET seats_booked = GREATEST(0, seats_booked - 1)
     WHERE flight_id = $1 AND cabin_class = $2`,
    [flight_id, cabin_class],
  );
}

export async function getCabinAvailabilityPublic(flight_id: number): Promise<{
  economy: { total: number; booked: number; remaining: number };
  first: { total: number; booked: number; remaining: number };
} | null> {
  const pool = getPool();
  const res = await pool.query<{
    cabin_class: CabinClass;
    seats_total: number;
    seats_booked: number;
  }>(
    `SELECT cabin_class, seats_total, seats_booked
     FROM flight_cabin_inventory WHERE flight_id = $1`,
    [flight_id],
  );
  if (res.rows.length === 0) return null;
  let economy = { total: 0, booked: 0, remaining: 0 };
  let first = { total: 0, booked: 0, remaining: 0 };
  for (const r of res.rows) {
    const slot = {
      total: r.seats_total,
      booked: r.seats_booked,
      remaining: Math.max(0, r.seats_total - r.seats_booked),
    };
    if (r.cabin_class === "economy") economy = slot;
    if (r.cabin_class === "first") first = slot;
  }
  return { economy, first };
}
