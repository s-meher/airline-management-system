import type { Metadata } from "next";
import { PageHeading } from "@/components/layout/PageHeading";
import { SearchFlightsClient } from "@/components/search/SearchFlightsClient";
import { AIRLINES, AIRPORTS, FLIGHT_PRICES, FLIGHTS } from "@/lib/data";

export const metadata: Metadata = {
  title: "Search Flights",
};

export default function SearchFlightsPage() {
  return (
    <div>
      <PageHeading
        title="Search Flights"
        description="Use mock data to search direct flights by route and date. (No backend yet.)"
      />
      <SearchFlightsClient
        airports={AIRPORTS}
        airlines={AIRLINES}
        flights={FLIGHTS}
        flight_prices={FLIGHT_PRICES}
      />
    </div>
  );
}
