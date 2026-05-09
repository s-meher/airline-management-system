import * as jose from "jose";
import { getAuthSecretBytes } from "@/lib/auth/authSecret";

const COOKIE_NAME = "flightdesk.session";

export { COOKIE_NAME };

export interface SessionPayload {
  customer_id: number;
  email: string;
}

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  const secret = getAuthSecretBytes();
  return await new jose.SignJWT({
    sub: String(payload.customer_id),
    email: payload.email,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const secret = getAuthSecretBytes();
    const { payload } = await jose.jwtVerify(token, secret);
    const sub = payload.sub;
    const email = typeof payload.email === "string" ? payload.email : null;
    const customer_id = sub ? Number(sub) : NaN;
    if (!Number.isFinite(customer_id) || customer_id <= 0 || !email) return null;
    return { customer_id, email };
  } catch {
    return null;
  }
}
