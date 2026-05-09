import type { SearchHit } from "@/lib/models/search";

export type SearchSortOption = "departure" | "duration" | "price_economy" | "price_first";

export function departureMs(hit: SearchHit): number {
  const iso = hit.kind === "direct" ? hit.flight.scheduled_departure : hit.leg1.scheduled_departure;
  return new Date(iso).getTime();
}

export function durationMinutes(hit: SearchHit): number {
  return hit.kind === "direct" ? hit.flight.duration_minutes : hit.total_duration_minutes;
}

export function economyPrice(hit: SearchHit): number {
  return hit.fares.economy?.amount ?? Number.POSITIVE_INFINITY;
}

export function firstPrice(hit: SearchHit): number {
  return hit.fares.first?.amount ?? Number.POSITIVE_INFINITY;
}

export function compareSearchHits(a: SearchHit, b: SearchHit, sort: SearchSortOption): number {
  switch (sort) {
    case "departure":
      return departureMs(a) - departureMs(b);
    case "duration":
      return durationMinutes(a) - durationMinutes(b);
    case "price_economy":
      return economyPrice(a) - economyPrice(b);
    case "price_first":
      return firstPrice(a) - firstPrice(b);
    default:
      return 0;
  }
}

export function sortSearchHits(hits: SearchHit[], sort: SearchSortOption): SearchHit[] {
  return [...hits].sort((x, y) => compareSearchHits(x, y, sort));
}

export function paginateHits<T>(items: T[], offset: number, limit: number): T[] {
  return items.slice(offset, offset + limit);
}
