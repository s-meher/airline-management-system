import { getPool } from "@/lib/db/pool";
import { releaseSeat, reserveSeat } from "@/lib/db/inventory";
import type { CabinClass } from "@/lib/models/types";

export interface DbBookingRow {
  booking_id: number;
  customer_id: number;
  credit_card_id: number;
  booked_at: string;
  booking_status: "confirmed" | "cancelled" | "pending";
  currency_code: string;
  total_amount: number;
}

export interface DbBookingLeg {
  booking_flight_id: number;
  booking_id: number;
  flight_id: number;
  segment_number: number;
  cabin_class: CabinClass;
  fare_amount: number;
  flight_number: string;
  airline_id: number;
  origin_airport_code: string;
  destination_airport_code: string;
  scheduled_departure: string;
  scheduled_arrival: string;
  duration_minutes: number;
  airline_name: string;
  airline_iata_code: string;
}

export interface DbBookingWithLegs extends DbBookingRow {
  legs: DbBookingLeg[];
  payment: {
    card_brand: string;
    last_four: string;
    exp_month: number;
    exp_year: number;
  } | null;
}

export async function listBookingsForCustomer(customer_id: number): Promise<DbBookingWithLegs[]> {
  const pool = getPool();

  const bookingRes = await pool.query<DbBookingRow>(
    `SELECT booking_id, customer_id, credit_card_id, booked_at::text, booking_status, currency_code, total_amount::float8 as total_amount
     FROM booking
     WHERE customer_id = $1
     ORDER BY booked_at DESC, booking_id DESC`,
    [customer_id],
  );

  if (bookingRes.rows.length === 0) return [];

  const bookingIds = bookingRes.rows.map((b) => b.booking_id);

  const legsRes = await pool.query<DbBookingLeg>(
    `SELECT
        bf.booking_flight_id,
        bf.booking_id,
        bf.flight_id,
        bf.segment_number,
        bf.cabin_class,
        bf.fare_amount::float8 as fare_amount,
        f.flight_number,
        f.airline_id,
        f.origin_airport_code,
        f.destination_airport_code,
        f.scheduled_departure::text,
        f.scheduled_arrival::text,
        f.duration_minutes,
        a.airline_name,
        a.iata_code as airline_iata_code
     FROM booking_flight bf
     JOIN flight f ON f.flight_id = bf.flight_id
     JOIN airline a ON a.airline_id = f.airline_id
     WHERE bf.booking_id = ANY($1::int[])
     ORDER BY bf.booking_id, bf.segment_number`,
    [bookingIds],
  );

  const paymentRes = await pool.query<{
    credit_card_id: number;
    card_brand: string;
    last_four: string;
    exp_month: number;
    exp_year: number;
  }>(
    `SELECT credit_card_id, card_brand, last_four, exp_month, exp_year
     FROM credit_card
     WHERE customer_id = $1`,
    [customer_id],
  );
  const payById = new Map(paymentRes.rows.map((r) => [r.credit_card_id, r]));

  const legsByBooking = new Map<number, DbBookingLeg[]>();
  for (const leg of legsRes.rows) {
    const slot = legsByBooking.get(leg.booking_id) ?? [];
    slot.push(leg);
    legsByBooking.set(leg.booking_id, slot);
  }

  return bookingRes.rows.map((b) => ({
    ...b,
    legs: legsByBooking.get(b.booking_id) ?? [],
    payment: payById.get(b.credit_card_id) ?? null,
  }));
}

export async function createBookingFromFlights(input: {
  customer_id: number;
  credit_card_id: number;
  flight_ids: number[];
  cabin_class: CabinClass;
}): Promise<{ booking_id: number }> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const cardCheck = await client.query<{ credit_card_id: number }>(
      `SELECT credit_card_id FROM credit_card WHERE credit_card_id = $1 AND customer_id = $2`,
      [input.credit_card_id, input.customer_id],
    );
    if (cardCheck.rows.length === 0) {
      throw new Error("CARD_NOT_FOUND");
    }

    const flight_ids = [...new Set(input.flight_ids)];
    if (flight_ids.length === 0) throw new Error("NO_FLIGHTS");

    const legPrices: { flight_id: number; currency_code: string; amount: number }[] = [];
    for (const flight_id of flight_ids) {
      const priceRes = await client.query<{
        currency_code: string;
        amount: number;
      }>(
        `SELECT currency_code, amount::float8 AS amount
         FROM flight_price
         WHERE flight_id = $1 AND cabin_class = $2
         LIMIT 1`,
        [flight_id, input.cabin_class],
      );
      const price = priceRes.rows[0];
      if (!price) throw new Error("PRICE_NOT_FOUND");
      legPrices.push({ flight_id, currency_code: price.currency_code, amount: price.amount });
    }

    const currency = legPrices[0]!.currency_code;
    for (const lp of legPrices) {
      if (lp.currency_code !== currency) throw new Error("CURRENCY_MISMATCH");
    }
    const total = legPrices.reduce((s, lp) => s + lp.amount, 0);

    for (const lp of legPrices) {
      const ok = await reserveSeat(client, lp.flight_id, input.cabin_class);
      if (!ok) throw new Error("SEATS_UNAVAILABLE");
    }

    const bookingRes = await client.query<{ booking_id: number }>(
      `INSERT INTO booking (customer_id, credit_card_id, booking_status, currency_code, total_amount)
       VALUES ($1,$2,'confirmed',$3,$4)
       RETURNING booking_id`,
      [input.customer_id, input.credit_card_id, currency, total],
    );
    const booking_id = bookingRes.rows[0]!.booking_id;

    let segment = 1;
    for (const lp of legPrices) {
      await client.query(
        `INSERT INTO booking_flight (booking_id, flight_id, segment_number, cabin_class, fare_amount)
         VALUES ($1,$2,$3,$4,$5)`,
        [booking_id, lp.flight_id, segment++, input.cabin_class, lp.amount],
      );
    }

    await client.query("COMMIT");
    return { booking_id };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function cancelBooking(customer_id: number, booking_id: number) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const lockRes = await client.query<{ booking_status: string }>(
      `SELECT booking_status FROM booking
       WHERE booking_id = $1 AND customer_id = $2
       FOR UPDATE`,
      [booking_id, customer_id],
    );
    const row = lockRes.rows[0];
    if (!row || row.booking_status !== "confirmed") {
      await client.query("ROLLBACK");
      return false;
    }

    const legsRes = await client.query<{ flight_id: number; cabin_class: CabinClass }>(
      `SELECT flight_id, cabin_class FROM booking_flight WHERE booking_id = $1 ORDER BY segment_number`,
      [booking_id],
    );

    await client.query(
      `UPDATE booking SET booking_status = 'cancelled'
       WHERE booking_id = $1 AND customer_id = $2`,
      [booking_id, customer_id],
    );

    for (const leg of legsRes.rows) {
      await releaseSeat(client, leg.flight_id, leg.cabin_class);
    }

    await client.query("COMMIT");
    return true;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

