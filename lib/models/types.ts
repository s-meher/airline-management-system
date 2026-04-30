/**
 * Domain types aligned with CS 425 relational schema (snake_case field names).
 * IDs mirror surrogate keys you would use in SQL (SERIAL / INTEGER).
 */

export type CabinClass = "economy" | "first";

export type BookingStatus = "confirmed" | "cancelled" | "pending";

/** airport — hub identifiers use standard IATA codes as PK */
export interface Airport {
  airport_code: string;
  airport_name: string;
  city: string;
  region: string;
  country: string;
  timezone: string;
}

/** airline */
export interface Airline {
  airline_id: number;
  iata_code: string;
  airline_name: string;
}

/** customer */
export interface Customer {
  customer_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
}

/** address — belongs to customer */
export interface Address {
  address_id: number;
  customer_id: number;
  line1: string;
  line2: string | null;
  city: string;
  region: string;
  postal_code: string;
  country: string;
  is_primary: boolean;
}

/** credit_card — belongs to customer; references billing address when stored */
export interface CreditCard {
  credit_card_id: number;
  customer_id: number;
  billing_address_id: number;
  card_brand: string;
  last_four: string;
  exp_month: number;
  exp_year: number;
}

/** flight — scheduled segment operated by one airline between two airports */
export interface Flight {
  flight_id: number;
  airline_id: number;
  flight_number: string;
  origin_airport_code: string;
  destination_airport_code: string;
  scheduled_departure: string;
  scheduled_arrival: string;
  duration_minutes: number;
}

/** flight_price — fare bucket per flight row */
export interface FlightPrice {
  flight_price_id: number;
  flight_id: number;
  cabin_class: CabinClass;
  currency_code: string;
  amount: number;
}

/** booking — reservation header paid by customer */
export interface Booking {
  booking_id: number;
  customer_id: number;
  credit_card_id: number;
  booked_at: string;
  booking_status: BookingStatus;
  currency_code: string;
  total_amount: number;
}

/** booking_flight — itinerary legs belonging to a booking */
export interface BookingFlight {
  booking_flight_id: number;
  booking_id: number;
  flight_id: number;
  segment_number: number;
  cabin_class: CabinClass;
  fare_amount: number;
}
