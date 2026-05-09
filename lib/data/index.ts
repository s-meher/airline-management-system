/**
 * Central read-only fixtures aligned with seeded SQL tables (see `db/` and `scripts/db/seed.ts`).
 * UI layers may import from `@/lib/data` or `@/lib/data/lookups`.
 */

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

/** Typed snapshot of all seed tables (debugging / homepage samples). */
export interface SeedTablesSnapshot {
  airports: readonly Airport[];
  airlines: readonly Airline[];
  customers: readonly Customer[];
  addresses: readonly Address[];
  credit_cards: readonly CreditCard[];
  flights: readonly Flight[];
  flight_prices: readonly FlightPrice[];
  bookings: readonly Booking[];
  booking_flights: readonly BookingFlight[];
}

export const SEED_TABLES_SNAPSHOT: SeedTablesSnapshot = {
  airports: AIRPORTS,
  airlines: AIRLINES,
  customers: CUSTOMERS,
  addresses: ADDRESSES,
  credit_cards: CREDIT_CARDS,
  flights: FLIGHTS,
  flight_prices: FLIGHT_PRICES,
  bookings: BOOKINGS,
  booking_flights: BOOKING_FLIGHTS,
};

export {
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

export {
  airlineById,
  airportByCode,
  addressById,
  bookingById,
  bookingFlightsForBooking,
  bookingsForCustomer,
  creditCardById,
  customerById,
  flightById,
  flightPricesByFlightId,
  flightsMatchingOd,
  itineraryForBooking,
} from "@/lib/data/lookups";

export type { BookingItinerarySegment } from "@/lib/data/lookups";

export type {
  Address,
  Airline,
  Airport,
  Booking,
  BookingFlight,
  BookingStatus,
  CabinClass,
  CreditCard,
  Customer,
  Flight,
  FlightPrice,
} from "@/lib/models/types";
