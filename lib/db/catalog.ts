import { getPool } from "@/lib/db/pool";
import type { Airline, Airport } from "@/lib/models/types";

export async function listAirports(): Promise<Airport[]> {
  const pool = getPool();
  const res = await pool.query<Airport>(
    `SELECT airport_code, airport_name, city, region, country, timezone
     FROM airport
     ORDER BY airport_code`,
  );
  return res.rows;
}

export async function listAirlines(): Promise<Airline[]> {
  const pool = getPool();
  const res = await pool.query<Airline>(
    `SELECT airline_id, iata_code, airline_name
     FROM airline
     ORDER BY airline_name, airline_id`,
  );
  return res.rows;
}
