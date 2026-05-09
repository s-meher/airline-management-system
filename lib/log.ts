type Level = "info" | "warn" | "error";

export function logFlightDesk(level: Level, msg: string, meta?: Record<string, unknown>) {
  const line = JSON.stringify({
    level,
    msg,
    ts: new Date().toISOString(),
    ...meta,
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}
