import type { Metadata } from "next";
import { PageHeading } from "@/components/layout/PageHeading";

export const metadata: Metadata = {
  title: "Search Flights",
};

export default function SearchFlightsPage() {
  return (
    <div>
      <PageHeading
        title="Search Flights"
        description="Flight search UI will live here — filters for origin, destination, and travel dates."
      />
      <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center text-zinc-500 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
        <p className="text-base">
          Placeholder: search form and results will be added in a later step.
        </p>
      </div>
    </div>
  );
}
