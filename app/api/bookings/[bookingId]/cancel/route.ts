import { NextResponse } from "next/server";
import { requireCustomerSession } from "@/lib/auth/requireCustomer";
import { cancelBooking } from "@/lib/db/bookings";

function parseId(raw: string) {
  const n = Number(raw);
  return Number.isFinite(n) ? n : NaN;
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ bookingId: string }> },
) {
  const customer = await requireCustomerSession();
  if (!customer) return NextResponse.json({ errors: ["Sign in required."] }, { status: 401 });

  const { bookingId } = await params;
  const id = parseId(bookingId);
  if (!Number.isFinite(id)) return NextResponse.json({ errors: ["Invalid booking id."] }, { status: 400 });

  const ok = await cancelBooking(customer.customer_id, id);
  if (!ok) return NextResponse.json({ errors: ["Booking not found or not cancellable."] }, { status: 404 });
  return NextResponse.json({ ok: true });
}

