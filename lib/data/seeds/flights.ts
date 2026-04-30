import type { Flight } from "@/lib/models/types";

/**
 * Scheduled segments among ORD / JFK / SFO hubs — ISO timestamps for demo (UTC).
 * Flight_number matches ticketing convention carrier code handled separately via airline_id.
 */
export const FLIGHTS: readonly Flight[] = [
  {
    flight_id: 101,
    airline_id: 1,
    flight_number: "501",
    origin_airport_code: "ORD",
    destination_airport_code: "SFO",
    scheduled_departure: "2026-06-10T17:45:00.000Z",
    scheduled_arrival: "2026-06-10T20:35:00.000Z",
    duration_minutes: 290,
  },
  {
    flight_id: 102,
    airline_id: 1,
    flight_number: "502",
    origin_airport_code: "SFO",
    destination_airport_code: "ORD",
    scheduled_departure: "2026-06-14T14:10:00.000Z",
    scheduled_arrival: "2026-06-14T21:55:00.000Z",
    duration_minutes: 285,
  },
  {
    flight_id: 103,
    airline_id: 1,
    flight_number: "210",
    origin_airport_code: "ORD",
    destination_airport_code: "JFK",
    scheduled_departure: "2026-06-11T13:30:00.000Z",
    scheduled_arrival: "2026-06-11T17:05:00.000Z",
    duration_minutes: 155,
  },
  {
    flight_id: 104,
    airline_id: 2,
    flight_number: "441",
    origin_airport_code: "JFK",
    destination_airport_code: "SFO",
    scheduled_departure: "2026-06-11T19:40:00.000Z",
    scheduled_arrival: "2026-06-12T00:10:00.000Z",
    duration_minutes: 390,
  },
  {
    flight_id: 105,
    airline_id: 2,
    flight_number: "880",
    origin_airport_code: "JFK",
    destination_airport_code: "ORD",
    scheduled_departure: "2026-06-09T22:30:00.000Z",
    scheduled_arrival: "2026-06-10T00:55:00.000Z",
    duration_minutes: 205,
  },
  {
    flight_id: 106,
    airline_id: 2,
    flight_number: "991",
    origin_airport_code: "SFO",
    destination_airport_code: "JFK",
    scheduled_departure: "2026-06-08T01:25:00.000Z",
    scheduled_arrival: "2026-06-08T10:05:00.000Z",
    duration_minutes: 340,
  },
  {
    flight_id: 107,
    airline_id: 1,
    flight_number: "318",
    origin_airport_code: "ORD",
    destination_airport_code: "JFK",
    scheduled_departure: "2026-06-18T22:15:00.000Z",
    scheduled_arrival: "2026-06-19T01:40:00.000Z",
    duration_minutes: 145,
  },
];
