import { NextResponse } from "next/server";
import { requireCustomerSession } from "@/lib/auth/requireCustomer";
import { createBookingFromFlights, listBookingsForCustomer } from "@/lib/db/bookings";
import { clientIp, rateLimitAllow } from "@/lib/db/rateLimit";
import { logFlightDesk } from "@/lib/log";
import type { CabinClass } from "@/lib/models/types";

export async function GET() {
  const customer = await requireCustomerSession();
  if (!customer) return NextResponse.json({ errors: ["Sign in required."] }, { status: 401 });

  const bookings = await listBookingsForCustomer(customer.customer_id);
  return NextResponse.json({ bookings });
}

export async function POST(req: Request) {
  const customer = await requireCustomerSession();
  if (!customer) return NextResponse.json({ errors: ["Sign in required."] }, { status: 401 });

  const ip = clientIp(req);
  const rl = await rateLimitAllow(`book:${ip}:${customer.customer_id}`, 40);
  if (!rl) {
    return NextResponse.json({ errors: ["Too many booking attempts. Try again shortly."] }, { status: 429 });
  }

  const body = (await req.json().catch(() => null)) as
    | { credit_card_id?: number; flight_id?: number; flight_ids?: number[]; cabin_class?: CabinClass }
    | null;

  const credit_card_id = Number(body?.credit_card_id);
  const cabin_class = body?.cabin_class;

  let flight_ids: number[] = [];
  if (Array.isArray(body?.flight_ids) && body.flight_ids.length > 0) {
    flight_ids = body.flight_ids.map((n) => Number(n)).filter((n) => Number.isFinite(n) && n > 0);
  } else if (body?.flight_id != null && Number.isFinite(Number(body.flight_id))) {
    flight_ids = [Number(body.flight_id)];
  }

  const errors: string[] = [];
  if (!Number.isFinite(credit_card_id)) errors.push("Payment method is required.");
  if (flight_ids.length === 0) errors.push("At least one flight is required.");
  if (cabin_class !== "economy" && cabin_class !== "first") errors.push("Cabin class is required.");

  if (errors.length > 0) return NextResponse.json({ errors }, { status: 400 });

  try {
    const created = await createBookingFromFlights({
      customer_id: customer.customer_id,
      credit_card_id,
      flight_ids,
      cabin_class: cabin_class as CabinClass,
    });
    logFlightDesk("info", "booking.created", { booking_id: created.booking_id, customer_id: customer.customer_id });
    return NextResponse.json({ booking_id: created.booking_id }, { status: 201 });
  } catch (e: unknown) {
    const msg = String(e);
    if (msg.includes("SEATS_UNAVAILABLE")) {
      return NextResponse.json(
        { errors: ["No seats left in the selected cabin for one of these flights."] },
        { status: 409 },
      );
    }
    if (msg.includes("CARD_NOT_FOUND")) {
      return NextResponse.json({ errors: ["Selected card is not available."] }, { status: 409 });
    }
    if (msg.includes("PRICE_NOT_FOUND")) {
      return NextResponse.json(
        {
          errors: [
            "No fare in the database for one of these flights and the selected cabin. Run `npm run db:reset` to reseed `flight_price`, then try again.",
          ],
        },
        { status: 409 },
      );
    }
    if (msg.includes("CURRENCY_MISMATCH")) {
      return NextResponse.json(
        { errors: ["Itinerary legs use different currencies; booking cannot be combined."] },
        { status: 409 },
      );
    }
    return NextResponse.json({ errors: ["Failed to create booking."] }, { status: 500 });
  }
}

