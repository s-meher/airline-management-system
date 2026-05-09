import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth/sessionCookie";
import { signSessionToken } from "@/lib/auth/sessionToken";
import { createCustomerWithPassword, findCustomerByEmail } from "@/lib/db/customers";
import { clientIp, rateLimitAllow } from "@/lib/db/rateLimit";
import { logFlightDesk } from "@/lib/log";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function friendlyServerError(msg: string): string {
  if (msg.includes("Missing required env var: DATABASE_URL")) {
    return "Database not configured. Set DATABASE_URL and restart the dev server.";
  }
  if (
    msg.includes("ECONNREFUSED") ||
    msg.includes("connect ECONNREFUSED") ||
    msg.includes("Connection terminated unexpectedly") ||
    msg.includes("getaddrinfo ENOTFOUND") ||
    msg.includes("password authentication failed") ||
    msg.includes("does not exist") && msg.includes("database")
  ) {
    return "Database unavailable. Start Postgres and run `npm run db:reset`.";
  }
  return "Registration failed.";
}

export async function POST(req: Request) {
  const ip = clientIp(req);
  const ok = await rateLimitAllow(`register:${ip}`, 12);
  if (!ok) {
    return NextResponse.json({ errors: ["Too many registration attempts. Try again shortly."] }, { status: 429 });
  }

  const body = (await req.json().catch(() => null)) as
    | { first_name?: string; last_name?: string; email?: string; password?: string }
    | null;

  const first_name = body?.first_name?.trim() ?? "";
  const last_name = body?.last_name?.trim() ?? "";
  const email = normalizeEmail(body?.email ?? "");
  const password = body?.password ?? "";

  const errors: string[] = [];
  if (!first_name) errors.push("First name is required.");
  if (!last_name) errors.push("Last name is required.");
  if (!email) errors.push("Email is required.");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Email format is invalid.");
  if (password.length < 8) errors.push("Password must be at least 8 characters.");

  if (errors.length > 0) return NextResponse.json({ errors }, { status: 400 });

  const exists = await findCustomerByEmail(email);
  if (exists) {
    return NextResponse.json({ errors: ["A customer with this email already exists."] }, { status: 409 });
  }

  const password_hash = bcrypt.hashSync(password, 10);

  try {
    const customer = await createCustomerWithPassword({
      first_name,
      last_name,
      email,
      password_hash,
    });
    const token = await signSessionToken({ customer_id: customer.customer_id, email: customer.email });
    await setSessionCookie(token);
    logFlightDesk("info", "auth.register_ok", { customer_id: customer.customer_id });
    return NextResponse.json({ customer }, { status: 201 });
  } catch (e: unknown) {
    const msg = String(e);
    if (msg.includes("duplicate key") || msg.includes("unique")) {
      return NextResponse.json({ errors: ["A customer with this email already exists."] }, { status: 409 });
    }
    logFlightDesk("error", "auth.register_failed", { message: msg });
    return NextResponse.json({ errors: [friendlyServerError(msg)] }, { status: 500 });
  }
}
