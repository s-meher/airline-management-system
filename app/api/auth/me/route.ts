import { NextResponse } from "next/server";
import { requireCustomerSession } from "@/lib/auth/requireCustomer";

export async function GET() {
  const customer = await requireCustomerSession();
  if (!customer) return NextResponse.json({ customer: null }, { status: 200 });
  return NextResponse.json({ customer });
}
