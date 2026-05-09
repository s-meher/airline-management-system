export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-zinc-600 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8 dark:text-zinc-400">
        <p className="font-medium text-zinc-700 dark:text-zinc-300">
          CS 425 · Airline Flight Booking
        </p>
        <p className="text-zinc-500 dark:text-zinc-500">
          Database design project · PostgreSQL
        </p>
      </div>
    </footer>
  );
}
