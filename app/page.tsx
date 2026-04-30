import Link from "next/link";
import { PageHeading } from "@/components/layout/PageHeading";

export default function HomePage() {
  return (
    <div>
      <PageHeading
        title="Welcome to FlightDesk"
        description="A demo airline booking experience for CS 425 — search itineraries, inspect connections, book flights, and manage trips. Mock data and local state only for now."
      />

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Demo flows (coming next)
          </h2>
          <ul className="mt-4 space-y-3 text-zinc-600 dark:text-zinc-400">
            <li>Search flights by airports and dates</li>
            <li>View connection details</li>
            <li>Book and manage itineraries</li>
            <li>Update addresses and payment methods</li>
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/search"
              className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
            >
              Search Flights
            </Link>
            <Link
              href="/bookings"
              className="inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              View Bookings
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/80 p-8 dark:border-zinc-700 dark:bg-zinc-900/40">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Data model preview
          </h2>
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">
            The full app will mirror your schema: customers, addresses, credit
            cards, airports, airlines, flights, flight prices, bookings, and
            booking-flight links.
          </p>
          <Link
            href="/account"
            className="mt-6 inline-flex text-sm font-semibold text-sky-700 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300"
          >
            Open My Account →
          </Link>
        </section>
      </div>
    </div>
  );
}
