import { NextResponse } from "next/server";
import { listFlightsWithFaresInOrder } from "@/lib/db/flights";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const idsParam = searchParams.get("ids");
  if (!idsParam?.trim()) {
    return NextResponse.json({ errors: ["Query parameter ids is required (comma-separated flight ids)."] }, { status: 400 });
  }

  const flight_ids = [
    ...new Set(
      idsParam
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isFinite(n) && n > 0),
    ),
  ];

  if (flight_ids.length === 0) {
    return NextResponse.json({ errors: ["At least one valid flight id is required."] }, { status: 400 });
  }

  try {
    const flights = await listFlightsWithFaresInOrder(flight_ids);
    if (flights.length !== flight_ids.length) {
      return NextResponse.json({ errors: ["One or more flights were not found."] }, { status: 404 });
    }
    return NextResponse.json({ flights });
  } catch {
    return NextResponse.json({ errors: ["Failed to load flights."] }, { status: 500 });
  }
}
