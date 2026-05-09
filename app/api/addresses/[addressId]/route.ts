import { NextResponse } from "next/server";
import { requireCustomerSession } from "@/lib/auth/requireCustomer";
import { deleteAddress, updateAddress } from "@/lib/db/addresses";

function parseId(raw: string) {
  const n = Number(raw);
  return Number.isFinite(n) ? n : NaN;
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ addressId: string }> },
) {
  const customer = await requireCustomerSession();
  if (!customer) return NextResponse.json({ errors: ["Sign in required."] }, { status: 401 });

  const { addressId } = await params;
  const id = parseId(addressId);
  if (!Number.isFinite(id)) return NextResponse.json({ errors: ["Invalid address id."] }, { status: 400 });

  const body = (await req.json().catch(() => null)) as
    | Partial<{
        line1: string;
        line2: string | null;
        city: string;
        region: string;
        postal_code: string;
        country: string;
        is_primary: boolean;
      }>
    | null;

  const next = await updateAddress(customer.customer_id, id, {
    line1: body?.line1?.trim(),
    line2: body?.line2 === null ? null : body?.line2?.trim(),
    city: body?.city?.trim(),
    region: body?.region?.trim(),
    postal_code: body?.postal_code?.trim(),
    country: body?.country?.trim(),
    is_primary: typeof body?.is_primary === "boolean" ? body.is_primary : undefined,
  });

  if (!next) return NextResponse.json({ errors: ["Address not found."] }, { status: 404 });
  return NextResponse.json({ address: next });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ addressId: string }> },
) {
  const customer = await requireCustomerSession();
  if (!customer) return NextResponse.json({ errors: ["Sign in required."] }, { status: 401 });

  const { addressId } = await params;
  const id = parseId(addressId);
  if (!Number.isFinite(id)) return NextResponse.json({ errors: ["Invalid address id."] }, { status: 400 });

  try {
    const ok = await deleteAddress(customer.customer_id, id);
    if (!ok) return NextResponse.json({ errors: ["Address not found."] }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = String(e);
    if (msg.includes("violates foreign key constraint")) {
      return NextResponse.json(
        { errors: ["Can’t delete this address because it’s used as a billing address."] },
        { status: 409 },
      );
    }
    return NextResponse.json({ errors: ["Failed to delete address."] }, { status: 500 });
  }
}

