export const APP_TIME_ZONE = "America/Toronto";

/** "Sep 9, 2026, 5:00 AM EDT" full timestamp with the zone spelled out. */
export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleString("en-US", {
    timeZone: APP_TIME_ZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

/** "Sep 9, 2026" calendar date only no time or zone label needed. */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-US", {
    timeZone: APP_TIME_ZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** "Sep 9" for compact table rows where the year is implied. */
export function formatShortDate(dateString: string | null | undefined): string {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-US", {
    timeZone: APP_TIME_ZONE,
    month: "short",
    day: "numeric",
  });
}

/** "Sep 2026" for "joined" style summaries. */
export function formatMonthYear(dateString: string | null | undefined): string {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-US", {
    timeZone: APP_TIME_ZONE,
    month: "short",
    year: "numeric",
  });
}

export function easternDateKey(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: APP_TIME_ZONE });
}