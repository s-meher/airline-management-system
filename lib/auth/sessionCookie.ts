import { cookies } from "next/headers";
import type { SessionPayload } from "@/lib/auth/sessionToken";
import { COOKIE_NAME, verifySessionToken } from "@/lib/auth/sessionToken";

const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 7;

export async function getSessionTokenFromCookies(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(COOKIE_NAME)?.value ?? null;
}

export async function readSessionPayload(): Promise<SessionPayload | null> {
  const raw = await getSessionTokenFromCookies();
  if (!raw) return null;
  return verifySessionToken(raw);
}

export async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SEC,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    secure: process.env.NODE_ENV === "production",
  });
}
