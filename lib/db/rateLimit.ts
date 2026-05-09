import { getPool } from "@/lib/db/pool";

/** Fixed UTC-minute buckets; safe across server instances sharing Postgres. */
export async function rateLimitAllow(rate_key: string, maxPerWindow: number): Promise<boolean> {
  const pool = getPool();
  if (Math.random() < 0.03) {
    await pool.query(
      `DELETE FROM api_rate_limit WHERE window_start < (timezone('utc', now()) - interval '2 hours')`,
    );
  }

  const res = await pool.query<{ hit_count: number }>(
    `INSERT INTO api_rate_limit (rate_key, window_start, hit_count)
     VALUES ($1, date_trunc('minute', timezone('utc', now())), 1)
     ON CONFLICT (rate_key, window_start)
     DO UPDATE SET hit_count = api_rate_limit.hit_count + 1
     RETURNING hit_count`,
    [rate_key],
  );
  const hit = res.rows[0]?.hit_count ?? 1;
  return hit <= maxPerWindow;
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim() || "unknown";
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}
