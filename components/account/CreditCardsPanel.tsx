"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FieldLabel, SelectInput, TextInput } from "@/components/ui/Field";
import { SESSION_CHANGED_EVENT } from "@/components/account/SessionUser";
import type { DbAddress } from "@/lib/db/addresses";
import type { DbCreditCard } from "@/lib/db/creditCards";

type CardsState =
  | { kind: "loading" }
  | { kind: "ready"; cards: DbCreditCard[]; addresses: DbAddress[] }
  | { kind: "error"; message: string };

export function CreditCardsPanel() {
  const [state, setState] = useState<CardsState>({ kind: "loading" });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    billing_address_id: "",
    card_brand: "VISA",
    last_four: "",
    exp_month: "",
    exp_year: "",
  });

  async function load() {
    setState({ kind: "loading" });
    try {
      const [cardsRes, addrRes] = await Promise.all([
        fetch("/api/credit-cards", { cache: "no-store" }),
        fetch("/api/addresses", { cache: "no-store" }),
      ]);

      const cardsJson = (await cardsRes.json().catch(() => null)) as any;
      const addrJson = (await addrRes.json().catch(() => null)) as any;

      if (!cardsRes.ok) throw new Error(cardsJson?.errors?.[0] ?? "Failed to load cards.");
      if (!addrRes.ok) throw new Error(addrJson?.errors?.[0] ?? "Failed to load addresses.");

      setState({
        kind: "ready",
        cards: cardsJson.creditCards ?? [],
        addresses: addrJson.addresses ?? [],
      });
    } catch (e) {
      setState({
        kind: "error",
        message: e instanceof Error ? e.message : "Failed to load cards.",
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

  const cards = useMemo(() => (state.kind === "ready" ? state.cards : []), [state]);
  const addresses = useMemo(() => (state.kind === "ready" ? state.addresses : []), [state]);
  const addressLabel = (a: DbAddress) =>
    `${a.line1}, ${a.city} ${a.region} ${a.postal_code}${a.is_primary ? " (primary)" : ""}`;
  const isEditing = editingId !== null;

  return (
    <Card className="p-6">
      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Credit cards</p>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Payment methods for the signed-in customer.
      </p>

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
          {cards.length === 0 ? (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-zinc-400">
              No cards yet.
            </div>
          ) : null}

          {cards.map((c) => (
            <div
              key={c.credit_card_id}
              className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {c.card_brand} •••• {c.last_four}
                  </p>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    Exp {String(c.exp_month).padStart(2, "0")}/{c.exp_year} · Billing address #{c.billing_address_id}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={saving}
                    onClick={() => {
                      setEditingId(c.credit_card_id);
                      setForm({
                        billing_address_id: String(c.billing_address_id),
                        card_brand: c.card_brand,
                        last_four: c.last_four,
                        exp_month: String(c.exp_month),
                        exp_year: String(c.exp_year),
                      });
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="danger"
                    disabled={saving}
                    onClick={async () => {
                      setSaving(true);
                      try {
                        const res = await fetch(`/api/credit-cards/${c.credit_card_id}`, {
                          method: "DELETE",
                        });
                        if (!res.ok) {
                          const json = (await res.json().catch(() => null)) as { errors?: string[] } | null;
                          alert(json?.errors?.[0] ?? "Failed to delete card.");
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
            {isEditing ? `Edit card #${editingId}` : "Add card"}
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
                  billing_address_id: "",
                  card_brand: "VISA",
                  last_four: "",
                  exp_month: "",
                  exp_year: "",
                });
              }}
            >
              Cancel edit
            </Button>
          ) : null}
        </div>
        {state.kind === "ready" && addresses.length === 0 ? (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
            Add an address first so you can choose a billing address.
          </div>
        ) : null}

        <form
          className="mt-4 grid gap-4 md:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault();
            setSaving(true);
            try {
              const res = await fetch(
                isEditing ? `/api/credit-cards/${editingId}` : "/api/credit-cards",
                {
                  method: isEditing ? "PUT" : "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({
                    billing_address_id: Number(form.billing_address_id),
                    card_brand: form.card_brand,
                    last_four: form.last_four,
                    exp_month: Number(form.exp_month),
                    exp_year: Number(form.exp_year),
                  }),
                },
              );
              if (!res.ok) {
                const json = (await res.json().catch(() => null)) as { errors?: string[] } | null;
                alert(json?.errors?.[0] ?? "Failed to save card.");
                return;
              }
              setEditingId(null);
              setForm({
                billing_address_id: "",
                card_brand: "VISA",
                last_four: "",
                exp_month: "",
                exp_year: "",
              });
              await load();
            } finally {
              setSaving(false);
            }
          }}
        >
          <label className="md:col-span-2">
            <FieldLabel>Billing address</FieldLabel>
            <SelectInput
              value={form.billing_address_id}
              onChange={(e) => setForm((p) => ({ ...p, billing_address_id: e.target.value }))}
            >
              <option value="">Select address</option>
              {addresses.map((a) => (
                <option key={a.address_id} value={String(a.address_id)}>
                  {addressLabel(a)}
                </option>
              ))}
            </SelectInput>
          </label>

          <label>
            <FieldLabel>Brand</FieldLabel>
            <SelectInput
              value={form.card_brand}
              onChange={(e) => setForm((p) => ({ ...p, card_brand: e.target.value }))}
            >
              <option value="VISA">VISA</option>
              <option value="Mastercard">Mastercard</option>
              <option value="Amex">Amex</option>
              <option value="Discover">Discover</option>
            </SelectInput>
          </label>
          <label>
            <FieldLabel>Last 4 digits</FieldLabel>
            <TextInput
              inputMode="numeric"
              maxLength={4}
              value={form.last_four}
              onChange={(e) => setForm((p) => ({ ...p, last_four: e.target.value.replace(/[^\d]/g, "") }))}
              placeholder="1234"
            />
          </label>
          <label>
            <FieldLabel>Exp month</FieldLabel>
            <TextInput
              inputMode="numeric"
              value={form.exp_month}
              onChange={(e) => setForm((p) => ({ ...p, exp_month: e.target.value.replace(/[^\d]/g, "") }))}
              placeholder="12"
            />
          </label>
          <label>
            <FieldLabel>Exp year</FieldLabel>
            <TextInput
              inputMode="numeric"
              value={form.exp_year}
              onChange={(e) => setForm((p) => ({ ...p, exp_year: e.target.value.replace(/[^\d]/g, "") }))}
              placeholder="2030"
            />
          </label>

          <div className="md:col-span-2 flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={saving || (state.kind === "ready" && addresses.length === 0)}
            >
              {isEditing ? "Save changes" : "Add card"}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
}

