export function getAuthSecretBytes(): Uint8Array {
  const raw = process.env.AUTH_SECRET?.trim();
  if (raw && raw.length >= 32) {
    return new TextEncoder().encode(raw);
  }
  if (process.env.NODE_ENV === "development") {
    console.warn(
      "[flightdesk] AUTH_SECRET missing or short; using insecure development default. Set AUTH_SECRET (32+ chars) before production.",
    );
    return new TextEncoder().encode("flightdesk-dev-secret-change-me-32chars!");
  }
  throw new Error("AUTH_SECRET must be set to at least 32 characters.");
}
