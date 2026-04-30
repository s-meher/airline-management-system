export function formatCurrency(amount: number, currency_code: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency_code,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatUtcDateTime(iso: string) {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatDurationMinutes(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

