"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Ban, Check, MessageSquareText, Paperclip, Search, Unlock, XCircle } from "lucide-react";
import { useAdminPresence } from "@/components/admin/AdminPresence";
import { formatDate, formatShortDate } from "@/lib/dateFormat";
import { ColumnChart, Delta, Heatmap, STATUS, StackedBar, fmt, fmtDuration, type Label } from "./charts";

export type HistoryEntry = {
  id: string;
  kind: "approved" | "changes" | "rejected" | "ban" | "unban";
  at: string;
  title: string;
  subtitle: string;
  reason: string | null;
  attachmentUrl: string | null;
};

type Props = {
  admin: { id: string; name: string; email: string; role: string; lastActive: string | null };
  stats: {
    last30: number;
    prev30: number;
    approved: number;
    changes: number;
    rejected: number;
    bans: number;
    unbans: number;
    medianHours: number | null;
    teamMedianHours: number | null;
    share: number | null;
    firstDecision: string | null;
  };
  chart: { labels: Label[]; approved: number[]; changes: number[]; rejected: number[] };
  heat: number[][];
  history: HistoryEntry[];
  historyTruncated: boolean;
};

const KIND_META: Record<HistoryEntry["kind"], { label: string; icon: typeof Check; color: string; bg: string }> = {
  approved: { label: "Approved", icon: Check, color: "text-emerald-700", bg: "bg-emerald-50" },
  changes: { label: "Requested fixes", icon: MessageSquareText, color: "text-amber-700", bg: "bg-amber-50" },
  rejected: { label: "Rejected", icon: XCircle, color: "text-rose-700", bg: "bg-rose-50" },
  ban: { label: "Banned", icon: Ban, color: "text-rose-700", bg: "bg-rose-50" },
  unban: { label: "Restored access", icon: Unlock, color: "text-emerald-700", bg: "bg-emerald-50" },
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "approved", label: "Approved" },
  { key: "changes", label: "Fixes" },
  { key: "rejected", label: "Rejected" },
  { key: "moderation", label: "Bans" },
] as const;
type FilterKey = (typeof FILTERS)[number]["key"];

function relativeTime(iso: string | null) {
  if (!iso) return "never";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function dayHeading(iso: string) {
  const key = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "America/Toronto" });
  const k = key(new Date(iso));
  if (k === key(new Date())) return "Today";
  if (k === key(new Date(Date.now() - 86400000))) return "Yesterday";
  return formatDate(iso);
}

export function AdminProfileView({ admin, stats, chart, heat, history, historyTruncated }: Props) {
  const { online } = useAdminPresence();
  const presence = online.get(admin.id);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");

  const decisions = stats.approved + stats.changes + stats.rejected;
  const approvalRate = stats.approved + stats.rejected > 0 ? Math.round((stats.approved / (stats.approved + stats.rejected)) * 100) : null;

  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = { all: history.length, approved: 0, changes: 0, rejected: 0, moderation: 0 };
    for (const h of history) {
      if (h.kind === "ban" || h.kind === "unban") c.moderation++;
      else c[h.kind]++;
    }
    return c;
  }, [history]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const shown = history.filter((h) => {
      const matchesFilter = filter === "all" || (filter === "moderation" ? h.kind === "ban" || h.kind === "unban" : h.kind === filter);
      const matchesQuery = !q || `${h.title} ${h.subtitle} ${h.reason ?? ""}`.toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
    const out: { heading: string; items: HistoryEntry[] }[] = [];
    for (const h of shown) {
      const heading = dayHeading(h.at);
      if (out.at(-1)?.heading === heading) out.at(-1)!.items.push(h);
      else out.push({ heading, items: [h] });
    }
    return out;
  }, [history, filter, query]);

  return (
    <div className="w-full space-y-8 pb-16">
      <Link href="/admin/analytics#team" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-brand-red transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to analytics
      </Link>

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <span className="relative w-14 h-14 rounded-full bg-brand-pink text-brand-red flex items-center justify-center font-bold text-xl shrink-0">
          {admin.name.charAt(0).toUpperCase()}
          {presence && (
            <span className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-[3px] border-[#FBF8F3] ${presence.status === "active" ? "bg-emerald-500" : "bg-amber-400"}`} />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-logo text-2xl sm:text-3xl font-bold text-[#23201D] tracking-tight">{admin.name}</h1>
            <span className="text-[11px] font-semibold text-gray-500 bg-black/5 rounded-md px-2 py-0.5">{admin.role}</span>
          </div>
          <p className="text-sm text-gray-500 truncate">{admin.email}</p>
        </div>
        <div className="sm:text-right">
          {presence ? (
            <>
              <p className={`text-sm font-semibold ${presence.status === "active" ? "text-emerald-700" : "text-amber-700"}`}>
                {presence.status === "active" ? "Online now" : "Idle"}
              </p>
              <p className="text-xs text-gray-500">{presence.status === "active" ? presence.label : `on ${presence.label.toLowerCase()}`}</p>
            </>
          ) : (
            <>
              <p className="text-xs text-gray-400">Last active</p>
              <p className="text-sm font-semibold text-gray-900">{relativeTime(admin.lastActive)}</p>
            </>
          )}
        </div>
      </div>

      {/* ── Stats ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Stat label="Decisions, last 30 days" value={fmt(stats.last30)} sub={`${fmt(stats.prev30)} in the 30 days before`} extra={<Delta current={stats.last30} previous={stats.prev30} />} />
        <Stat label="Approval rate" value={approvalRate === null ? "—" : `${approvalRate}%`} sub="Approved vs rejected, all time" />
        <Stat
          label="Median review time"
          value={fmtDuration(stats.medianHours)}
          sub={stats.teamMedianHours === null ? "Submission to their decision" : `Team: ${fmtDuration(stats.teamMedianHours)} (last 30 days)`}
        />
        <Stat label="Share of team decisions" value={stats.share === null ? "—" : `${stats.share}%`} sub="Last 30 days" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4">
        <Card>
          <div className="flex items-baseline justify-between gap-3 mb-3">
            <h2 className="font-logo text-lg font-bold text-[#23201D]">Last 30 days</h2>
            <span className="text-xs text-gray-400">Decisions per day</span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4 text-xs text-gray-600">
            {[
              { label: "Approved", color: STATUS.approved },
              { label: "Fixes requested", color: STATUS.changes },
              { label: "Rejected", color: STATUS.rejected },
            ].map((l) => (
              <span key={l.label} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-[3px]" style={{ backgroundColor: l.color }} />
                {l.label}
              </span>
            ))}
          </div>
          <ColumnChart
            ariaLabel={`${admin.name}'s decisions per day over the last 30 days`}
            labels={chart.labels}
            height={200}
            unit="decisions"
            series={[
              { label: "Approved", color: STATUS.approved, values: chart.approved },
              { label: "Fixes requested", color: STATUS.changes, values: chart.changes },
              { label: "Rejected", color: STATUS.rejected, values: chart.rejected },
            ]}
          />
        </Card>
        <Card>
          <div className="flex items-baseline justify-between gap-3 mb-4">
            <h2 className="font-logo text-lg font-bold text-[#23201D]">All time</h2>
            {stats.firstDecision && <span className="text-xs text-gray-400">Since {formatShortDate(stats.firstDecision)}</span>}
          </div>
          <p className="font-logo text-4xl font-bold text-[#23201D] tabular-nums">{fmt(decisions)}</p>
          <p className="text-xs text-gray-500 mb-4">note decisions</p>
          <StackedBar
            segments={[
              { label: "Approved", value: stats.approved, color: STATUS.approved },
              { label: "Fixes", value: stats.changes, color: STATUS.changes },
              { label: "Rejected", value: stats.rejected, color: STATUS.rejected },
            ]}
          />
          <ul className="mt-4 space-y-2 text-sm">
            {[
              { label: "Approved", value: stats.approved, color: STATUS.approved },
              { label: "Fixes requested", value: stats.changes, color: STATUS.changes },
              { label: "Rejected", value: stats.rejected, color: STATUS.rejected },
            ].map((r) => (
              <li key={r.label} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-[3px]" style={{ backgroundColor: r.color }} />
                <span className="flex-1 text-gray-600">{r.label}</span>
                <span className="font-semibold text-gray-900 tabular-nums">{fmt(r.value)}</span>
              </li>
            ))}
            <li className="flex items-center gap-2 pt-2 border-t border-black/5">
              <Ban className="w-3 h-3 text-gray-400" />
              <span className="flex-1 text-gray-600">Bans · restores</span>
              <span className="font-semibold text-gray-900 tabular-nums">
                {stats.bans} · {stats.unbans}
              </span>
            </li>
          </ul>
        </Card>
      </div>

      <Card>
        <div className="mb-5">
          <h2 className="font-logo text-lg font-bold text-[#23201D]">When they review</h2>
          <p className="text-xs text-gray-400 mt-0.5">All their decisions, by day and 3-hour block (Eastern).</p>
        </div>
        <Heatmap grid={heat} unit="decisions" />
      </Card>

      {/* ── History ────────────────────────────────────────── */}
      <Card padded={false}>
        <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-black/5 space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-logo text-lg font-bold text-[#23201D]">Activity history</h2>
            <span className="text-xs text-gray-400">
              {historyTruncated ? `Most recent ${history.length}` : `${history.length} ${history.length === 1 ? "action" : "actions"}`}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div role="tablist" className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  role="tab"
                  aria-selected={filter === f.key}
                  onClick={() => setFilter(f.key)}
                  className={`shrink-0 h-8 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    filter === f.key ? "bg-[#23201D] text-white" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  {f.label}
                  <span className={`ml-1.5 tabular-nums ${filter === f.key ? "text-white/60" : "text-gray-400"}`}>{counts[f.key]}</span>
                </button>
              ))}
            </div>
            <label className="relative sm:ml-auto">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <span className="sr-only">Search history</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search notes, courses, reasons…"
                className="h-8 w-full sm:w-64 pl-8 pr-3 rounded-lg border border-black/10 bg-white text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-red/50"
              />
            </label>
          </div>
        </div>

        {groups.length === 0 ? (
          <p className="py-14 text-center text-sm text-gray-400">{history.length === 0 ? "Nothing logged yet." : "Nothing matches."}</p>
        ) : (
          <div>
            {groups.map((g) => (
              <section key={g.heading}>
                <h3 className="px-5 sm:px-6 py-2 bg-gray-50 border-b border-black/5 text-[11px] font-semibold text-gray-500">
                  {g.heading}
                </h3>
                <ul className="divide-y divide-black/5">
                  {g.items.map((h) => (
                    <HistoryItem key={h.id} entry={h} />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function HistoryItem({ entry }: { entry: HistoryEntry }) {
  const meta = KIND_META[entry.kind];
  const Icon = meta.icon;
  return (
    <li className="flex gap-3 sm:gap-4 px-5 sm:px-6 py-4">
      <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${meta.bg} ${meta.color}`}>
        <Icon className="w-4 h-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm text-gray-900 min-w-0">
            <span className={`font-semibold ${meta.color}`}>{meta.label}</span>{" "}
            <span className="font-semibold truncate">{entry.title}</span>
          </p>
          <time className="text-xs text-gray-400 shrink-0 tabular-nums" dateTime={entry.at}>
            {new Date(entry.at).toLocaleTimeString("en-US", { timeZone: "America/Toronto", hour: "numeric", minute: "2-digit" })}
          </time>
        </div>
        {entry.subtitle && <p className="text-xs text-gray-400 mt-0.5">{entry.subtitle}</p>}
        {entry.reason && <p className="text-sm text-gray-600 mt-2 leading-relaxed bg-gray-50 rounded-lg px-3 py-2">{entry.reason}</p>}
        {entry.attachmentUrl && (
          <a
            href={entry.attachmentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 text-xs font-semibold mt-2 hover:bg-amber-100 transition-colors"
          >
            <Paperclip className="w-3 h-3" /> View attachment
          </a>
        )}
      </div>
    </li>
  );
}

function Card({ children, padded = true }: { children: React.ReactNode; padded?: boolean }) {
  return (
    <div className={`bg-white border border-black/5 rounded-2xl shadow-[0_1px_2px_rgba(35,32,29,0.04)] ${padded ? "p-5 sm:p-6" : "overflow-hidden"}`}>
      {children}
    </div>
  );
}

function Stat({ label, value, sub, extra }: { label: string; value: string; sub?: string; extra?: React.ReactNode }) {
  return (
    <div className="bg-white border border-black/5 rounded-2xl p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs text-gray-500">{label}</p>
        {extra}
      </div>
      <p className="font-logo text-2xl sm:text-3xl font-bold text-[#23201D] tabular-nums mt-1">{value}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-1 leading-snug">{sub}</p>}
    </div>
  );
}
