import { easternDateKey, formatShortDate } from "@/lib/dateFormat";

/** Rounds `count / total` to a whole percent. 0 when there's no data, never NaN. */
export function pct(count: number, total: number): number {
  return total > 0 ? Math.round((count / total) * 100) : 0;
}

export type Trend = { direction: "up" | "down" | "flat"; pct: number | null };

export function computeTrend(current: number, previous: number): Trend {
  if (previous === 0) {
    return current === 0 ? { direction: "flat", pct: null } : { direction: "up", pct: null };
  }
  const change = Math.round(((current - previous) / previous) * 100);
  if (change > 0) return { direction: "up", pct: change };
  if (change < 0) return { direction: "down", pct: Math.abs(change) };
  return { direction: "flat", pct: 0 };
}
// ─── Range-aware helpers for the analytics dashboard ─────────────────

const DAY_MS = 24 * 60 * 60 * 1000;

export const RANGES = {
  "7d": { days: 7, bucketDays: 1, label: "7 days", prevLabel: "prior 7 days" },
  "30d": { days: 30, bucketDays: 1, label: "30 days", prevLabel: "prior 30 days" },
  "90d": { days: 90, bucketDays: 7, label: "90 days", prevLabel: "prior 90 days" },
  "1y": { days: 365, bucketDays: 30, label: "12 months", prevLabel: "prior 12 months" },
} as const;

export type RangeKey = keyof typeof RANGES;

export function parseRange(value: string | undefined): RangeKey {
  return value && value in RANGES ? (value as RangeKey) : "30d";
}

export type Bucket = { key: string; label: string; tooltip: string; value: number };

/**
 * Sums rows into buckets covering the last `days`, ending now.
 * Daily buckets align to Eastern calendar days; wider buckets are
 * rolling windows (e.g. 7-day blocks for the 90-day view).
 */
export function bucketSeries(
  rows: { at: string; value?: number }[],
  days: number,
  bucketDays: number,
  now: Date = new Date()
): Bucket[] {
  if (bucketDays === 1) {
    const buckets: Bucket[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * DAY_MS);
      const label = formatShortDate(d.toISOString());
      buckets.push({ key: easternDateKey(d), label, tooltip: label, value: 0 });
    }
    const index = new Map(buckets.map((b, i) => [b.key, i]));
    for (const row of rows) {
      const idx = index.get(easternDateKey(new Date(row.at)));
      if (idx !== undefined) buckets[idx].value += row.value ?? 1;
    }
    return buckets;
  }

  const count = Math.ceil(days / bucketDays);
  const windowStart = now.getTime() - count * bucketDays * DAY_MS;
  const buckets: Bucket[] = Array.from({ length: count }, (_, i) => {
    const start = new Date(windowStart + i * bucketDays * DAY_MS);
    const label = formatShortDate(start.toISOString());
    return {
      key: start.toISOString(),
      label,
      tooltip: bucketDays === 7 ? `Week of ${label}` : `${bucketDays} days from ${label}`,
      value: 0,
    };
  });
  for (const row of rows) {
    const idx = Math.floor((new Date(row.at).getTime() - windowStart) / (bucketDays * DAY_MS));
    if (idx >= 0 && idx < count) buckets[idx].value += row.value ?? 1;
  }
  return buckets;
}

/** Linear-interpolated percentile (0–100). null for an empty list. */
export function percentile(values: number[], p: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const pos = ((sorted.length - 1) * p) / 100;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

/** "BIO1130" / "bio 1130" → "BIO". Falls back to "Other" when there's no letter prefix. */
export function subjectOf(courseCode: string | null | undefined): string {
  const match = courseCode?.trim().toUpperCase().match(/^[A-Z]{2,4}/);
  return match ? match[0] : "Other";
}

const easternParts = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Toronto",
  weekday: "short",
  hour: "numeric",
  hourCycle: "h23",
});
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Day of week (0 = Mon) and hour (0–23) in Eastern time. */
export function easternDayHour(iso: string): { day: number; hour: number } {
  const parts = easternParts.formatToParts(new Date(iso));
  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "Mon";
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0) % 24;
  return { day: Math.max(0, WEEKDAYS.indexOf(weekday)), hour };
}
