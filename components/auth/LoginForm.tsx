"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { dispatchSessionChanged } from "@/components/account/SessionUser";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FieldLabel, TextInput } from "@/components/ui/Field";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit() {
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = (await res.json().catch(() => null)) as { errors?: string[] } | null;
      if (!res.ok) {
        setError(json?.errors?.[0] ?? "Sign in failed.");
        return;
      }
      dispatchSessionChanged();
      router.push("/account");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="p-6">
      <form
        className="grid max-w-md gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <label>
          <FieldLabel>Email</FieldLabel>
          <TextInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </label>
        <label>
          <FieldLabel>Password</FieldLabel>
          <TextInput
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>
        {error ? <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p> : null}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? "Signing in…" : "Sign in"}
          </Button>
          <Link
            href="/register"
            className="inline-flex items-center rounded-xl px-4 py-2 text-sm font-semibold text-sky-700 hover:underline dark:text-sky-300"
          >
            Create account
          </Link>
        </div>
      </form>
    </Card>
  );
}
