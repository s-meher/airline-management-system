import { NextResponse } from "next/server";
import { requireCustomerSession } from "@/lib/auth/requireCustomer";
import { deleteCreditCard, updateCreditCard } from "@/lib/db/creditCards";

function parseId(raw: string) {
  const n = Number(raw);
  return Number.isFinite(n) ? n : NaN;
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ creditCardId: string }> },
) {
  const customer = await requireCustomerSession();
  if (!customer) return NextResponse.json({ errors: ["Sign in required."] }, { status: 401 });

  const { creditCardId } = await params;
  const id = parseId(creditCardId);
  if (!Number.isFinite(id)) return NextResponse.json({ errors: ["Invalid card id."] }, { status: 400 });

  const body = (await req.json().catch(() => null)) as
    | Partial<{
        billing_address_id: number;
        card_brand: string;
        last_four: string;
        exp_month: number;
        exp_year: number;
      }>
    | null;

  try {
    const next = await updateCreditCard(customer.customer_id, id, {
      billing_address_id: body?.billing_address_id,
      card_brand: body?.card_brand?.trim(),
      last_four: body?.last_four?.trim(),
      exp_month: body?.exp_month,
      exp_year: body?.exp_year,
    });

    if (!next) return NextResponse.json({ errors: ["Card not found."] }, { status: 404 });
    return NextResponse.json({ creditCard: next });
  } catch (e: unknown) {
    const msg = String(e);
    if (msg.includes("billing_address_id") && msg.includes("belongs to customer")) {
      return NextResponse.json(
        { errors: ["Billing address must belong to the active customer."] },
        { status: 409 },
      );
    }
    return NextResponse.json({ errors: ["Failed to update card."] }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ creditCardId: string }> },
) {
  const customer = await requireCustomerSession();
  if (!customer) return NextResponse.json({ errors: ["Sign in required."] }, { status: 401 });

  const { creditCardId } = await params;
  const id = parseId(creditCardId);
  if (!Number.isFinite(id)) return NextResponse.json({ errors: ["Invalid card id."] }, { status: 400 });

  try {
    const ok = await deleteCreditCard(customer.customer_id, id);
    if (!ok) return NextResponse.json({ errors: ["Card not found."] }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = String(e);
    if (msg.includes("violates foreign key constraint")) {
      return NextResponse.json(
        { errors: ["Can’t delete this card because it’s used by a booking."] },
        { status: 409 },
      );
    }
    return NextResponse.json({ errors: ["Failed to delete card."] }, { status: 500 });
  }
}

