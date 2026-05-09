import { NextResponse } from "next/server";
import { searchFlights } from "@/lib/db/search";
import { clientIp, rateLimitAllow } from "@/lib/db/rateLimit";
import type { SearchSortOption } from "@/lib/search/sortSearchHits";
import { paginateHits, sortSearchHits } from "@/lib/search/sortSearchHits";
import type { CabinClass } from "@/lib/models/types";

export async function GET(req: Request) {
  const ip = clientIp(req);
  const rl = await rateLimitAllow(`search:${ip}`, 90);
  if (!rl) {
    return NextResponse.json({ errors: ["Too many searches. Slow down."] }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const origin = (searchParams.get("origin") ?? "").trim().toUpperCase();
  const destination = (searchParams.get("destination") ?? "").trim().toUpperCase();
  const date = (searchParams.get("date") ?? "").trim();
  const dateEndRaw = (searchParams.get("date_end") ?? "").trim();
  const cabinRaw = (searchParams.get("cabin") ?? "any").trim().toLowerCase();
  const sortRaw = (searchParams.get("sort") ?? "departure").trim().toLowerCase();
  const airlinesRaw = (searchParams.get("airlines") ?? "").trim();

  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 40)));
  const offset = Math.max(0, Number(searchParams.get("offset") ?? 0));

  const errors: string[] = [];
  if (!origin) errors.push("Origin airport is required.");
  if (!destination) errors.push("Destination airport is required.");
  if (!date) errors.push("Travel date is required.");
  if (origin && destination && origin === destination) {
    errors.push("Departure and destination cannot be the same.");
  }

  let cabin_class: "any" | CabinClass = "any";
  if (cabinRaw === "any") cabin_class = "any";
  else if (cabinRaw === "economy") cabin_class = "economy";
  else if (cabinRaw === "first") cabin_class = "first";
  else errors.push("Invalid cabin filter.");

  const sortAllowed: SearchSortOption[] = ["departure", "duration", "price_economy", "price_first"];
  const sort = (sortAllowed.includes(sortRaw as SearchSortOption) ? sortRaw : "departure") as SearchSortOption;

  let airline_ids: number[] = [];
  if (airlinesRaw) {
    airline_ids = airlinesRaw
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n) && n > 0);
  }

  if (errors.length > 0) return NextResponse.json({ errors }, { status: 400 });

  try {
    let hits = await searchFlights({
      origin_airport_code: origin,
      destination_airport_code: destination,
      travel_date_start: date,
      travel_date_end: dateEndRaw || undefined,
      cabin_class,
      airline_ids: airline_ids.length ? airline_ids : undefined,
    });
    hits = sortSearchHits(hits, sort);
    const total = hits.length;
    hits = paginateHits(hits, offset, limit);
    return NextResponse.json({ hits, total, sort, limit, offset });
  } catch {
    return NextResponse.json({ errors: ["Search failed."] }, { status: 500 });
  }
}
