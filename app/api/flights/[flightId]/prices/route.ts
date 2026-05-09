import { NextResponse } from "next/server";
import { getCabinAvailabilityPublic } from "@/lib/db/inventory";
import { getPool } from "@/lib/db/pool";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ flightId: string }> },
) {
  const { flightId } = await params;
  const id = Number(flightId);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ errors: ["Invalid flight id"] }, { status: 400 });
  }

  const pool = getPool();
  const res = await pool.query<{
    cabin_class: string;
    amount: number;
    currency_code: string;
  }>(
    `SELECT cabin_class, amount::float8 AS amount, currency_code
     FROM flight_price
     WHERE flight_id = $1`,
    [id],
  );

  let economy: { amount: number; currency_code: string } | null = null;
  let first: { amount: number; currency_code: string } | null = null;
  for (const row of res.rows) {
    if (row.cabin_class === "economy") {
      economy = { amount: row.amount, currency_code: row.currency_code };
    }
    if (row.cabin_class === "first") {
      first = { amount: row.amount, currency_code: row.currency_code };
    }
  }

  const inv = await getCabinAvailabilityPublic(id);

  return NextResponse.json({
    economy,
    first,
    inventory: inv ?? {
      economy: { total: 0, booked: 0, remaining: 0 },
      first: { total: 0, booked: 0, remaining: 0 },
    },
  });
}
