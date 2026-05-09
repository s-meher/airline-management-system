import type {
  BookingStatus,
  CabinClass,
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

function indexBy<T, K extends keyof T>(
  rows: readonly T[],
  key: K,
): Map<T[K] & (string | number), T> {
  type Id = T[K] & (string | number);
  const map = new Map<Id, T>();
  for (const row of rows) {
    map.set(row[key] as Id, row);
  }
  return map;
}

export const airportByCode = indexBy(AIRPORTS, "airport_code");
export const airlineById = indexBy(AIRLINES, "airline_id");
export const customerById = indexBy(CUSTOMERS, "customer_id");
export const addressById = indexBy(ADDRESSES, "address_id");
export const creditCardById = indexBy(CREDIT_CARDS, "credit_card_id");
export const flightById = indexBy(FLIGHTS, "flight_id");
export const bookingById = indexBy(BOOKINGS, "booking_id");

/** Published fares keyed by flight_id → cabin_class → flight_price row */
export function flightPricesByFlightId(): Map<
  number,
  Record<CabinClass, FlightPrice>
> {
  const map = new Map<number, Record<CabinClass, FlightPrice>>();
  for (const fp of FLIGHT_PRICES) {
    let slot = map.get(fp.flight_id);
    if (!slot) {
      slot = {} as Record<CabinClass, FlightPrice>;
      map.set(fp.flight_id, slot);
    }
    slot[fp.cabin_class] = fp;
  }
  return map;
}

/** Direct OD pairs ignoring date filters — sufficient until search filters arrive */
export function flightsMatchingOd(
  origin_airport_code: string,
  destination_airport_code: string,
): Flight[] {
  return FLIGHTS.filter(
    (f) =>
      f.origin_airport_code === origin_airport_code &&
      f.destination_airport_code === destination_airport_code,
  );
}

export function bookingFlightsForBooking(booking_id: number) {
  return BOOKING_FLIGHTS.filter((bf) => bf.booking_id === booking_id).sort(
    (a, b) => a.segment_number - b.segment_number,
  );
}

export interface BookingItinerarySegment {
  booking_flight_id: number;
  segment_number: number;
  cabin_class: CabinClass;
  fare_amount: number;
  flight: Flight;
}

/** Booking legs hydrated with flight rows for UI tables */
export function itineraryForBooking(
  booking_id: number,
): BookingItinerarySegment[] {
  const legs = bookingFlightsForBooking(booking_id);
  return legs.map((bf) => {
    const flight = flightById.get(bf.flight_id);
    if (!flight) {
      throw new Error(`Mock data inconsistency: flight ${bf.flight_id} missing`);
    }
    return {
      booking_flight_id: bf.booking_flight_id,
      segment_number: bf.segment_number,
      cabin_class: bf.cabin_class,
      fare_amount: bf.fare_amount,
      flight,
    };
  });
}

/** Convenience bundle when rendering booking detail cards */
export function bookingsForCustomer(customer_id: number, status?: BookingStatus) {
  return BOOKINGS.filter(
    (b) =>
      b.customer_id === customer_id &&
      (status === undefined ? true : b.booking_status === status),
  );
}
