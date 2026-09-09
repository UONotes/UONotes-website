export type DayBucket = { date: string; label: string; count: number };

// Buckets a set of rows with a `created_at` timestamp into daily counts
// over the trailing `days` window ending "now". Used to feed the daily
// bar charts on the analytics page (submissions, signups, etc).
export function buildDailyBuckets(
  rows: { created_at: string }[],
  days: number,
  now: Date = new Date()
): DayBucket[] {
  const buckets: DayBucket[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    buckets.push({
      date: key,
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      count: 0,
    });
  }

  const bucketIndex = new Map(buckets.map((b, i) => [b.date, i]));
  for (const row of rows) {
    const key = new Date(row.created_at).toISOString().slice(0, 10);
    const idx = bucketIndex.get(key);
    if (idx !== undefined) buckets[idx].count += 1;
  }

  return buckets;
}