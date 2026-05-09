import type { Metadata } from "next";
import { PageHeading } from "@/components/layout/PageHeading";
import { SearchFlightsClient } from "@/components/search/SearchFlightsClient";
import { listAirlines, listAirports } from "@/lib/db/catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search Flights",
};

export default async function SearchFlightsPage() {
  const [airports, airlines] = await Promise.all([listAirports(), listAirlines()]);

  return (
    <div>
      <PageHeading
        title="Search Flights"
        description="Search nonstop and one-stop itineraries by route and date (UTC departure day). Results come from PostgreSQL."
      />
      <SearchFlightsClient airports={airports} airlines={airlines} />
    </div>
  );
}
