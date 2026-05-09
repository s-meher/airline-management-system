import { Pool } from "pg";

declare global {
  var __flightdeskPool: Pool | undefined;
}

function required(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export function getPool() {
  if (!globalThis.__flightdeskPool) {
    globalThis.__flightdeskPool = new Pool({
      connectionString: required("DATABASE_URL"),
    });
  }
  return globalThis.__flightdeskPool;
}

