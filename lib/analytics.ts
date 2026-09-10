import { easternDateKey, formatShortDate } from "@/lib/dateFormat";

export type DayBucket = { date: string; label: string; count: number };

export function buildDailyBuckets(
  rows: { created_at: string }[],
  days: number,
  now: Date = new Date()
): DayBucket[] {
  const buckets: DayBucket[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = easternDateKey(d);
    buckets.push({
      date: key,
      label: formatShortDate(d.toISOString()),
      count: 0,
    });
  }

  const bucketIndex = new Map(buckets.map((b, i) => [b.date, i]));
  for (const row of rows) {
    const key = easternDateKey(new Date(row.created_at));
    const idx = bucketIndex.get(key);
    if (idx !== undefined) buckets[idx].count += 1;
  }

  return buckets;
}

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