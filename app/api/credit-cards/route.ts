import { NextResponse } from "next/server";
import { requireCustomerSession } from "@/lib/auth/requireCustomer";
import { createCreditCard, listCreditCards } from "@/lib/db/creditCards";

export async function GET() {
  const customer = await requireCustomerSession();
  if (!customer) return NextResponse.json({ errors: ["Sign in required."] }, { status: 401 });

  const creditCards = await listCreditCards(customer.customer_id);
  return NextResponse.json({ creditCards });
}

export async function POST(req: Request) {
  const customer = await requireCustomerSession();
  if (!customer) return NextResponse.json({ errors: ["Sign in required."] }, { status: 401 });

  const body = (await req.json().catch(() => null)) as
    | {
        billing_address_id?: number;
        card_brand?: string;
        last_four?: string;
        exp_month?: number;
        exp_year?: number;
      }
    | null;

  const billing_address_id = Number(body?.billing_address_id);
  const card_brand = body?.card_brand?.trim() ?? "";
  const last_four = body?.last_four?.trim() ?? "";
  const exp_month = Number(body?.exp_month);
  const exp_year = Number(body?.exp_year);

  const errors: string[] = [];
  if (!Number.isFinite(billing_address_id)) errors.push("Billing address is required.");
  if (!card_brand) errors.push("Card brand is required.");
  if (!/^\d{4}$/.test(last_four)) errors.push("Last four must be 4 digits.");
  if (!Number.isFinite(exp_month) || exp_month < 1 || exp_month > 12) errors.push("Exp month must be 1-12.");
  if (!Number.isFinite(exp_year) || exp_year < 2000) errors.push("Exp year is required.");

  if (errors.length > 0) return NextResponse.json({ errors }, { status: 400 });

  try {
    const creditCard = await createCreditCard({
      customer_id: customer.customer_id,
      billing_address_id,
      card_brand,
      last_four,
      exp_month,
      exp_year,
    });
    return NextResponse.json({ creditCard }, { status: 201 });
  } catch (e: unknown) {
    const msg = String(e);
    if (msg.includes("billing_address_id") && msg.includes("belongs to customer")) {
      return NextResponse.json(
        { errors: ["Billing address must belong to the active customer."] },
        { status: 409 },
      );
    }
    return NextResponse.json({ errors: ["Failed to create card."] }, { status: 500 });
  }
}

