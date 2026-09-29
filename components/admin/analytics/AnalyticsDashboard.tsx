"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, ChevronDown, ChevronUp, Download, Inbox, Loader2, Table2, LineChart as LineIcon } from "lucide-react";
import type { AnalyticsData, Leader, MetricKey, TeamMember } from "@/lib/analytics-data";
import { createClient } from "@/lib/supabase/client";
import { useAdminPresence, type OnlineAdmin } from "@/components/admin/AdminPresence";
import { RANGES, type RangeKey } from "@/lib/analytics";
import {
  ColumnChart,
  Delta,
  Funnel,
  Heatmap,
  INK,
  LineChart,
  MUTED,
  RED,
  RankedBars,
  STATUS,
  Sparkline,
  StackedBar,
  fmt,
  fmtDuration,
} from "./charts";

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "growth", label: "Growth" },
  { id: "reviews", label: "Reviews" },
  { id: "library", label: "Library" },
  { id: "community", label: "Community" },
  { id: "team", label: "Team" },
] as const;

const RANGE_TABS: { key: RangeKey; label: string }[] = [
  { key: "7d", label: "7D" },
  { key: "30d", label: "30D" },
  { key: "90d", label: "90D" },
  { key: "1y", label: "1Y" },
];

export function AnalyticsDashboard({ initialData }: { initialData: AnalyticsData }) {
  const router = useRouter();
  // Live updates replace the server-rendered data, but only for the range
  // currently shown and only if they're newer (a range switch brings fresh props).
  const [liveData, setLiveData] = useState<AnalyticsData | null>(null);
  const data =
    liveData && liveData.range.key === initialData.range.key && liveData.generatedAt > initialData.generatedAt
      ? liveData
      : initialData;
  const [isPending, startTransition] = useTransition();
  const [pendingRange, setPendingRange] = useState<RangeKey | null>(null);
  const [metric, setMetric] = useState<MetricKey>("submissions");
  const active = useScrollSpy(SECTIONS.map((s) => s.id));
  const live = useLiveRefresh(initialData.range.key, setLiveData);
  const { range } = data;

  const changeRange = (key: RangeKey) => {
    if (key === range.key) return;
    setPendingRange(key);
    startTransition(() => router.push(`/admin/analytics?range=${key}`, { scroll: false }));
  };

  const focusMetric = (key: MetricKey) => {
    setMetric(key);
    document.getElementById("growth")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="w-full pb-16">
      {/* ── Sticky toolbar ─────────────────────────────────── */}
      <div className="sticky top-0 z-30 -mx-6 sm:-mx-10 -mt-6 sm:-mt-10 px-6 sm:px-10 pt-6 sm:pt-8 pb-0 bg-[#FBF8F3]/90 backdrop-blur-md border-b border-black/5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-logo text-2xl sm:text-3xl font-bold text-[#23201D] tracking-tight flex items-center gap-2.5">
              Analytics
              {isPending && <Loader2 className="w-4 h-4 animate-spin text-gray-400" aria-label="Loading" />}
            </h1>
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-gray-500 mt-0.5">
              <LiveIndicator generatedAt={data.generatedAt} realtime={live.realtime} refreshing={live.refreshing} />
              <span className="text-gray-300">·</span>
              Last {range.label} vs the {range.prevLabel}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <OnlineStack />
            <button
              type="button"
              onClick={() => downloadCsv(data)}
              className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-black/10 bg-white text-xs font-semibold text-gray-700 hover:border-black/20 hover:text-gray-900 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
            <div role="tablist" aria-label="Time range" className="inline-flex bg-white border border-black/10 rounded-lg p-0.5">
              {RANGE_TABS.map((t) => {
                const selected = (pendingRange && isPending ? pendingRange : range.key) === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    title={`Last ${RANGES[t.key].label}`}
                    onClick={() => changeRange(t.key)}
                    className={`h-8 px-3 rounded-md text-xs font-bold tabular-nums transition-colors cursor-pointer ${
                      selected ? "bg-[#23201D] text-white" : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <nav aria-label="Sections" className="flex gap-1 mt-3 -mb-px overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className={`shrink-0 px-3 py-2.5 text-[13px] font-semibold border-b-2 transition-colors ${
                active === s.id ? "border-brand-red text-[#23201D]" : "border-transparent text-gray-400 hover:text-gray-700"
              }`}
            >
              {s.label}
            </a>
          ))}
        </nav>
      </div>

      <div className={`space-y-14 mt-8 transition-opacity duration-200 ${isPending ? "opacity-50 pointer-events-none" : ""}`}>
        <Overview data={data} onMetric={focusMetric} />
        <Growth data={data} metric={metric} setMetric={setMetric} />
        <Reviews data={data} />
        <Library data={data} />
        <Community data={data} />
        <Team data={data} />
      </div>

      <p className="text-[11px] text-gray-400 mt-14 text-center">
        Generated {new Date(data.generatedAt).toLocaleString("en-US", { timeZone: "America/Toronto", dateStyle: "medium", timeStyle: "short" })}
        {" · "}
        Grouped by {range.unit}
      </p>
    </div>
  );
}

// ─── Overview ────────────────────────────────────────────────────────

function Overview({ data, onMetric }: { data: AnalyticsData; onMetric: (m: MetricKey) => void }) {
  const { metrics, contributors, speed, buckets } = data;
  const tiles: {
    label: string;
    value: string;
    current: number | null;
    previous: number | null;
    series: number[];
    goodWhen?: "up" | "down";
    color?: string;
    metric?: MetricKey;
    format?: (v: number) => string;
  }[] = [
    { label: "Submissions", value: fmt(metrics.submissions.total), current: metrics.submissions.total, previous: metrics.submissions.prevTotal, series: metrics.submissions.current, metric: "submissions" },
    { label: "New users", value: fmt(metrics.signups.total), current: metrics.signups.total, previous: metrics.signups.prevTotal, series: metrics.signups.current, color: INK, metric: "signups" },
    { label: "Approvals", value: fmt(metrics.approvals.total), current: metrics.approvals.total, previous: metrics.approvals.prevTotal, series: metrics.approvals.current, color: STATUS.approved, metric: "approvals" },
    { label: "Hours awarded", value: fmt(metrics.hours.total, 1), current: metrics.hours.total, previous: metrics.hours.prevTotal, series: metrics.hours.current, metric: "hours" },
    { label: "Active contributors", value: fmt(contributors.current), current: contributors.current, previous: contributors.prev, series: contributors.series, color: INK },
    {
      label: "Median review time",
      value: fmtDuration(speed.median),
      current: speed.median,
      previous: speed.medianPrev,
      series: speed.series.map((v) => v ?? 0),
      goodWhen: "down",
      color: STATUS.pending,
      format: (v) => fmtDuration(v),
    },
  ];

  return (
    <section id="overview" className="scroll-mt-40 space-y-4">
      <AttentionBanner {...data.attention} aging={data.queueAging} />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {tiles.map((t) => {
          const Wrapper = t.metric ? "button" : "div";
          return (
            <Wrapper
              key={t.label}
              {...(t.metric ? { type: "button" as const, onClick: () => onMetric(t.metric as MetricKey) } : {})}
              className={`group text-left bg-white border border-black/5 rounded-2xl p-4 sm:p-5 flex flex-col transition-all ${
                t.metric ? "cursor-pointer hover:border-black/15 hover:shadow-[0_8px_24px_-12px_rgba(35,32,29,0.25)]" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs sm:text-sm text-gray-500">{t.label}</p>
                <Delta current={t.current} previous={t.previous} goodWhen={t.goodWhen} />
              </div>
              <p className="font-logo text-3xl sm:text-4xl font-bold text-[#23201D] tracking-tight mt-1.5 tabular-nums">{t.value}</p>
              <div className="mt-3 -mx-1">
                <Sparkline values={t.series} labels={buckets} color={t.color ?? RED} format={t.format} />
              </div>
              {t.metric && (
                <span className="mt-2 text-[11px] font-semibold text-gray-400 group-hover:text-brand-red transition-colors inline-flex items-center gap-1">
                  See trend <ArrowRight className="w-3 h-3" />
                </span>
              )}
            </Wrapper>
          );
        })}
      </div>
    </section>
  );
}

// Fresh → stale, so the eye goes to the red end. Always labelled.
const AGE_TONES = ["#9FC4EE", "#5B9BE3", STATUS.changes, STATUS.rejected];

/** "3 hours", "4 days", "2 weeks": how a person would say it. */
function humanWait(hours: number | null) {
  if (hours === null) return "—";
  if (hours < 1) return "under an hour";
  if (hours < 24) return `${Math.round(hours)} ${Math.round(hours) === 1 ? "hour" : "hours"}`;
  const days = Math.round(hours / 24);
  if (days < 14) return `${days} ${days === 1 ? "day" : "days"}`;
  if (days < 60) return `${Math.round(days / 7)} weeks`;
  return `${Math.round(days / 30)} months`;
}

function AttentionBanner({
  pending,
  flagged,
  awaitingFixes,
  oldestHours,
  over48h,
  aging,
}: AnalyticsData["attention"] & { aging: AnalyticsData["queueAging"] }) {
  const total = pending + flagged;

  if (total === 0) {
    return (
      <div className="flex items-center gap-4 bg-white border border-black/5 rounded-2xl px-5 py-4">
        <span className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">You&apos;re all caught up</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Nothing pending or flagged
            {awaitingFixes > 0 ? `. ${awaitingFixes} ${awaitingFixes === 1 ? "note is" : "notes are"} waiting on the author to fix.` : "."}
          </p>
        </div>
      </div>
    );
  }

  const urgent = over48h > 0 || flagged > 0;
  const linkCls = "underline decoration-black/15 underline-offset-2 hover:text-brand-red hover:decoration-brand-red/40 transition-colors";
  const summary = [
    pending > 0 && (
      <Link key="p" href="/admin/queue?filter=pending" className={linkCls}>
        {pending} new {pending === 1 ? "submission" : "submissions"}
      </Link>
    ),
    flagged > 0 && (
      <Link key="f" href="/admin/queue?filter=flagged" className={linkCls}>
        {flagged} flagged by students
      </Link>
    ),
    oldestHours !== null && <span key="o">oldest waiting {humanWait(oldestHours)}</span>,
  ].filter(Boolean) as React.ReactNode[];

  return (
    <div className="bg-white border border-black/5 rounded-2xl overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-5">
        <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
          <span className={`relative w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${urgent ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600"}`}>
            <Inbox className="w-5 h-5" />
            {urgent && (
              <span className="absolute -top-0.5 -right-0.5 flex w-3 h-3">
                <span className="absolute inline-flex w-full h-full rounded-full bg-rose-400 opacity-60 motion-safe:animate-ping" />
                <span className="relative inline-flex w-3 h-3 rounded-full bg-rose-500 border-2 border-white" />
              </span>
            )}
          </span>
          <div className="min-w-0">
            <p className="text-base sm:text-lg font-semibold text-gray-900 leading-snug">
              <span className="tabular-nums">{total}</span> {total === 1 ? "note is" : "notes are"} waiting for review
            </p>
            <p className="text-sm text-gray-500 mt-0.5">
              {summary.map((part, i) => (
                <span key={i}>
                  {i > 0 && <span className="text-gray-300"> · </span>}
                  {part}
                </span>
              ))}
            </p>
          </div>
        </div>
        <Link
          href="/admin/queue"
          className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-brand-red text-white text-sm font-semibold hover:bg-brand-red-hover transition-colors shrink-0"
        >
          Open queue <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {pending > 0 && (
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-5 px-5 py-3.5 bg-gray-50/70 border-t border-black/5">
          <p className="text-xs font-medium text-gray-500 shrink-0 md:w-28">
            {over48h > 0 ? (
              <span className="text-rose-600">{over48h} waiting 2+ days</span>
            ) : (
              "All within 2 days"
            )}
          </p>
          <div className="flex-1 min-w-0">
            <StackedBar height="h-2" segments={aging.map((a, i) => ({ ...a, color: AGE_TONES[i] }))} />
          </div>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 shrink-0">
            {aging.map((a, i) => (
              <li key={a.label} className={`flex items-center gap-1.5 ${a.value === 0 ? "opacity-40" : ""}`}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: AGE_TONES[i] }} />
                {a.label}
                <b className="font-semibold text-gray-900 tabular-nums">{a.value}</b>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Growth ──────────────────────────────────────────────────────────

const METRIC_TABS: MetricKey[] = ["submissions", "signups", "approvals", "hours"];

function Growth({ data, metric, setMetric }: { data: AnalyticsData; metric: MetricKey; setMetric: (m: MetricKey) => void }) {
  const [cumulative, setCumulative] = useState(false);
  const [asTable, setAsTable] = useState(false);
  const m = data.metrics[metric];
  const { range, buckets, activity } = data;
  const running = (vals: number[]) => {
    let s = 0;
    return vals.map((v) => (s += v));
  };
  const current = cumulative ? running(m.current) : m.current;
  const previous = cumulative ? running(m.previous) : m.previous;
  const digits = metric === "hours" ? 1 : 0;
  const perDay = m.total / range.days;

  return (
    <Section id="growth" title="Growth" description={`Tap a metric to switch. The grey line is the ${range.prevLabel}, lined up for comparison.`}>
      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div role="tablist" aria-label="Metric" className="flex gap-1 overflow-x-auto -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {METRIC_TABS.map((key) => {
              const mm = data.metrics[key];
              const selected = key === metric;
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setMetric(key)}
                  className={`shrink-0 text-left rounded-xl px-4 py-3 border transition-all cursor-pointer ${
                    selected ? "border-[#23201D] bg-[#23201D] text-white" : "border-black/5 bg-gray-50/60 hover:bg-gray-100/80 text-gray-900"
                  }`}
                >
                  <span className={`block text-xs ${selected ? "text-white/60" : "text-gray-500"}`}>{mm.label}</span>
                  <span className="flex items-center gap-2 mt-0.5">
                    <span className="font-logo text-xl font-bold tabular-nums">{fmt(mm.total, key === "hours" ? 1 : 0)}</span>
                    {!selected && <Delta current={mm.total} previous={mm.prevTotal} />}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2 self-start">
            <Toggle
              options={[
                { value: false, label: `Per ${range.unit}` },
                { value: true, label: "Running total" },
              ]}
              value={cumulative}
              onChange={setCumulative}
            />
            <button
              type="button"
              onClick={() => setAsTable(!asTable)}
              aria-pressed={asTable}
              title={asTable ? "Show chart" : "Show table"}
              className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-black/10 text-gray-500 hover:text-gray-900 cursor-pointer"
            >
              {asTable ? <LineIcon className="w-4 h-4" /> : <Table2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-6 mb-3 text-xs">
          <span className="flex items-center gap-2 text-gray-700">
            <span className="w-3 h-[3px] rounded-full" style={{ backgroundColor: RED }} /> Last {range.label}
            <b className="font-semibold tabular-nums">{fmt(m.total, digits)}</b>
          </span>
          <span className="flex items-center gap-2 text-gray-500">
            <span className="w-3 h-[3px] rounded-full" style={{ backgroundColor: MUTED }} /> {cap(range.prevLabel)}
            <b className="font-semibold tabular-nums">{fmt(m.prevTotal, digits)}</b>
          </span>
          <span className="text-gray-400 sm:ml-auto">{fmt(perDay, 1)} {m.unit} a day on average</span>
        </div>

        {asTable ? (
          <div className="max-h-72 overflow-y-auto rounded-lg border border-black/5">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="text-left font-medium px-3 py-2">{cap(range.unit)}</th>
                  <th className="text-right font-medium px-3 py-2">This period</th>
                  <th className="text-right font-medium px-3 py-2">Previous</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 tabular-nums">
                {buckets.map((b, i) => (
                  <tr key={b.key}>
                    <td className="px-3 py-1.5 text-gray-600">{b.tooltip}</td>
                    <td className="px-3 py-1.5 text-right font-semibold text-gray-900">{fmt(current[i], digits)}</td>
                    <td className="px-3 py-1.5 text-right text-gray-500">{fmt(previous[i], digits)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <LineChart
            ariaLabel={`${m.label} per ${range.unit}, last ${range.label} compared with the ${range.prevLabel}`}
            labels={buckets}
            height={280}
            format={(v) => fmt(v, digits)}
            series={[
              { label: "This period", color: RED, values: current, area: true },
              { label: "Previous", color: MUTED, values: previous },
            ]}
          />
        )}
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <StatCard
          label={`Busiest ${range.unit}`}
          value={activity.best ? fmt(activity.best.value) : "—"}
          sub={activity.best ? `${activity.best.label} · submissions` : "No submissions yet"}
        />
        <StatCard label="Submission streak" value={`${activity.streak} ${activity.streak === 1 ? "day" : "days"}`} sub="In a row with at least one submission" />
        <StatCard
          label="Active days"
          value={`${activity.activeDays}/${activity.totalDays}`}
          sub={`${Math.round((activity.activeDays / activity.totalDays) * 100)}% of days had a submission`}
        >
          <div className="h-1.5 mt-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-brand-red rounded-full" style={{ width: `${(activity.activeDays / activity.totalDays) * 100}%` }} />
          </div>
        </StatCard>
      </div>
    </Section>
  );
}

// ─── Reviews ─────────────────────────────────────────────────────────

function Reviews({ data }: { data: AnalyticsData }) {
  const { status, funnel, rates, speed, decisions, buckets, range, queueAging } = data;
  const statusRows = [
    { label: "Approved", value: status.approved, color: STATUS.approved },
    { label: "Pending", value: status.pending, color: STATUS.pending },
    { label: "Awaiting fixes", value: status.changes, color: STATUS.changes },
    { label: "Flagged", value: status.flagged, color: STATUS.flagged },
    { label: "Rejected", value: status.rejected, color: STATUS.rejected },
  ];

  return (
    <Section id="reviews" title="Reviews" description="Where submissions stand, what reviewers decide, and how fast.">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardTitle title="Every submission, by status" meta={`${fmt(status.total)} total`} />
          <StackedBar segments={statusRows} height="h-4" />
          <ul className="mt-5 divide-y divide-black/5">
            {statusRows.map((s) => (
              <li key={s.label} className="flex items-center gap-3 py-2 text-sm">
                <span className="w-2.5 h-2.5 rounded-[3px] shrink-0" style={{ backgroundColor: s.color }} />
                <span className="flex-1 text-gray-600">{s.label}</span>
                <span className="font-semibold text-gray-900 tabular-nums">{fmt(s.value)}</span>
                <span className="w-10 text-right text-xs text-gray-400 tabular-nums">{status.total ? Math.round((s.value / status.total) * 100) : 0}%</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardTitle title="Submission funnel" meta="All time" />
          <Funnel steps={funnel} />
          <p className="text-[11px] text-gray-400 mt-4">&ldquo;Still live&rdquo; excludes approved notes that were later flagged.</p>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
          <div className="flex-1 min-w-0">
            <CardTitle title="Decisions over time" meta={`Per ${range.unit}`} />
            <Legend
              items={[
                { label: "Approved", color: STATUS.approved },
                { label: "Fixes requested", color: STATUS.changes },
                { label: "Rejected", color: STATUS.rejected },
              ]}
            />
            <ColumnChart
              ariaLabel="Review decisions over time, stacked by outcome"
              labels={buckets}
              height={220}
              unit="decisions"
              series={[
                { label: "Approved", color: STATUS.approved, values: decisions.approved },
                { label: "Fixes requested", color: STATUS.changes, values: decisions.changes },
                { label: "Rejected", color: STATUS.rejected, values: decisions.rejected },
              ]}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4 pt-5 border-t border-black/5 lg:pt-0 lg:border-t-0 lg:w-52 lg:border-l lg:pl-8 content-start">
            <RateStat
              label="Approval rate"
              value={rates.approval}
              extra={<Delta current={rates.approval} previous={rates.approvalPrev} mode="points" />}
              sub={`of decisions, last ${range.label}`}
            />
            <RateStat label="Flag rate" value={rates.flag} sub="of approved notes got reported" />
            <RateStat
              label="Fixed & approved"
              value={rates.resub}
              sub={rates.resubTotal ? `${rates.resubApproved} of ${rates.resubTotal} sent back` : "None sent back yet"}
            />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4">
        <Card>
          <CardTitle title="Review speed" meta={`Submission → first decision`} />
          <div className="grid grid-cols-3 gap-4 mb-6">
            <BigStat label="Median" value={fmtDuration(speed.median)} extra={<Delta current={speed.median} previous={speed.medianPrev} goodWhen="down" />} />
            <BigStat label="Slowest 10%" value={fmtDuration(speed.p90)} />
            <BigStat label="Within 24h" value={speed.within24 === null ? "—" : `${speed.within24}%`} />
          </div>
          {speed.count === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No decisions in the last {range.label}.</p>
          ) : (
            <>
              <LineChart
                ariaLabel={`Median review time per ${range.unit}`}
                labels={buckets}
                height={170}
                format={(v) => fmtDuration(v)}
                series={[{ label: "Median", color: STATUS.pending, values: speed.series, area: true }]}
              />
              <div className="mt-6 pt-5 border-t border-black/5">
                <p className="text-xs font-semibold text-gray-500 mb-2">How long {fmt(speed.count)} decisions took</p>
                <RankedBars rows={speed.bands} color={STATUS.pending} total={speed.count} limit={5} />
              </div>
            </>
          )}
        </Card>
        <Card>
          <CardTitle title="Queue age" meta={`${fmt(status.pending)} pending`} />
          {status.pending === 0 ? (
            <div className="py-10 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="text-sm text-gray-500 mt-2">Nothing waiting.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {queueAging.map((q, i) => {
                const tone = AGE_TONES[i];
                return (
                  <li key={q.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{q.label}</span>
                      <span className="font-semibold text-gray-900 tabular-nums">{q.value}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(q.value / Math.max(1, status.pending)) * 100}%`, backgroundColor: tone }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <Link href="/admin/queue" className="mt-6 inline-flex items-center gap-1 text-xs font-semibold text-brand-red hover:text-brand-red-hover">
            Open review queue <ArrowRight className="w-3 h-3" />
          </Link>
        </Card>
      </div>
    </Section>
  );
}

// ─── Library ─────────────────────────────────────────────────────────

function Library({ data }: { data: AnalyticsData }) {
  const { library: lib, buckets, range } = data;
  const [view, setView] = useState<"courses" | "subjects">("courses");
  const [query, setQuery] = useState("");
  const langTotal = lib.english + lib.french;
  const rows = (view === "courses" ? lib.courseRows : lib.subjectRows).filter((r) => r.label.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <Section id="library" title="Library" description="Everything approved and published.">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Published notes" value={fmt(lib.published)} sub={`+${fmt(lib.publishedInRange)} in the last ${range.label}`} />
        <StatCard label="Courses covered" value={fmt(lib.courses)} sub={`${fmt(lib.newCourses.length)} new in the last ${range.label}`} />
        <StatCard label="Subjects" value={fmt(lib.subjects)} sub={`${fmt(lib.singleNoteCourses)} ${lib.singleNoteCourses === 1 ? "course has" : "courses have"} just 1 note`} />
        <StatCard label="Avg. hours per note" value={fmt(lib.avgHours, 1)} sub="Volunteer hours awarded" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <Toggle
              options={[
                { value: "courses" as const, label: "Courses" },
                { value: "subjects" as const, label: "Subjects" },
              ]}
              value={view}
              onChange={setView}
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${view}…`}
              className="h-8 w-40 sm:w-48 px-3 rounded-lg border border-black/10 bg-white text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-red/50"
            />
          </div>
          <RankedBars rows={rows} total={lib.published} limit={10} emptyText={query ? "No matches." : "No published notes yet."} />
          {lib.newCourses.length > 0 && (
            <div className="mt-6 pt-5 border-t border-black/5">
              <p className="text-xs font-semibold text-gray-500 mb-2">First notes in the last {range.label}</p>
              <div className="flex flex-wrap gap-1.5">
                {lib.newCourses.slice(0, 18).map((c) => (
                  <span key={c} className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-800 text-[11px] font-semibold tabular-nums">{c}</span>
                ))}
                {lib.newCourses.length > 18 && <span className="px-2 py-1 text-[11px] text-gray-400">+{lib.newCourses.length - 18} more</span>}
              </div>
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <Card>
            <CardTitle title="Library size" meta="Published notes over time" />
            <LineChart
              ariaLabel={`Total published notes over the last ${range.label}`}
              labels={buckets}
              height={150}
              format={(v) => fmt(v)}
              series={[{ label: "Published", color: STATUS.approved, values: lib.cumulative, area: true }]}
            />
          </Card>
          <Card>
            <CardTitle title="Language" />
            <StackedBar
              height="h-3"
              segments={[
                { label: "English", value: lib.english, color: RED },
                { label: "French", value: lib.french, color: INK },
              ]}
            />
            <div className="flex justify-between mt-3 text-sm">
              <LegendValue color={RED} label="English" value={lib.english} total={langTotal} />
              <LegendValue color={INK} label="French" value={lib.french} total={langTotal} />
            </div>
          </Card>
          <Card>
            <CardTitle title="Note types" meta="Notes can have several" />
            <RankedBars rows={lib.types} color={INK} total={lib.published} limit={6} emptyText="No published notes yet." />
          </Card>
        </div>
      </div>
    </Section>
  );
}

// ─── Community ───────────────────────────────────────────────────────

function Community({ data }: { data: AnalyticsData }) {
  const { community: c, range } = data;
  const [board, setBoard] = useState<"range" | "all">("range");
  const [heat, setHeat] = useState<"submissions" | "signups">("submissions");
  const leaders = board === "range" ? c.leadersRange : c.leadersAll;

  return (
    <Section id="community" title="Community" description="Who's signing up, who's contributing, and when.">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <StatCard label="Users" value={fmt(c.totalUsers)} sub={`${fmt(c.admins)} admins · ${fmt(c.banned)} banned`} />
        <StatCard label="Contributors" value={fmt(c.contributors)} sub={`${c.contributorRate}% of all users`} />
        <StatCard label="First-time contributors" value={fmt(c.firstTimeInRange)} sub={`In the last ${range.label}`} />
        <StatCard label="Came back" value={fmt(c.repeat)} sub="Submitted 2 or more notes" />
        <StatCard
          label="Signup → first note"
          value={c.medianDaysToFirst === null ? "—" : c.medianDaysToFirst < 1 ? "<1 day" : `${fmt(c.medianDaysToFirst, 0)} days`}
          sub="Median wait"
          className="col-span-2 lg:col-span-1"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardTitle title="From signup to published" meta="All time" />
          <Funnel steps={c.activation} color={INK} />
        </Card>
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h3 className="font-logo text-lg font-bold text-[#23201D]">Top contributors</h3>
            <Toggle
              options={[
                { value: "range" as const, label: `Last ${range.label}` },
                { value: "all" as const, label: "All time" },
              ]}
              value={board}
              onChange={setBoard}
            />
          </div>
          <Leaderboard leaders={leaders} />
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="font-logo text-lg font-bold text-[#23201D]">When it happens</h3>
            <p className="text-xs text-gray-400 mt-0.5">All time, by day and 3-hour block. Hover or tap a square.</p>
          </div>
          <Toggle
            options={[
              { value: "submissions" as const, label: "Submissions" },
              { value: "signups" as const, label: "Signups" },
            ]}
            value={heat}
            onChange={setHeat}
          />
        </div>
        <Heatmap grid={heat === "submissions" ? c.heatSubmissions : c.heatSignups} unit={heat} />
      </Card>
    </Section>
  );
}

function Leaderboard({ leaders }: { leaders: Leader[] }) {
  if (leaders.length === 0) return <p className="text-sm text-gray-400 py-10 text-center">No approved notes in this period.</p>;
  const max = Math.max(1, ...leaders.map((l) => l.hours));
  return (
    <ol className="space-y-1">
      {leaders.map((l, i) => (
        <li key={`${l.name}-${i}`} className="flex items-center gap-3 py-1.5">
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold tabular-nums shrink-0 ${
              i === 0 ? "bg-brand-red text-white" : i < 3 ? "bg-[#23201D] text-white" : "bg-gray-100 text-gray-500"
            }`}
          >
            {i + 1}
          </span>
          <span className="flex-1 min-w-0">
            <span className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-semibold text-gray-900 truncate">{l.name}</span>
              <span className="text-xs tabular-nums text-gray-500 shrink-0">
                <b className="text-gray-900 font-semibold">{fmt(l.hours, 1)}h</b> · {l.approved} {l.approved === 1 ? "note" : "notes"}
              </span>
            </span>
            <span className="block h-1 mt-1.5 bg-gray-100 rounded-full overflow-hidden">
              <span className="block h-full rounded-full bg-brand-red/70" style={{ width: `${(l.hours / max) * 100}%` }} />
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}

// ─── Team ────────────────────────────────────────────────────────────

type SortKey = "inRange" | "approvalRate" | "medianHours" | "lastActive" | "name";

function Team({ data }: { data: AnalyticsData }) {
  const { team, range } = data;
  const { online, connected, selfId } = useAdminPresence();
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "inRange", dir: -1 });

  const rows = useMemo(() => {
    const val = (r: TeamMember): number | string => {
      switch (sort.key) {
        case "name": return r.name.toLowerCase();
        case "lastActive": return r.lastActive ? new Date(r.lastActive).getTime() : 0;
        case "medianHours": return r.medianHours ?? (sort.dir === 1 ? Infinity : -Infinity);
        case "approvalRate": return r.approvalRate ?? -1;
        default: return r.inRange;
      }
    };
    return [...team.rows].sort((a, b) => {
      const va = val(a);
      const vb = val(b);
      return (va < vb ? -1 : va > vb ? 1 : 0) * sort.dir;
    });
  }, [team.rows, sort]);

  const header = (key: SortKey, label: string, align = "text-right") => (
    <th className={`px-4 py-3 font-medium ${align}`} aria-sort={sort.key === key ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>
      <button
        type="button"
        onClick={() => setSort((s) => ({ key, dir: s.key === key ? ((s.dir * -1) as 1 | -1) : key === "name" || key === "medianHours" ? 1 : -1 }))}
        className={`inline-flex items-center gap-1 hover:text-gray-900 cursor-pointer ${sort.key === key ? "text-gray-900" : ""}`}
      >
        {label}
        {sort.key === key && (sort.dir === 1 ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
      </button>
    </th>
  );

  return (
    <Section id="team" title="Admin team" description="Who's on the desk right now, and how everyone's been reviewing. Click anyone for their full history.">
      <OnlineNow online={online} connected={connected} selfId={selfId} team={team.rows} />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <StatCard label="Active reviewers" value={`${team.activeReviewers}/${team.totalAdmins}`} sub={`Made a decision in the last ${range.label}`} />
        <StatCard
          label="Team decisions"
          value={fmt(team.decisionsInRange)}
          sub={`vs ${fmt(team.decisionsPrev)} in the ${range.prevLabel}`}
          extra={<Delta current={team.decisionsInRange} previous={team.decisionsPrev} />}
        />
        <StatCard
          label="Per active reviewer"
          value={team.activeReviewers ? fmt(team.decisionsInRange / team.activeReviewers, 1) : "—"}
          sub={`Decisions in the last ${range.label}`}
          className="col-span-2 lg:col-span-1"
        />
      </div>

      <Card padded={false}>
        {rows.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-gray-400">No admins found.</p>
        ) : (
          <>
            {/* Desktop table */}
            <table className="hidden md:table w-full text-sm">
              <thead className="text-xs text-gray-400 border-b border-black/5 bg-gray-50/50">
                <tr>
                  {header("name", "Admin", "text-left")}
                  <th className="px-4 py-3 font-medium text-left">All-time decisions</th>
                  {header("inRange", `Last ${range.label}`)}
                  {header("approvalRate", "Approval")}
                  {header("medianHours", "Median speed")}
                  {header("lastActive", "Last active")}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {rows.map((r) => (
                  <tr key={r.id} className="group hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3.5">
                      <Link href={`/admin/analytics/${r.id}`} className="flex items-center gap-3">
                        <Avatar name={r.name} presence={online.get(r.id)} />
                        <span className="min-w-0">
                          <span className="block font-semibold text-gray-900 group-hover:text-brand-red transition-colors truncate">{r.name}</span>
                          <span className="block text-xs text-gray-400 truncate">{r.email}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 w-[26%]">
                      <DecisionMix r={r} />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="font-semibold text-gray-900 tabular-nums">{r.inRange}</span>
                      {r.share !== null && <span className="block text-[11px] text-gray-400">{r.share}% of team</span>}
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold text-gray-900 tabular-nums">{r.approvalRate === null ? "—" : `${r.approvalRate}%`}</td>
                    <td className="px-4 py-3.5 text-right font-semibold text-gray-900 tabular-nums">{fmtDuration(r.medianHours)}</td>
                    <td className="px-4 py-3.5 text-right">
                      <Link href={`/admin/analytics/${r.id}`} className="inline-flex items-center gap-1 text-xs text-gray-500 group-hover:text-brand-red transition-colors">
                        <PresenceText presence={online.get(r.id)} lastActive={r.lastActive} /> <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile cards */}
            <ul className="md:hidden divide-y divide-black/5">
              {rows.map((r) => (
                <li key={r.id}>
                  <Link href={`/admin/analytics/${r.id}`} className="block px-4 py-4 active:bg-gray-50">
                    <span className="flex items-center gap-3">
                      <Avatar name={r.name} presence={online.get(r.id)} />
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-semibold text-gray-900 truncate">{r.name}</span>
                        <span className="block text-xs text-gray-400"><PresenceText presence={online.get(r.id)} lastActive={r.lastActive} prefix="Active " /></span>
                      </span>
                      <ArrowRight className="w-4 h-4 text-gray-300" />
                    </span>
                    <span className="block mt-3">
                      <DecisionMix r={r} />
                    </span>
                    <span className="grid grid-cols-3 gap-2 mt-3 text-center">
                      <MiniMetric label={`Last ${range.label}`} value={String(r.inRange)} />
                      <MiniMetric label="Approval" value={r.approvalRate === null ? "—" : `${r.approvalRate}%`} />
                      <MiniMetric label="Median" value={fmtDuration(r.medianHours)} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
    </Section>
  );
}

function DecisionMix({ r }: { r: TeamMember }) {
  return (
    <span className="block">
      <StackedBar
        height="h-2"
        segments={[
          { label: "Approved", value: r.approved, color: STATUS.approved },
          { label: "Fixes", value: r.changes, color: STATUS.changes },
          { label: "Rejected", value: r.rejected, color: STATUS.rejected },
        ]}
      />
      <span className="flex gap-3 mt-1.5 text-[11px] text-gray-500 tabular-nums">
        <span><b className="font-semibold text-gray-800">{r.approved}</b> approved</span>
        <span><b className="font-semibold text-gray-800">{r.changes}</b> fixes</span>
        <span><b className="font-semibold text-gray-800">{r.rejected}</b> rejected</span>
      </span>
    </span>
  );
}

// ─── Building blocks ─────────────────────────────────────────────────

function Section({ id, title, description, children }: { id: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-40 space-y-4">
      <div>
        <h2 className="font-logo text-2xl sm:text-[1.75rem] font-bold text-[#23201D] tracking-tight">{title}</h2>
        <p className="text-sm text-gray-500 mt-0.5">{description}</p>
      </div>
      {children}
    </section>
  );
}

function Card({ children, padded = true }: { children: React.ReactNode; padded?: boolean }) {
  return (
    <div className={`bg-white border border-black/5 rounded-2xl shadow-[0_1px_2px_rgba(35,32,29,0.04)] ${padded ? "p-5 sm:p-6" : "overflow-hidden"}`}>
      {children}
    </div>
  );
}

function CardTitle({ title, meta }: { title: string; meta?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 mb-4">
      <h3 className="font-logo text-lg font-bold text-[#23201D]">{title}</h3>
      {meta && <span className="text-xs text-gray-400 text-right">{meta}</span>}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  extra,
  children,
  className = "",
}: {
  label: string;
  value: string;
  sub?: string;
  extra?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white border border-black/5 rounded-2xl p-4 sm:p-5 ${className}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs text-gray-500">{label}</p>
        {extra}
      </div>
      <p className="font-logo text-2xl sm:text-3xl font-bold text-[#23201D] tabular-nums mt-1">{value}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-1 leading-snug">{sub}</p>}
      {children}
    </div>
  );
}

function BigStat({ label, value, extra }: { label: string; value: string; extra?: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] sm:text-xs text-gray-500">{label}</p>
      <p className="flex flex-wrap items-center gap-2 mt-0.5">
        <span className="font-logo text-2xl sm:text-3xl font-bold text-[#23201D] tabular-nums">{value}</span>
        {extra}
      </p>
    </div>
  );
}

function RateStat({ label, value, sub, extra }: { label: string; value: number | null; sub: string; extra?: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="flex flex-wrap items-center gap-2 mt-0.5">
        <span className="font-logo text-2xl font-bold text-[#23201D] tabular-nums">{value === null ? "—" : `${value}%`}</span>
        {extra}
      </p>
      <p className="text-[11px] text-gray-400 leading-snug">{sub}</p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-lg bg-gray-50 py-2">
      <span className="block text-sm font-semibold text-gray-900 tabular-nums">{value}</span>
      <span className="block text-[10px] text-gray-400">{label}</span>
    </span>
  );
}

function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4 text-xs text-gray-600">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-[3px]" style={{ backgroundColor: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  );
}

function LegendValue({ color, label, value, total }: { color: string; label: string; value: number; total: number }) {
  return (
    <span className="flex items-center gap-2">
      <span className="w-2.5 h-2.5 rounded-[3px]" style={{ backgroundColor: color }} />
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-gray-900 tabular-nums">{fmt(value)}</span>
      <span className="text-gray-400 text-xs tabular-nums">{total ? Math.round((value / total) * 100) : 0}%</span>
    </span>
  );
}

function Toggle<T extends string | boolean>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div role="tablist" className="inline-flex bg-gray-100 rounded-lg p-0.5">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="tab"
          aria-selected={o.value === value}
          onClick={() => onChange(o.value)}
          className={`h-7 px-3 rounded-md text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            o.value === value ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Avatar({ name, presence, size = "md" }: { name: string; presence?: OnlineAdmin; size?: "sm" | "md" }) {
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
function PresenceText({ presence, lastActive, prefix = "" }: { presence?: OnlineAdmin; lastActive: string | null; prefix?: string }) {
  if (!presence) return <>{prefix}{relativeTime(lastActive)}</>;
  return (
    <span className={presence.status === "active" ? "text-emerald-700 font-medium" : "text-amber-700 font-medium"}>
      {presence.status === "active" ? "Online" : "Idle"} · {presence.label}
    </span>
  );
}

/** Live list of admins on the desk, from Realtime Presence. */
function OnlineNow({
  online,
  connected,
  selfId,
  team,
}: {
  online: Map<string, OnlineAdmin>;
  connected: boolean;
  selfId: string | null;
  team: TeamMember[];
}) {
  const now = useNow(15_000);
  const names = new Map(team.map((t) => [t.id, t.name]));
  const nameOf = (p: OnlineAdmin) => names.get(p.userId) || p.name;
  const people = [...online.values()].sort((a, b) =>
    a.status !== b.status ? (a.status === "active" ? -1 : 1) : nameOf(a).localeCompare(nameOf(b))
  );
  const activeCount = people.filter((p) => p.status === "active").length;

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h3 className="font-logo text-lg font-bold text-[#23201D] flex items-center gap-2.5">
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
    </Card>
  );
}

/** Compact avatar stack of who's online, for the toolbar. */
function OnlineStack() {
  const { online, connected } = useAdminPresence();
  if (!connected || online.size === 0) return null;
  const people = [...online.values()].sort((a, b) => (a.status === b.status ? 0 : a.status === "active" ? -1 : 1));
  const activeCount = people.filter((p) => p.status === "active").length;

  return (
    <a
      href="#team"
      onClick={(e) => {
        e.preventDefault();
        document.getElementById("team")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }}
      title={people.map((p) => `${p.name}: ${p.status === "active" ? p.label : "idle"}`).join("\n")}
      className="hidden md:inline-flex items-center gap-2 h-9 pl-1.5 pr-3 rounded-lg hover:bg-white transition-colors"
    >
      <span className="flex -space-x-2">
        {people.slice(0, 4).map((p) => (
          <span key={p.userId} className="ring-2 ring-[#FBF8F3] rounded-full">
            <Avatar name={p.name} presence={p} size="sm" />
          </span>
        ))}
      </span>
      <span className="text-xs font-semibold text-gray-600 whitespace-nowrap">{activeCount} online</span>
    </a>
  );
}

function LiveIndicator({ generatedAt, realtime, refreshing }: { generatedAt: string; realtime: boolean; refreshing: boolean }) {
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

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function relativeTime(iso: string | null) {
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
function useLiveRefresh(range: RangeKey, onData: (d: AnalyticsData) => void) {
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

/** Highlights the section currently in view in the sticky nav. */
function useScrollSpy(ids: string[]) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const visible = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) visible.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0);
        const best = ids.find((id) => (visible.get(id) ?? 0) > 0);
        if (best) setActive(best);
      },
      { rootMargin: "-160px 0px -55% 0px", threshold: [0, 0.01, 0.5] }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(",")]);
  return active;
}

function downloadCsv(data: AnalyticsData) {
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
