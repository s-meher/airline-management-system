import type { BookingFlight } from "@/lib/models/types";

/** Multi-leg itineraries — fare_amount snapshots mirror cabin bucket purchased */
export const BOOKING_FLIGHTS: readonly BookingFlight[] = [
  {
    booking_flight_id: 9001,
    booking_id: 1,
    flight_id: 103,
    segment_number: 1,
    cabin_class: "economy",
    fare_amount: 269.0,
  },
  {
    booking_flight_id: 9002,
    booking_id: 1,
    flight_id: 104,
    segment_number: 2,
    cabin_class: "economy",
    fare_amount: 359.0,
  },
  {
    booking_flight_id: 9003,
    booking_id: 2,
    flight_id: 105,
    segment_number: 1,
    cabin_class: "economy",
    fare_amount: 249.0,
  },
  {
    booking_flight_id: 9004,
    booking_id: 2,
    flight_id: 101,
    segment_number: 2,
    cabin_class: "economy",
    fare_amount: 229.0,
  },
  {
    booking_flight_id: 9005,
    booking_id: 3,
    flight_id: 107,
    segment_number: 1,
    cabin_class: "first",
    fare_amount: 759.0,
  },
  {
    booking_flight_id: 9006,
    booking_id: 3,
    flight_id: 104,
    segment_number: 2,
    cabin_class: "first",
    fare_amount: 1349.0,
  },
];
