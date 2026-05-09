import "dotenv/config";
import bcrypt from "bcryptjs";
import type {
  Address,
  Airline,
  Airport,
  Booking,
  BookingFlight,
  CreditCard,
  Customer,
  Flight,
  FlightPrice,
} from "@/lib/models/types";
import {
  ADDRESSES,
  AIRLINES,
  AIRPORTS,
  BOOKING_FLIGHTS,
  BOOKINGS,
  CREDIT_CARDS,
  CUSTOMERS,
  FLIGHT_PRICES,
  FLIGHTS,
} from "@/lib/data/seeds";
import { getPool } from "@/lib/db/pool";
import { economySeatTotal, firstSeatTotal } from "@/lib/utils/seatAvailability";

async function seedAllCustomerPasswords(pool: ReturnType<typeof getPool>) {
  const pwd = process.env.SEED_USER_PASSWORD ?? "flightdesk";
  const hash = bcrypt.hashSync(pwd, 10);
  await pool.query(`UPDATE customer SET password_hash = $1 WHERE password_hash IS NULL`, [hash]);
}

async function insertFlightCabinInventory(pool: ReturnType<typeof getPool>, rows: readonly FlightPrice[]) {
  const seen = new Set<string>();
  const ordered = [...rows].sort((a, b) =>
    a.flight_id !== b.flight_id ? a.flight_id - b.flight_id : a.cabin_class.localeCompare(b.cabin_class),
  );
  for (const fp of ordered) {
    const key = `${fp.flight_id}:${fp.cabin_class}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const seats_total =
      fp.cabin_class === "economy" ? economySeatTotal(fp.flight_id) : firstSeatTotal(fp.flight_id);
    await pool.query(
      `INSERT INTO flight_cabin_inventory (flight_id, cabin_class, seats_total, seats_booked)
       VALUES ($1,$2,$3,0)
       ON CONFLICT (flight_id, cabin_class) DO UPDATE SET seats_total = EXCLUDED.seats_total`,
      [fp.flight_id, fp.cabin_class, seats_total],
    );
  }
}

async function syncSeatBookCountsFromConfirmed(pool: ReturnType<typeof getPool>) {
  await pool.query(`UPDATE flight_cabin_inventory SET seats_booked = 0`);
  await pool.query(`
    UPDATE flight_cabin_inventory inv
    SET seats_booked = agg.n
    FROM (
      SELECT bf.flight_id, bf.cabin_class, COUNT(*)::int AS n
      FROM booking_flight bf
      INNER JOIN booking b ON b.booking_id = bf.booking_id AND b.booking_status = 'confirmed'
      GROUP BY bf.flight_id, bf.cabin_class
    ) agg
    WHERE inv.flight_id = agg.flight_id AND inv.cabin_class = agg.cabin_class
  `);
}

async function insertAirports(pool: ReturnType<typeof getPool>, rows: readonly Airport[]) {
  for (const r of rows) {
    await pool.query(
      `INSERT INTO airport (airport_code, airport_name, city, region, country, timezone)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (airport_code) DO UPDATE SET
         airport_name=EXCLUDED.airport_name,
         city=EXCLUDED.city,
         region=EXCLUDED.region,
         country=EXCLUDED.country,
         timezone=EXCLUDED.timezone`,
      [r.airport_code, r.airport_name, r.city, r.region, r.country, r.timezone],
    );
  }
}

async function insertAirlines(pool: ReturnType<typeof getPool>, rows: readonly Airline[]) {
  for (const r of rows) {
    await pool.query(
      `INSERT INTO airline (airline_id, iata_code, airline_name)
       VALUES ($1,$2,$3)
       ON CONFLICT (airline_id) DO UPDATE SET
         iata_code=EXCLUDED.iata_code,
         airline_name=EXCLUDED.airline_name`,
      [r.airline_id, r.iata_code, r.airline_name],
    );
  }
  await pool.query(
    `SELECT setval(pg_get_serial_sequence('airline','airline_id'), (SELECT COALESCE(MAX(airline_id),0) FROM airline))`,
  );
}

async function insertCustomers(pool: ReturnType<typeof getPool>, rows: readonly Customer[]) {
  for (const r of rows) {
    await pool.query(
      `INSERT INTO customer (customer_id, first_name, last_name, email, phone)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (customer_id) DO UPDATE SET
         first_name=EXCLUDED.first_name,
         last_name=EXCLUDED.last_name,
         email=EXCLUDED.email,
         phone=EXCLUDED.phone`,
      [r.customer_id, r.first_name, r.last_name, r.email, r.phone],
    );
  }
  await pool.query(
    `SELECT setval(pg_get_serial_sequence('customer','customer_id'), (SELECT COALESCE(MAX(customer_id),0) FROM customer))`,
  );
}

async function insertAddresses(pool: ReturnType<typeof getPool>, rows: readonly Address[]) {
  for (const r of rows) {
    await pool.query(
      `INSERT INTO address (address_id, customer_id, line1, line2, city, region, postal_code, country, is_primary)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (address_id) DO UPDATE SET
         customer_id=EXCLUDED.customer_id,
         line1=EXCLUDED.line1,
         line2=EXCLUDED.line2,
         city=EXCLUDED.city,
         region=EXCLUDED.region,
         postal_code=EXCLUDED.postal_code,
         country=EXCLUDED.country,
         is_primary=EXCLUDED.is_primary`,
      [
        r.address_id,
        r.customer_id,
        r.line1,
        r.line2,
        r.city,
        r.region,
        r.postal_code,
        r.country,
        r.is_primary,
      ],
    );
  }
  await pool.query(
    `SELECT setval(pg_get_serial_sequence('address','address_id'), (SELECT COALESCE(MAX(address_id),0) FROM address))`,
  );
}

async function insertCards(pool: ReturnType<typeof getPool>, rows: readonly CreditCard[]) {
  for (const r of rows) {
    await pool.query(
      `INSERT INTO credit_card (credit_card_id, customer_id, billing_address_id, card_brand, last_four, exp_month, exp_year)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (credit_card_id) DO UPDATE SET
         customer_id=EXCLUDED.customer_id,
         billing_address_id=EXCLUDED.billing_address_id,
         card_brand=EXCLUDED.card_brand,
         last_four=EXCLUDED.last_four,
         exp_month=EXCLUDED.exp_month,
         exp_year=EXCLUDED.exp_year`,
      [
        r.credit_card_id,
        r.customer_id,
        r.billing_address_id,
        r.card_brand,
        r.last_four,
        r.exp_month,
        r.exp_year,
      ],
    );
  }
  await pool.query(
    `SELECT setval(pg_get_serial_sequence('credit_card','credit_card_id'), (SELECT COALESCE(MAX(credit_card_id),0) FROM credit_card))`,
  );
}

async function insertFlights(pool: ReturnType<typeof getPool>, rows: readonly Flight[]) {
  for (const r of rows) {
    await pool.query(
      `INSERT INTO flight (flight_id, airline_id, flight_number, origin_airport_code, destination_airport_code, scheduled_departure, scheduled_arrival, duration_minutes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (flight_id) DO UPDATE SET
         airline_id=EXCLUDED.airline_id,
         flight_number=EXCLUDED.flight_number,
         origin_airport_code=EXCLUDED.origin_airport_code,
         destination_airport_code=EXCLUDED.destination_airport_code,
         scheduled_departure=EXCLUDED.scheduled_departure,
         scheduled_arrival=EXCLUDED.scheduled_arrival,
         duration_minutes=EXCLUDED.duration_minutes`,
      [
        r.flight_id,
        r.airline_id,
        r.flight_number,
        r.origin_airport_code,
        r.destination_airport_code,
        r.scheduled_departure,
        r.scheduled_arrival,
        r.duration_minutes,
      ],
    );
  }
  await pool.query(
    `SELECT setval(pg_get_serial_sequence('flight','flight_id'), (SELECT COALESCE(MAX(flight_id),0) FROM flight))`,
  );
}

async function insertFlightPrices(pool: ReturnType<typeof getPool>, rows: readonly FlightPrice[]) {
  // Insert economy before first to minimize trigger errors if seeds are ordered oddly.
  const ordered = [...rows].sort((a, b) => (a.cabin_class === b.cabin_class ? 0 : a.cabin_class === "economy" ? -1 : 1));
  for (const r of ordered) {
    await pool.query(
      `INSERT INTO flight_price (flight_price_id, flight_id, cabin_class, currency_code, amount)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (flight_price_id) DO UPDATE SET
         flight_id=EXCLUDED.flight_id,
         cabin_class=EXCLUDED.cabin_class,
         currency_code=EXCLUDED.currency_code,
         amount=EXCLUDED.amount`,
      [r.flight_price_id, r.flight_id, r.cabin_class, r.currency_code, r.amount],
    );
  }
  await pool.query(
    `SELECT setval(pg_get_serial_sequence('flight_price','flight_price_id'), (SELECT COALESCE(MAX(flight_price_id),0) FROM flight_price))`,
  );
}

async function insertBookings(pool: ReturnType<typeof getPool>, rows: readonly Booking[]) {
  for (const r of rows) {
    await pool.query(
      `INSERT INTO booking (booking_id, customer_id, credit_card_id, booked_at, booking_status, currency_code, total_amount)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (booking_id) DO UPDATE SET
         customer_id=EXCLUDED.customer_id,
         credit_card_id=EXCLUDED.credit_card_id,
         booked_at=EXCLUDED.booked_at,
         booking_status=EXCLUDED.booking_status,
         currency_code=EXCLUDED.currency_code,
         total_amount=EXCLUDED.total_amount`,
      [
        r.booking_id,
        r.customer_id,
        r.credit_card_id,
        r.booked_at,
        r.booking_status,
        r.currency_code,
        r.total_amount,
      ],
    );
  }
  await pool.query(
    `SELECT setval(pg_get_serial_sequence('booking','booking_id'), (SELECT COALESCE(MAX(booking_id),0) FROM booking))`,
  );
}

async function insertBookingFlights(
  pool: ReturnType<typeof getPool>,
  rows: readonly BookingFlight[],
) {
  for (const r of rows) {
    await pool.query(
      `INSERT INTO booking_flight (booking_flight_id, booking_id, flight_id, segment_number, cabin_class, fare_amount)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (booking_flight_id) DO UPDATE SET
         booking_id=EXCLUDED.booking_id,
         flight_id=EXCLUDED.flight_id,
         segment_number=EXCLUDED.segment_number,
         cabin_class=EXCLUDED.cabin_class,
         fare_amount=EXCLUDED.fare_amount`,
      [
        r.booking_flight_id,
        r.booking_id,
        r.flight_id,
        r.segment_number,
        r.cabin_class,
        r.fare_amount,
      ],
    );
  }
  await pool.query(
    `SELECT setval(pg_get_serial_sequence('booking_flight','booking_flight_id'), (SELECT COALESCE(MAX(booking_flight_id),0) FROM booking_flight))`,
  );
}

async function main() {
  const pool = getPool();

  // Keep seed deterministic across runs
  await pool.query("BEGIN");
  try {
    await insertAirports(pool, AIRPORTS);
    await insertAirlines(pool, AIRLINES);
    await insertCustomers(pool, CUSTOMERS);
    await seedAllCustomerPasswords(pool);
    await insertAddresses(pool, ADDRESSES);
    await insertCards(pool, CREDIT_CARDS);
    await insertFlights(pool, FLIGHTS);
    await insertFlightPrices(pool, FLIGHT_PRICES);
    await insertFlightCabinInventory(pool, FLIGHT_PRICES);
    await insertBookings(pool, BOOKINGS);
    await insertBookingFlights(pool, BOOKING_FLIGHTS);
    await syncSeatBookCountsFromConfirmed(pool);

    await pool.query("COMMIT");
  } catch (e) {
    await pool.query("ROLLBACK");
    throw e;
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

