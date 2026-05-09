import type { Metadata } from "next";
import { PageHeading } from "@/components/layout/PageHeading";
import { RegisterCustomerForm } from "@/components/register/RegisterCustomerForm";

export const metadata: Metadata = {
  title: "Register",
};

export default function RegisterPage() {
  return (
    <div>
      <PageHeading
        title="Register"
        description="Create an account with a password. You’ll be signed in automatically."
      />
      <RegisterCustomerForm />
    </div>
  );
}

