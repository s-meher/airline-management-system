import { describe, expect, it } from "vitest";
import type { SearchHit } from "@/lib/models/search";
import {
  compareSearchHits,
  paginateHits,
  sortSearchHits,
} from "@/lib/search/sortSearchHits";

function direct(
  flight_id: number,
  departure: string,
  duration_minutes: number,
  economy: number | null,
  first: number | null,
): SearchHit {
  return {
    kind: "direct",
    flight: {
      flight_id,
      airline_id: 1,
      flight_number: "100",
      origin_airport_code: "ORD",
      destination_airport_code: "SFO",
      scheduled_departure: departure,
      scheduled_arrival: departure,
      duration_minutes,
    },
    fares: {
      economy: economy != null ? { amount: economy, currency_code: "USD" } : null,
      first: first != null ? { amount: first, currency_code: "USD" } : null,
    },
  };
}

describe("sortSearchHits", () => {
  it("sorts by departure ascending", () => {
    const a = direct(1, "2026-06-01T10:00:00Z", 120, 100, 300);
    const b = direct(2, "2026-06-01T08:00:00Z", 90, 120, 400);
    expect(sortSearchHits([a, b], "departure")).toEqual([b, a]);
  });

  it("sorts by duration ascending", () => {
    const a = direct(1, "2026-06-01T10:00:00Z", 200, 100, 300);
    const b = direct(2, "2026-06-01T10:00:00Z", 90, 120, 400);
    expect(sortSearchHits([a, b], "duration")).toEqual([b, a]);
  });

  it("sorts by economy price ascending; missing fares sort last", () => {
    const noEco = direct(1, "2026-06-01T10:00:00Z", 90, null, 300);
    const cheap = direct(2, "2026-06-01T10:00:00Z", 90, 50, 400);
    const pricey = direct(3, "2026-06-01T10:00:00Z", 90, 200, 500);
    expect(sortSearchHits([noEco, pricey, cheap], "price_economy")).toEqual([
      cheap,
      pricey,
      noEco,
    ]);
  });

  it("compareSearchHits is stable for equal keys", () => {
    const x = direct(1, "2026-06-01T10:00:00Z", 90, 100, 200);
    const y = direct(2, "2026-06-01T10:00:00Z", 90, 100, 200);
    expect(compareSearchHits(x, y, "departure")).toBe(0);
  });
});

describe("paginateHits", () => {
  it("returns correct slice", () => {
    expect(paginateHits([1, 2, 3, 4], 1, 2)).toEqual([2, 3]);
    expect(paginateHits([1, 2], 10, 5)).toEqual([]);
  });
});
