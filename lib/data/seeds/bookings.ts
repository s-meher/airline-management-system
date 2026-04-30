import type { Booking } from "@/lib/models/types";

/**
 * Booking totals equal summed booking_flight fare_amount for traceability in demos.
 */
export const BOOKINGS: readonly Booking[] = [
  {
    booking_id: 1,
    customer_id: 1,
    credit_card_id: 1,
    booked_at: "2026-05-02T16:22:00.000Z",
    booking_status: "confirmed",
    currency_code: "USD",
    total_amount: 628.0,
  },
  {
    booking_id: 2,
    customer_id: 2,
    credit_card_id: 3,
    booked_at: "2026-05-04T11:05:00.000Z",
    booking_status: "confirmed",
    currency_code: "USD",
    total_amount: 478.0,
  },
  {
    booking_id: 3,
    customer_id: 1,
    credit_card_id: 2,
    booked_at: "2026-05-07T09:40:00.000Z",
    booking_status: "confirmed",
    currency_code: "USD",
    total_amount: 2108.0,
  },
];
