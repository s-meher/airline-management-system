"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/search", label: "Search Flights" },
  { href: "/bookings", label: "Bookings" },
  { href: "/account", label: "My Account" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-sky-600 text-white shadow-sm shadow-sky-600/20"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
      }`}
    >
      {label}
    </Link>
  );
}

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/90 bg-white/90 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <span
            aria-hidden
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-600 to-sky-800 text-sm font-bold text-white shadow-md shadow-sky-900/15 ring-1 ring-white/20"
          >
            425
          </span>
          <div className="leading-tight">
            <p className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              FlightDesk
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              CS 425 airline booking
            </p>
          </div>
        </Link>

        <nav
          className="flex flex-wrap items-center gap-1 sm:justify-end"
          aria-label="Primary"
        >
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              active={isActive(pathname, item.href)}
            />
          ))}
        </nav>
      </div>
    </header>
  );
}
