"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Booking, BookingFlight, CabinClass } from "@/lib/models/types";
import { BOOKINGS, BOOKING_FLIGHTS } from "@/lib/data";

const STORAGE_KEY = "flightdesk.demoBookings.v1";

export interface DemoBookingState {
  bookings: Booking[];
  booking_flights: BookingFlight[];
  cancelled_seed_booking_ids: number[];
}

export interface CreateDemoBookingInput {
  customer_id: number;
  credit_card_id: number;
  flight_id: number;
  cabin_class: CabinClass;
  fare_amount: number;
  currency_code: string;
}

export interface DemoBookingStore {
  state: DemoBookingState;
  createBooking: (input: CreateDemoBookingInput) => {
    booking_id: number;
  };
  cancelBooking: (booking_id: number) => void;
  clear: () => void;
}

const DemoBookingContext = createContext<DemoBookingStore | null>(null);

function nextId(existing: number[]) {
  return existing.length === 0 ? 1 : Math.max(...existing) + 1;
}

function loadFromStorage(): DemoBookingState {
  if (typeof window === "undefined")
    return { bookings: [], booking_flights: [], cancelled_seed_booking_ids: [] };
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return { bookings: [], booking_flights: [], cancelled_seed_booking_ids: [] };

  try {
    const parsed = JSON.parse(raw) as DemoBookingState;
    return {
      bookings: Array.isArray(parsed.bookings) ? parsed.bookings : [],
      booking_flights: Array.isArray(parsed.booking_flights)
        ? parsed.booking_flights
        : [],
      cancelled_seed_booking_ids: Array.isArray(parsed.cancelled_seed_booking_ids)
        ? parsed.cancelled_seed_booking_ids
        : [],
    };
  } catch {
    return { bookings: [], booking_flights: [], cancelled_seed_booking_ids: [] };
  }
}

function saveToStorage(state: DemoBookingState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function DemoBookingProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DemoBookingState>({
    bookings: [],
    booking_flights: [],
    cancelled_seed_booking_ids: [],
  });

  useEffect(() => {
    setState(loadFromStorage());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    saveToStorage(state);
  }, [state]);

  const store = useMemo<DemoBookingStore>(() => {
    return {
      state,
      createBooking: (input) => {
        const booking_id = nextId([
          ...BOOKINGS.map((b) => b.booking_id),
          ...state.bookings.map((b) => b.booking_id),
        ]);
        const booking_flight_id = nextId([
          ...BOOKING_FLIGHTS.map((bf) => bf.booking_flight_id),
          ...state.booking_flights.map((bf) => bf.booking_flight_id),
        ]);

        const now = new Date().toISOString();

        const booking: Booking = {
          booking_id,
          customer_id: input.customer_id,
          credit_card_id: input.credit_card_id,
          booked_at: now,
          booking_status: "confirmed",
          currency_code: input.currency_code,
          total_amount: input.fare_amount,
        };

        const leg: BookingFlight = {
          booking_flight_id,
          booking_id,
          flight_id: input.flight_id,
          segment_number: 1,
          cabin_class: input.cabin_class,
          fare_amount: input.fare_amount,
        };

        setState((prev) => ({
          bookings: [booking, ...prev.bookings],
          booking_flights: [leg, ...prev.booking_flights],
          cancelled_seed_booking_ids: prev.cancelled_seed_booking_ids,
        }));

        return { booking_id };
      },
      cancelBooking: (booking_id) => {
        setState((prev) => {
          const demoIdx = prev.bookings.findIndex((b) => b.booking_id === booking_id);
          if (demoIdx >= 0) {
            const nextBookings = [...prev.bookings];
            const existing = nextBookings[demoIdx];
            nextBookings[demoIdx] = {
              ...existing,
              booking_status: "cancelled",
            };
            return {
              ...prev,
              bookings: nextBookings,
            };
          }

          // Seeded booking override: track cancelled ids locally
          if (!prev.cancelled_seed_booking_ids.includes(booking_id)) {
            return {
              ...prev,
              cancelled_seed_booking_ids: [
                booking_id,
                ...prev.cancelled_seed_booking_ids,
              ],
            };
          }

          return prev;
        });
      },
      clear: () =>
        setState({ bookings: [], booking_flights: [], cancelled_seed_booking_ids: [] }),
    };
  }, [state]);

  return (
    <DemoBookingContext.Provider value={store}>
      {children}
    </DemoBookingContext.Provider>
  );
}

export function useDemoBookings() {
  const ctx = useContext(DemoBookingContext);
  if (!ctx) throw new Error("useDemoBookings must be used within DemoBookingProvider");
  return ctx;
}

