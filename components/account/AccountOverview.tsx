"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import type { DbCustomer } from "@/lib/db/customers";
import { SESSION_CHANGED_EVENT } from "@/components/account/SessionUser";
import { AddressesPanel } from "@/components/account/AddressesPanel";
import { CreditCardsPanel } from "@/components/account/CreditCardsPanel";

type State =
  | { kind: "loading" }
  | { kind: "none" }
  | { kind: "ready"; customer: DbCustomer }
  | { kind: "error"; message: string };

export function AccountOverview() {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load session.");
        const json = (await res.json()) as { customer: DbCustomer | null };
        if (cancelled) return;
        setState(json.customer ? { kind: "ready", customer: json.customer } : { kind: "none" });
      } catch (e) {
        if (cancelled) return;
        setState({ kind: "error", message: e instanceof Error ? e.message : "Failed to load." });
      }
    }
    load();

    function onChanged() {
      load();
    }
    window.addEventListener(SESSION_CHANGED_EVENT, onChanged);
    return () => {
      cancelled = true;
      window.removeEventListener(SESSION_CHANGED_EVENT, onChanged);
    };
  }, []);

  if (state.kind === "loading") {
    return (
      <Card className="p-8 text-sm text-zinc-600 dark:text-zinc-400">
        Loading your account…
      </Card>
    );
  }

  if (state.kind === "error") {
    return (
      <Card className="p-8">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Couldn’t load your account
        </p>
        <p className="mt-2 text-sm text-rose-700 dark:text-rose-300">{state.message}</p>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          Make sure Postgres is running and `DATABASE_URL` is set.
        </p>
      </Card>
    );
  }

  if (state.kind === "none") {
    return (
      <Card className="p-8">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Sign in to manage your account
        </p>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Register a new profile or sign in with an existing email and password.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <ButtonLink href="/login" variant="primary" size="sm">
            Sign in
          </ButtonLink>
          <ButtonLink href="/register" variant="secondary" size="sm">
            Register
          </ButtonLink>
          <Link href="/search" className="text-sm font-semibold text-sky-700 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300">
            Search flights
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Profile
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Name</p>
            <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {state.customer.first_name} {state.customer.last_name}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Email</p>
            <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {state.customer.email}
            </p>
          </div>
        </div>
      </Card>

      <AddressesPanel />
      <CreditCardsPanel />
    </div>
  );
}

