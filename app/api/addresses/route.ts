import { NextResponse } from "next/server";
import { requireCustomerSession } from "@/lib/auth/requireCustomer";
import { createAddress, listAddresses } from "@/lib/db/addresses";

export async function GET() {
  const customer = await requireCustomerSession();
  if (!customer) return NextResponse.json({ errors: ["Sign in required."] }, { status: 401 });

  const addresses = await listAddresses(customer.customer_id);
  return NextResponse.json({ addresses });
}

export async function POST(req: Request) {
  const customer = await requireCustomerSession();
  if (!customer) return NextResponse.json({ errors: ["Sign in required."] }, { status: 401 });

  const body = (await req.json().catch(() => null)) as
    | {
        line1?: string;
        line2?: string | null;
        city?: string;
        region?: string;
        postal_code?: string;
        country?: string;
        is_primary?: boolean;
      }
    | null;

  const line1 = body?.line1?.trim() ?? "";
  const city = body?.city?.trim() ?? "";
  const region = body?.region?.trim() ?? "";
  const postal_code = body?.postal_code?.trim() ?? "";
  const country = body?.country?.trim() ?? "";

  const errors: string[] = [];
  if (!line1) errors.push("Address line 1 is required.");
  if (!city) errors.push("City is required.");
  if (!region) errors.push("State/region is required.");
  if (!postal_code) errors.push("Postal code is required.");
  if (!country) errors.push("Country is required.");

  if (errors.length > 0) return NextResponse.json({ errors }, { status: 400 });

  const address = await createAddress({
    customer_id: customer.customer_id,
    line1,
    line2: body?.line2?.trim() ? body!.line2!.trim() : null,
    city,
    region,
    postal_code,
    country,
    is_primary: Boolean(body?.is_primary),
  });

  return NextResponse.json({ address }, { status: 201 });
}

