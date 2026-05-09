"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { dispatchSessionChanged } from "@/components/account/SessionUser";
import { Card } from "@/components/ui/Card";
import { Button, ButtonLink } from "@/components/ui/Button";
import { FieldLabel, TextInput } from "@/components/ui/Field";
import type { DbCustomer } from "@/lib/db/customers";

type Status =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "error"; message: string }
  | { kind: "success"; customer: DbCustomer };

export function RegisterCustomerForm() {
  const router = useRouter();
  const [first_name, setFirstName] = useState("");
  const [last_name, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function submit() {
    setStatus({ kind: "saving" });
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ first_name, last_name, email, password }),
      });

      const json = (await res.json().catch(() => null)) as
        | { customer: DbCustomer }
        | { errors: string[] }
        | null;

      if (!res.ok) {
        const msg =
          json && "errors" in json && Array.isArray(json.errors) && json.errors[0]
            ? json.errors[0]
            : "Registration failed.";
        setStatus({ kind: "error", message: msg });
        return;
      }

      if (!json || !("customer" in json)) {
        setStatus({ kind: "error", message: "Registration failed." });
        return;
      }

      dispatchSessionChanged();
      setStatus({ kind: "success", customer: json.customer });
      router.push("/account");
      router.refresh();
    } catch (e) {
      setStatus({
        kind: "error",
        message: e instanceof Error ? e.message : "Registration failed.",
      });
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <form
          className="grid gap-4 md:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <label>
            <FieldLabel>First name</FieldLabel>
            <TextInput
              value={first_name}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Jane"
              autoComplete="given-name"
            />
          </label>
          <label>
            <FieldLabel>Last name</FieldLabel>
            <TextInput
              value={last_name}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Doe"
              autoComplete="family-name"
            />
          </label>
          <label>
            <FieldLabel>Email</FieldLabel>
            <TextInput
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
              autoComplete="email"
              inputMode="email"
            />
          </label>

          <label className="md:col-span-3">
            <FieldLabel>Password</FieldLabel>
            <TextInput
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />
          </label>

          <div className="md:col-span-3 flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="text-sm">
              {status.kind === "error" ? (
                <span className="text-rose-700 dark:text-rose-300">
                  {status.message}
                </span>
              ) : null}
              {status.kind === "success" ? (
                <span className="text-emerald-700 dark:text-emerald-300">
                  Registered {status.customer.first_name} {status.customer.last_name}.
                </span>
              ) : null}
              {status.kind === "idle" ? (
                <span className="text-zinc-600 dark:text-zinc-400">
                  Creates your profile and signs you in (session cookie).
                </span>
              ) : null}
              {status.kind === "saving" ? (
                <span className="text-zinc-600 dark:text-zinc-400">Saving…</span>
              ) : null}
            </div>
            <div className="flex gap-2">
              <ButtonLink href="/login" variant="secondary" size="sm">
                Sign in instead
              </ButtonLink>
              <Button type="submit" disabled={status.kind === "saving"} size="sm">
                Register
              </Button>
            </div>
          </div>
        </form>
      </Card>

      <Card className="p-6 text-sm text-zinc-600 dark:text-zinc-400">
        Already have a seeded database user? Use the same email after reset — default seed password is in{" "}
        <span className="font-mono text-xs">README.md</span> (<span className="font-mono">SEED_USER_PASSWORD</span>
        ).
      </Card>
    </div>
  );
}
