import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="absolute inset-0 bg-linear-to-br from-sky-50 via-white to-zinc-50 dark:from-sky-950/35 dark:via-zinc-950 dark:to-zinc-950" />
      <div className="relative px-7 py-10 sm:px-10 sm:py-12 md:px-12">
        <div className="max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-200">
            CS 425 database project · PostgreSQL-backed
          </p>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-50">
            Book flights like a real product.
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-zinc-600 dark:text-zinc-300">
            FlightDesk is a full-stack airline booking UI aligned to a relational
            schema — airports, airlines, flights, fares, customers, payments, and
            bookings — backed by PostgreSQL.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/search"
              className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-sky-600/20 transition hover:bg-sky-700"
            >
              Search flights
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-6 py-3 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-6 py-3 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              Create account
            </Link>
            <Link
              href="/bookings"
              className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-6 py-3 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              View bookings
            </Link>
          </div>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/50 bg-white/70 px-4 py-3 text-sm text-zinc-700 shadow-sm backdrop-blur-sm dark:border-zinc-800/60 dark:bg-zinc-950/40 dark:text-zinc-200">
            <p className="font-semibold">End-to-end flow</p>
            <p className="mt-0.5 text-zinc-600 dark:text-zinc-400">
              Search → compare → book → manage
            </p>
          </div>
          <div className="rounded-2xl border border-white/50 bg-white/70 px-4 py-3 text-sm text-zinc-700 shadow-sm backdrop-blur-sm dark:border-zinc-800/60 dark:bg-zinc-950/40 dark:text-zinc-200">
            <p className="font-semibold">Schema-aligned UI</p>
            <p className="mt-0.5 text-zinc-600 dark:text-zinc-400">
              Customers, payments, bookings
            </p>
          </div>
          <div className="rounded-2xl border border-white/50 bg-white/70 px-4 py-3 text-sm text-zinc-700 shadow-sm backdrop-blur-sm dark:border-zinc-800/60 dark:bg-zinc-950/40 dark:text-zinc-200">
            <p className="font-semibold">Easy to extend</p>
            <p className="mt-0.5 text-zinc-600 dark:text-zinc-400">
              Inventory-backed cabins, rate limits, and room for ops tooling
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

