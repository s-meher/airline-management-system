import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth/sessionCookie";
import { signSessionToken } from "@/lib/auth/sessionToken";
import { findLoginRow } from "@/lib/db/customers";
import { clientIp, rateLimitAllow } from "@/lib/db/rateLimit";
import { logFlightDesk } from "@/lib/log";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function POST(req: Request) {
  const ip = clientIp(req);
  const ok = await rateLimitAllow(`login:${ip}`, 25);
  if (!ok) {
    return NextResponse.json({ errors: ["Too many attempts. Try again shortly."] }, { status: 429 });
  }

  const body = (await req.json().catch(() => null)) as { email?: string; password?: string } | null;
  const email = normalizeEmail(body?.email ?? "");
  const password = body?.password ?? "";

  if (!email || !password) {
    return NextResponse.json({ errors: ["Email and password are required."] }, { status: 400 });
  }

  const row = await findLoginRow(email);
  if (!row?.password_hash || !bcrypt.compareSync(password, row.password_hash)) {
    logFlightDesk("warn", "auth.login_failed", { email });
    return NextResponse.json({ errors: ["Invalid email or password."] }, { status: 401 });
  }

  const token = await signSessionToken({ customer_id: row.customer_id, email: row.email });
  await setSessionCookie(token);
  logFlightDesk("info", "auth.login_ok", { customer_id: row.customer_id });

  return NextResponse.json({
    customer: {
      customer_id: row.customer_id,
      first_name: row.first_name,
      last_name: row.last_name,
      email: row.email,
      phone: row.phone,
    },
  });
}
