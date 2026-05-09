import type { Metadata } from "next";
import { PageHeading } from "@/components/layout/PageHeading";
import { AccountOverview } from "@/components/account/AccountOverview";

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
      <AccountOverview />
    </div>
  );
}
