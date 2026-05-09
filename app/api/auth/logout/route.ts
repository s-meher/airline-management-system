import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth/sessionCookie";
import { logFlightDesk } from "@/lib/log";

export async function POST() {
  await clearSessionCookie();
  logFlightDesk("info", "auth.logout");
  return NextResponse.json({ ok: true });
}
