import {
  AIRPORTS,
  BOOKINGS,
  FLIGHTS,
  airlineById as fixtureAirlineById,
  airportByCode as fixtureAirportByCode,
  itineraryForBooking,
} from "@/lib/data";
import { listAirlines, listAirports } from "@/lib/db/catalog";
import {
  type BookingHomePreview,
  countAirports,
  countConfirmedBookings,
  countFlights,
  recentConfirmedBookingsPreview,
  upcomingFlights,
} from "@/lib/db/homeStats";
import type { Airline, Airport, Flight } from "@/lib/models/types";

export type HomePageModel = {
  dataSource: "database" | "fixtures";
  flightCount: number;
  airportCount: number;
  bookingCount: number;
  sampleFlights: Flight[];
  recentBookings: BookingHomePreview[];
  airportsList: Airport[];
  airlineById: Map<number, Airline>;
  airportByCode: Map<string, Airport>;
  flightsCardDescription: string;
};

async function fromDatabase(): Promise<HomePageModel> {
  const [
    flightCount,
    airportCount,
    bookingCount,
    upcoming,
    recentBookings,
    airports,
    airlines,
  ] = await Promise.all([
    countFlights(),
    countAirports(),
    countConfirmedBookings(),
    upcomingFlights(4),
    recentConfirmedBookingsPreview(2),
    listAirports(),
    listAirlines(),
  ]);

  return {
    dataSource: "database",
    flightCount,
    airportCount,
    bookingCount,
    sampleFlights: upcoming,
    recentBookings,
    airportsList: airports,
    airlineById: new Map(airlines.map((a) => [a.airline_id, a])),
    airportByCode: new Map(airports.map((a) => [a.airport_code, a])),
    flightsCardDescription:
      "Next departures from PostgreSQL. Times are UTC — open search for filters and pagination.",
  };
}

function fromFixtures(): HomePageModel {
  const activeBookings = BOOKINGS.filter((b) => b.booking_status === "confirmed");
  const sampleFlights = [...FLIGHTS]
    .sort(
      (a, b) =>
        new Date(a.scheduled_departure).getTime() -
        new Date(b.scheduled_departure).getTime(),
    )
    .slice(0, 4);

  const recentBookings: BookingHomePreview[] = [...activeBookings]
    .sort(
      (a, b) => new Date(b.booked_at).getTime() - new Date(a.booked_at).getTime(),
    )
    .slice(0, 2)
    .map((b) => {
      const legs = itineraryForBooking(b.booking_id);
      const first = legs[0]?.flight;
      const last = legs[legs.length - 1]?.flight;
      return {
        booking_id: b.booking_id,
        total_amount: b.total_amount,
        currency_code: b.currency_code,
        segment_count: legs.length,
        origin_airport_code: first?.origin_airport_code ?? "—",
        destination_airport_code: last?.destination_airport_code ?? "—",
      };
    });

  return {
    dataSource: "fixtures",
    flightCount: FLIGHTS.length,
    airportCount: AIRPORTS.length,
    bookingCount: activeBookings.length,
    sampleFlights,
    recentBookings,
    airportsList: [...AIRPORTS],
    airlineById: fixtureAirlineById,
    airportByCode: fixtureAirportByCode,
    flightsCardDescription:
      "Bundled seed fixtures (UTC). Set DATABASE_URL and run db:reset for PostgreSQL-backed counts and schedules.",
  };
}

export async function loadHomePageModel(): Promise<HomePageModel> {
  try {
    return await fromDatabase();
  } catch {
    return fromFixtures();
  }
}
