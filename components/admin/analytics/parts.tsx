"use client";

// Presence, live refresh and export helpers for the analytics page.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { FullAnalytics } from "@/lib/analytics-loader";
import type { RangeKey } from "@/lib/analytics";
import { createClient } from "@/lib/supabase/client";
import { useAdminPresence, type OnlineAdmin } from "@/components/admin/AdminPresence";

export function Avatar({ name, presence, size = "md" }: { name: string; presence?: OnlineAdmin; size?: "sm" | "md" }) {
  return (
    <span
      className={`relative rounded-full bg-brand-pink text-brand-red flex items-center justify-center font-bold shrink-0 ${
        size === "sm" ? "w-7 h-7 text-[11px]" : "w-9 h-9 text-sm"
      }`}
    >
      {name.charAt(0).toUpperCase()}
      {presence && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${presence.status === "active" ? "bg-emerald-500" : "bg-amber-400"}`}
          aria-label={presence.status === "active" ? "Online" : "Idle"}
        />
      )}
    </span>
  );
}

/** "Online · Review queue" when they're on the desk, otherwise when they were last seen. */
export function PresenceText({ presence, lastActive, prefix = "" }: { presence?: OnlineAdmin; lastActive: string | null; prefix?: string }) {
  if (!presence) return <>{prefix}{relativeTime(lastActive)}</>;
  return (
    <span className={presence.status === "active" ? "text-emerald-700 font-medium" : "text-amber-700 font-medium"}>
      {presence.status === "active" ? "Online" : "Idle"} · {presence.label}
    </span>
  );
}

/** Live list of admins on the desk, from Realtime Presence. */
export function OnlineNow({
  online,
  connected,
  selfId,
  team,
}: {
  online: Map<string, OnlineAdmin>;
  connected: boolean;
  selfId: string | null;
  team: { id: string; name: string }[];
}) {
  const now = useNow(15_000);
  const names = new Map(team.map((t) => [t.id, t.name]));
  const nameOf = (p: OnlineAdmin) => names.get(p.userId) || p.name;
  const people = [...online.values()].sort((a, b) =>
    a.status !== b.status ? (a.status === "active" ? -1 : 1) : nameOf(a).localeCompare(nameOf(b))
  );
  const activeCount = people.filter((p) => p.status === "active").length;

  return (
    <div className="rounded-lg border border-brand-border-light bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h3 className="font-logo text-lg font-bold text-brand-dark flex items-center gap-2.5">
          <span className="relative flex w-2.5 h-2.5">
            {connected && activeCount > 0 && (
              <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-60 motion-safe:animate-ping" />
            )}
            <span className={`relative inline-flex w-2.5 h-2.5 rounded-full ${connected ? "bg-emerald-500" : "bg-gray-300"}`} />
          </span>
          On the desk now
        </h3>
        <span className="text-xs text-gray-400">
          {connected ? `${activeCount} active · ${people.length - activeCount} idle` : "Connecting…"}
        </span>
      </div>

      {!connected ? (
        <p className="text-sm text-gray-500">
          Can&apos;t see who&apos;s online yet. If this doesn&apos;t change in a few seconds, the Realtime presence policy probably isn&apos;t set up.
        </p>
      ) : people.length === 0 ? (
        <p className="text-sm text-gray-400">No one is on the admin desk.</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {people.map((p) => (
            <li key={p.userId}>
              <Link
                href={`/admin/analytics/${p.userId}`}
                className="flex items-center gap-3 rounded-xl border border-black/5 px-3 py-2.5 hover:border-black/15 hover:bg-gray-50/60 transition-colors"
              >
                <Avatar name={nameOf(p)} presence={p} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-gray-900 truncate">
                    {nameOf(p)}
                    {p.userId === selfId && <span className="font-normal text-gray-400"> (you)</span>}
                  </span>
                  <span className="block text-xs text-gray-500 truncate">
                    {p.status === "active" ? p.label : `Idle on ${p.label.toLowerCase()}`}
                    <span className="text-gray-300"> · </span>
                    {since(p.since, now)}
                    {p.tabs > 1 && <span className="text-gray-400"> · {p.tabs} tabs</span>}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Compact avatar stack of who's online, for the toolbar. */
export function OnlineStack({ onOpen }: { onOpen: () => void }) {
  const { online, connected } = useAdminPresence();
  if (!connected || online.size === 0) return null;
  const people = [...online.values()].sort((a, b) => (a.status === b.status ? 0 : a.status === "active" ? -1 : 1));
  const activeCount = people.filter((p) => p.status === "active").length;

  return (
    <button
      type="button"
      onClick={onOpen}
      title={people.map((p) => `${p.name}: ${p.status === "active" ? p.label : "idle"}`).join("\n")}
      className="hidden md:inline-flex items-center gap-2 h-9 pl-1.5 pr-3 rounded-lg hover:bg-white transition-colors"
    >
      <span className="flex -space-x-2">
        {people.slice(0, 4).map((p) => (
          <span key={p.userId} className="ring-2 ring-brand-surface rounded-full">
            <Avatar name={p.name} presence={p} size="sm" />
          </span>
        ))}
      </span>
      <span className="text-xs font-semibold text-gray-600 whitespace-nowrap">{activeCount} online</span>
    </button>
  );
}

export function LiveIndicator({ generatedAt, realtime, refreshing }: { generatedAt: string; realtime: boolean; refreshing: boolean }) {
  const now = useNow(5_000);
  const secs = Math.max(0, Math.round((now - new Date(generatedAt).getTime()) / 1000));
  const ago = secs < 10 ? "just now" : secs < 60 ? `${secs}s ago` : `${Math.floor(secs / 60)}m ago`;
  return (
    <span
      className="inline-flex items-center gap-1.5 font-semibold text-emerald-700"
      title={realtime ? "Updates the moment something changes" : "Refreshes every 30 seconds"}
    >
      <span className="relative flex w-2 h-2">
        <span className={`absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-70 ${refreshing ? "animate-ping" : "motion-safe:animate-pulse"}`} />
        <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-500" />
      </span>
      Live
      <span className="font-normal text-gray-400">updated {ago}</span>
    </span>
  );
}

// ─── Utilities ───────────────────────────────────────────────────────

export function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function relativeTime(iso: string | null) {
  if (!iso) return "never";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

/** Current time, re-read every `ms` so relative labels stay fresh. */
function useNow(ms: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

function since(iso: string, now: number) {
  const mins = Math.floor((now - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

const LIVE_TABLES = [
  { table: "notes", event: "*" },
  { table: "admin_audit_log", event: "INSERT" },
  // INSERT only: every admin page load bumps last_admin_active_at, which would refresh constantly
  { table: "profiles", event: "INSERT" },
] as const;
const MIN_REFRESH_GAP_MS = 4_000;
const POLL_MS = 30_000;

/**
 * Keeps the stats fresh without dimming the page or re-rendering the route:
 * - Realtime: shortly after any change to notes, decisions or signups (bypasses the server cache)
 * - Fallback: every 30s while the tab is visible, and on coming back to it
 * Fetches go to /api/admin/analytics, which doesn't count as admin activity.
 */
export function useLiveRefresh(range: RangeKey, onData: (d: FullAnalytics) => void) {
  const [refreshing, setRefreshing] = useState(false);
  const [realtime, setRealtime] = useState(false);
  const lastRefresh = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wantFresh = useRef(false);

  useEffect(() => {
    lastRefresh.current = Date.now();
    let cancelled = false;

    const run = async () => {
      const fresh = wantFresh.current;
      wantFresh.current = false;
      lastRefresh.current = Date.now();
      setRefreshing(true);
      try {
        const res = await fetch(`/api/admin/analytics?range=${range}${fresh ? "&fresh=1" : ""}`, { cache: "no-store" });
        if (res.ok && !cancelled) onData(await res.json());
      } catch {
        // Offline or a blip: the next poll will try again
      } finally {
        if (!cancelled) setRefreshing(false);
      }
    };

    // Coalesce bursts (e.g. a batch of approvals) into one request
    const schedule = (fresh: boolean) => {
      wantFresh.current ||= fresh;
      if (timer.current) clearTimeout(timer.current);
      const wait = Math.max(800, MIN_REFRESH_GAP_MS - (Date.now() - lastRefresh.current));
      timer.current = setTimeout(run, wait);
    };

    const supabase = createClient();
    const channel = supabase.channel(`analytics-live-${range}`);
    for (const { table, event } of LIVE_TABLES) {
      channel.on("postgres_changes", { event, schema: "public", table }, () => schedule(true));
    }
    channel.subscribe((status) => setRealtime(status === "SUBSCRIBED"));

    const poll = setInterval(() => {
      if (document.visibilityState === "visible" && Date.now() - lastRefresh.current >= POLL_MS - 1000) schedule(false);
    }, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") schedule(false);
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      if (timer.current) clearTimeout(timer.current);
      clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisible);
      supabase.removeChannel(channel);
    };
  }, [range, onData]);

  return { realtime, refreshing };
}

export function downloadCsv(data: FullAnalytics) {
  const { buckets, metrics, decisions, speed } = data;
  const header = ["period", "submissions", "signups", "approvals", "hours_awarded", "approved", "fixes_requested", "rejected", "median_review_hours"];
  const lines = buckets.map((b, i) =>
    [
      `"${b.tooltip}"`,
      metrics.submissions.current[i],
      metrics.signups.current[i],
      metrics.approvals.current[i],
      metrics.hours.current[i],
      decisions.approved[i],
      decisions.changes[i],
      decisions.rejected[i],
      speed.series[i] === null ? "" : (speed.series[i] as number).toFixed(2),
    ].join(",")
  );
  const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `uonotes-analytics-${data.range.key}-${data.generatedAt.slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
