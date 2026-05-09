"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FieldLabel, TextInput } from "@/components/ui/Field";
import { SESSION_CHANGED_EVENT } from "@/components/account/SessionUser";
import type { DbAddress } from "@/lib/db/addresses";

type State =
  | { kind: "loading" }
  | { kind: "ready"; addresses: DbAddress[] }
  | { kind: "error"; message: string };

export function AddressesPanel() {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    line1: "",
    line2: "",
    city: "",
    region: "",
    postal_code: "",
    country: "USA",
    is_primary: false,
  });

  async function load() {
    setState({ kind: "loading" });
    try {
      const res = await fetch("/api/addresses", { cache: "no-store" });
      const json = (await res.json().catch(() => null)) as
        | { addresses: DbAddress[] }
        | { errors: string[] }
        | null;
      if (!res.ok) {
        const msg =
          json && "errors" in json && json.errors?.[0]
            ? json.errors[0]
            : "Failed to load addresses.";
        setState({ kind: "error", message: msg });
        return;
      }
      setState({ kind: "ready", addresses: (json as any).addresses ?? [] });
    } catch (e) {
      setState({
        kind: "error",
        message: e instanceof Error ? e.message : "Failed to load addresses.",
      });
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    function onChanged() {
      void load();
    }
    window.addEventListener(SESSION_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(SESSION_CHANGED_EVENT, onChanged);
  }, []);

  const addresses = useMemo(() => (state.kind === "ready" ? state.addresses : []), [state]);
  const isEditing = editingId !== null;

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Addresses</p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Saved addresses for the active customer.
          </p>
        </div>
      </div>

      {state.kind === "error" ? (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
          {state.message}
        </div>
      ) : null}

      {state.kind === "loading" ? (
        <div className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">Loading…</div>
      ) : null}

      {state.kind === "ready" ? (
        <div className="mt-4 grid gap-3">
          {addresses.length === 0 ? (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-zinc-400">
              No addresses yet.
            </div>
          ) : null}

          {addresses.map((a) => (
            <div
              key={a.address_id}
              className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {a.line1}
                    {a.is_primary ? (
                      <span className="ml-2 rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-800 dark:border-sky-900/40 dark:bg-sky-950/30 dark:text-sky-200">
                        primary
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {a.city}, {a.region} {a.postal_code} · {a.country}
                  </p>
                  {a.line2 ? (
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">{a.line2}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={saving}
                    onClick={() => {
                      setEditingId(a.address_id);
                      setForm({
                        line1: a.line1,
                        line2: a.line2 ?? "",
                        city: a.city,
                        region: a.region,
                        postal_code: a.postal_code,
                        country: a.country,
                        is_primary: a.is_primary,
                      });
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={saving || a.is_primary}
                    onClick={async () => {
                      setSaving(true);
                      try {
                        await fetch(`/api/addresses/${a.address_id}`, {
                          method: "PUT",
                          headers: { "content-type": "application/json" },
                          body: JSON.stringify({ is_primary: true }),
                        });
                        await load();
                      } finally {
                        setSaving(false);
                      }
                    }}
                  >
                    Make primary
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="danger"
                    disabled={saving}
                    onClick={async () => {
                      setSaving(true);
                      try {
                        const res = await fetch(`/api/addresses/${a.address_id}`, {
                          method: "DELETE",
                        });
                        if (!res.ok) {
                          const json = (await res.json().catch(() => null)) as { errors?: string[] } | null;
                          alert(json?.errors?.[0] ?? "Failed to delete address.");
                        }
                        await load();
                      } finally {
                        setSaving(false);
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-6 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {isEditing ? `Edit address #${editingId}` : "Add address"}
          </p>
          {isEditing ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={saving}
              onClick={() => {
                setEditingId(null);
                setForm({
                  line1: "",
                  line2: "",
                  city: "",
                  region: "",
                  postal_code: "",
                  country: "USA",
                  is_primary: false,
                });
              }}
            >
              Cancel edit
            </Button>
          ) : null}
        </div>
        <form
          className="mt-4 grid gap-4 md:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault();
            setSaving(true);
            try {
              const res = await fetch(
                isEditing ? `/api/addresses/${editingId}` : "/api/addresses",
                {
                  method: isEditing ? "PUT" : "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify(form),
                },
              );
              if (!res.ok) {
                const json = (await res.json().catch(() => null)) as { errors?: string[] } | null;
                alert(json?.errors?.[0] ?? "Failed to save address.");
                return;
              }
              setEditingId(null);
              setForm({
                line1: "",
                line2: "",
                city: "",
                region: "",
                postal_code: "",
                country: "USA",
                is_primary: false,
              });
              await load();
            } finally {
              setSaving(false);
            }
          }}
        >
          <label className="md:col-span-2">
            <FieldLabel>Address line 1</FieldLabel>
            <TextInput value={form.line1} onChange={(e) => setForm((p) => ({ ...p, line1: e.target.value }))} />
          </label>
          <label className="md:col-span-2">
            <FieldLabel>Address line 2 (optional)</FieldLabel>
            <TextInput value={form.line2} onChange={(e) => setForm((p) => ({ ...p, line2: e.target.value }))} />
          </label>
          <label>
            <FieldLabel>City</FieldLabel>
            <TextInput value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} />
          </label>
          <label>
            <FieldLabel>State/Region</FieldLabel>
            <TextInput value={form.region} onChange={(e) => setForm((p) => ({ ...p, region: e.target.value }))} />
          </label>
          <label>
            <FieldLabel>Postal code</FieldLabel>
            <TextInput value={form.postal_code} onChange={(e) => setForm((p) => ({ ...p, postal_code: e.target.value }))} />
          </label>
          <label>
            <FieldLabel>Country</FieldLabel>
            <TextInput value={form.country} onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))} />
          </label>
          <label className="md:col-span-2 flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              checked={form.is_primary}
              onChange={(e) => setForm((p) => ({ ...p, is_primary: e.target.checked }))}
            />
            <span className="text-sm text-zinc-700 dark:text-zinc-300">Set as primary</span>
          </label>
          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" size="sm" disabled={saving}>
              {isEditing ? "Save changes" : "Add address"}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
}

