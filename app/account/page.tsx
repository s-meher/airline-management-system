import type { Metadata } from "next";
import { PageHeading } from "@/components/layout/PageHeading";

export const metadata: Metadata = {
  title: "My Account",
};

export default function AccountPage() {
  return (
    <div>
      <PageHeading
        title="My Account"
        description="Customer profile, saved addresses, and payment methods — aligned with your customers / addresses / credit_cards tables."
      />
      <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center text-zinc-500 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
        <p className="text-base">
          Placeholder: account sections will be wired up after core booking
          flows.
        </p>
      </div>
    </div>
  );
}
