"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { DbCustomer } from "@/lib/db/customers";

export const SESSION_CHANGED_EVENT = "flightdesk-session-changed";

export function dispatchSessionChanged() {
  window.dispatchEvent(new CustomEvent(SESSION_CHANGED_EVENT));
}

export function SessionUser() {
  const router = useRouter();
  const [customer, setCustomer] = useState<DbCustomer | null | undefined>(undefined);
  const [loggingOut, setLoggingOut] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/auth/me", { cache: "no-store" });
    const json = (await res.json().catch(() => null)) as { customer: DbCustomer | null } | null;
    setCustomer(json?.customer ?? null);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
    function onSessionChanged() {
      queueMicrotask(() => {
        void load();
      });
    }
    window.addEventListener(SESSION_CHANGED_EVENT, onSessionChanged);
    return () => window.removeEventListener(SESSION_CHANGED_EVENT, onSessionChanged);
  }, [load]);

  if (customer === undefined) {
    return <span className="text-xs text-zinc-500 dark:text-zinc-400">Loading…</span>;
  }

  if (!customer) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-50 dark:text-sky-300 dark:hover:bg-sky-950/40"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex max-w-[280px] flex-col items-end gap-1 sm:max-w-none sm:flex-row sm:items-center sm:gap-2">
      <span className="truncate text-xs text-zinc-600 dark:text-zinc-400" title={customer.email}>
        <span className="font-semibold text-zinc-800 dark:text-zinc-200">
          {customer.first_name} {customer.last_name}
        </span>
      </span>
      <button
        type="button"
        disabled={loggingOut}
        className="rounded-lg px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        onClick={async () => {
          setLoggingOut(true);
          try {
            await fetch("/api/auth/logout", { method: "POST" });
            setCustomer(null);
            dispatchSessionChanged();
            router.refresh();
          } finally {
            setLoggingOut(false);
          }
        }}
      >
        {loggingOut ? "…" : "Sign out"}
      </button>
    </div>
  );
}
