export interface SearchFlightRow {
  flight_id: number;
  airline_id: number;
  flight_number: string;
  origin_airport_code: string;
  destination_airport_code: string;
  scheduled_departure: string;
  scheduled_arrival: string;
  duration_minutes: number;
}

export interface FarePair {
  economy: { amount: number; currency_code: string } | null;
  first: { amount: number; currency_code: string } | null;
}

export type SearchHit =
  | { kind: "direct"; flight: SearchFlightRow; fares: FarePair }
  | {
      kind: "connection";
      leg1: SearchFlightRow;
      leg2: SearchFlightRow;
      fares: FarePair;
      layover_minutes: number;
      total_duration_minutes: number;
    };
