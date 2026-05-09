import type { Metadata } from "next";
import { PageHeading } from "@/components/layout/PageHeading";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <div>
      <PageHeading
        title="Sign in"
        description="Use your registered email and password. Session is stored in an HTTP-only cookie."
      />
      <LoginForm />
    </div>
  );
}
