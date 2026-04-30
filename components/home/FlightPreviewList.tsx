import type { Flight } from "@/lib/models";
import { airlineById, airportByCode } from "@/lib/data";
import { formatDurationMinutes, formatUtcDateTime } from "@/lib/utils/format";

export function FlightPreviewList({ flights }: { flights: readonly Flight[] }) {
  return (
    <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-zinc-50/60 dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950/20">
      {flights.map((f) => {
        const airline = airlineById.get(f.airline_id);
        const origin = airportByCode.get(f.origin_airport_code);
        const dest = airportByCode.get(f.destination_airport_code);
        const airlineFlightNumber = `${airline?.iata_code ?? "?"}${f.flight_number}`;
        const routeCity = `${origin?.city ?? f.origin_airport_code} → ${
          dest?.city ?? f.destination_airport_code
        }`;

        return (
          <li key={f.flight_id} className="px-4 py-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {airlineFlightNumber} ·{" "}
                  {f.origin_airport_code} → {f.destination_airport_code}
                </p>
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                  {routeCity}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  {formatUtcDateTime(f.scheduled_departure)} (UTC)
                </p>
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                  {formatDurationMinutes(f.duration_minutes)}
                </p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

