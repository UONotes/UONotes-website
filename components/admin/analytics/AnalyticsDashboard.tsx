"use client";

import { useMemo, useState, useSyncExternalStore, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight, CheckCircle2, ChevronDown, ChevronUp, Download, Info, Loader2, TrendingDown, TrendingUp } from "lucide-react";
import type { Leader, MetricKey } from "@/lib/analytics-data";
import type { FullAnalytics } from "@/lib/analytics-loader";
import type { Person, Timing } from "@/lib/analytics-workflow";
import { RANGES, type RangeKey } from "@/lib/analytics";
import { useAdminPresence } from "@/components/admin/AdminPresence";
import { ColumnChart, Delta, Funnel, Heatmap, LineChart, MUTED, RED, RankedBars, STATUS, StackedBar, fmt, fmtDuration } from "./charts";
import { Avatar, LiveIndicator, OnlineNow, OnlineStack, PresenceText, cap, downloadCsv, useLiveRefresh } from "./parts";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "review", label: "Review flow" },
  { id: "library", label: "Library" },
  { id: "students", label: "Students" },
  { id: "team", label: "Team" },
] as const;
type TabId = (typeof TABS)[number]["id"];

const RANGE_TABS: { key: RangeKey; label: string }[] = [
  { key: "7d", label: "7D" },
  { key: "30d", label: "30D" },
  { key: "90d", label: "90D" },
  { key: "1y", label: "1Y" },
];

const BLUE = STATUS.pending;

// The open tab lives in the URL hash, so it survives a refresh and can be linked to.
const onHash = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};
function useTab(): [TabId, (t: TabId) => void] {
  const hash = useSyncExternalStore(onHash, () => window.location.hash.slice(1), () => "");
  const tab = TABS.find((t) => t.id === hash)?.id ?? "overview";
  return [tab, (t) => { window.location.hash = t; }];
}

export function AnalyticsDashboard({ initialData }: { initialData: FullAnalytics }) {
  const router = useRouter();
  // Live updates replace the server-rendered data, but only for the range
  // currently shown and only if they're newer (a range switch brings fresh props).
  const [liveData, setLiveData] = useState<FullAnalytics | null>(null);
  const data =
    liveData && liveData.range.key === initialData.range.key && liveData.generatedAt > initialData.generatedAt ? liveData : initialData;
  const [isPending, startTransition] = useTransition();
  const [pendingRange, setPendingRange] = useState<RangeKey | null>(null);
  const [tab, setTab] = useTab();
  const live = useLiveRefresh(initialData.range.key, setLiveData);
  const { range } = data;

  const changeRange = (key: RangeKey) => {
    if (key === range.key) return;
    setPendingRange(key);
    startTransition(() => router.push(`/admin/analytics?range=${key}#${tab}`, { scroll: false }));
  };

  return (
    <div className="w-full pb-12">
      <div className="sticky top-0 z-30 -mx-6 -mt-6 border-b border-brand-border-light bg-brand-surface px-6 pt-6 sm:-mx-10 sm:-mt-10 sm:px-10 sm:pt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className="flex items-center gap-2.5 font-logo text-3xl font-bold tracking-tight text-brand-dark">
              Analytics
              {isPending && <Loader2 className="h-4 w-4 animate-spin text-brand-muted" aria-label="Loading" />}
            </h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-brand-muted sm:text-sm">
              Last {range.label}, compared with the {range.prevLabel}
              <LiveIndicator generatedAt={data.generatedAt} realtime={live.realtime} refreshing={live.refreshing} />
            </p>
          </div>
          <div className="flex items-center gap-2">
            <OnlineStack onOpen={() => setTab("team")} />
            <button
              type="button"
              onClick={() => downloadCsv(data)}
              className="hidden h-9 items-center gap-1.5 rounded-md border border-brand-border-light bg-white px-3 text-xs font-semibold text-brand-body transition-colors hover:border-brand-red/40 hover:text-brand-red sm:inline-flex"
            >
              <Download className="h-3.5 w-3.5" /> Export CSV
            </button>
            <Segmented
              label="Time range"
              options={RANGE_TABS.map((t) => ({ value: t.key, label: t.label, title: `Last ${RANGES[t.key].label}` }))}
              value={pendingRange && isPending ? pendingRange : range.key}
              onChange={changeRange}
            />
          </div>
        </div>
        <div role="tablist" aria-label="Sections" className="-mb-px mt-4 flex gap-5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`shrink-0 border-b-2 pb-3 text-sm font-semibold transition-colors ${
                tab === t.id ? "border-brand-red text-brand-red" : "border-transparent text-brand-muted hover:text-brand-dark"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div role="tabpanel" className={`mt-6 space-y-5 transition-opacity ${isPending ? "pointer-events-none opacity-50" : ""}`}>
        {tab === "overview" && <Overview data={data} goTo={setTab} />}
        {tab === "review" && <ReviewFlow data={data} />}
        {tab === "library" && <Library data={data} />}
        {tab === "students" && <Students data={data} />}
        {tab === "team" && <Team data={data} />}
      </div>
    </div>
  );
}

// ─── Overview ────────────────────────────────────────────────────────

function Overview({ data, goTo }: { data: FullAnalytics; goTo: (t: TabId) => void }) {
  const { metrics, speed, buckets, range } = data;
  const [metric, setMetric] = useState<MetricKey>("submissions");
  const m = metrics[metric];
  const digits = metric === "hours" ? 1 : 0;

  return (
    <>
      <Pipeline data={data} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Notes submitted" value={fmt(metrics.submissions.total)} now={metrics.submissions.total} prev={metrics.submissions.prevTotal} />
        <Stat label="Approvals" value={fmt(metrics.approvals.total)} now={metrics.approvals.total} prev={metrics.approvals.prevTotal} />
        <Stat label="New students" value={fmt(metrics.signups.total)} now={metrics.signups.total} prev={metrics.signups.prevTotal} />
        <Stat
          label="Typical time to a decision"
          value={fmtDuration(speed.median)}
          now={speed.median}
          prev={speed.medianPrev}
          goodWhen="down"
          format={fmtDuration}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card
          title="Trend"
          action={
            <Segmented
              label="Metric"
              options={(["submissions", "approvals", "signups", "hours"] as MetricKey[]).map((k) => ({ value: k, label: metrics[k].label }))}
              value={metric}
              onChange={setMetric}
            />
          }
        >
          <Legend
            items={[
              { label: `Last ${range.label}`, color: RED, value: fmt(m.total, digits) },
              { label: cap(range.prevLabel), color: MUTED, value: fmt(m.prevTotal, digits) },
            ]}
          />
          <LineChart
            ariaLabel={`${m.label} per ${range.unit}, last ${range.label} compared with the ${range.prevLabel}`}
            labels={buckets}
            height={260}
            format={(v) => fmt(v, digits)}
            series={[
              { label: "This period", color: RED, values: m.current, area: true },
              { label: "Previous", color: MUTED, values: m.previous },
            ]}
          />
          <DataTable
            columns={[cap(range.unit), "This period", "Previous"]}
            rows={buckets.map((b, i) => [b.tooltip, fmt(m.current[i], digits), fmt(m.previous[i], digits)])}
          />
        </Card>
        <Card title="What stands out">
          <Insights data={data} goTo={goTo} />
        </Card>
      </div>
    </>
  );
}

// Every open note, by the step it's waiting on
function Pipeline({ data }: { data: FullAnalytics }) {
  const { stages } = data.workflow;
  const open = stages.reduce((s, x) => s + x.count, 0);
  const late = stages.reduce((s, x) => s + x.overdue, 0);
  return (
    <Card
      title="Where notes are right now"
      meta={open === 0 ? "Nothing open" : `${open} open${late ? `, ${late} running late` : ", none running late"}`}
      flush
    >
      <ol className="grid grid-cols-2 gap-px bg-brand-border-light lg:grid-cols-4">
        {stages.map((s) => (
          <li key={s.key} className="bg-white">
            <Link href={`/admin/queue?filter=${s.key}`} className="group block h-full px-5 py-4 transition-colors hover:bg-brand-surface/60">
              <span className="flex items-center justify-between gap-2 text-sm text-brand-body group-hover:text-brand-red">
                {s.label}
                <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
              </span>
              <span className="mt-1 block text-3xl font-semibold tabular-nums text-brand-dark">{s.count}</span>
              <span className="mt-1 block text-xs text-brand-muted">
                {s.count === 0 ? "All clear" : s.oldestHours === null ? "Wait not tracked" : `Oldest: ${humanWait(s.oldestHours)}`}
              </span>
              {s.overdue > 0 && (
                <span className="mt-2 inline-flex items-center gap-1 rounded bg-rose-50 px-1.5 py-0.5 text-xs font-semibold text-rose-700">
                  <AlertTriangle className="h-3 w-3" /> {s.overdue} over {s.limitHours / 24} days
                </span>
              )}
            </Link>
          </li>
        ))}
      </ol>
    </Card>
  );
}

type Insight = { tone: "bad" | "good" | "info"; text: ReactNode; tab: TabId };

function getInsights(data: FullAnalytics): Insight[] {
  const { workflow: w, metrics, library, range } = data;
  const out: Insight[] = [];
  const sum = (a: number[]) => a.reduce((s, v) => s + v, 0);

  for (const s of w.stages) {
    if (s.overdue > 0)
      out.push({
        tone: "bad",
        tab: "review",
        text: <><b>{s.overdue}</b> {s.overdue === 1 ? "note has" : "notes have"} been in “{s.label}” for more than {s.limitHours / 24} days.</>,
      });
  }

  const submitted = sum(w.submitted);
  const decided = sum(w.decided);
  if (submitted + decided >= 5 && submitted > decided * 1.2)
    out.push({ tone: "bad", tab: "review", text: <>More notes are coming in (<b>{submitted}</b>) than getting a first decision (<b>{decided}</b>), so the queue is growing.</> });

  // The same step, shared across everyone who does it
  const finals = [...w.people].sort((a, b) => b.finals - a.finals);
  const allFinals = sum(finals.map((p) => p.finals));
  if (allFinals >= 8 && finals[0].finals / allFinals >= 0.6)
    out.push({ tone: "info", tab: "team", text: <><b>{finals[0].name}</b> did {Math.round((finals[0].finals / allFinals) * 100)}% of final checks in the last {range.label}.</> });

  const { total, prevTotal } = metrics.submissions;
  if (prevTotal >= 5 && Math.abs(total - prevTotal) / prevTotal >= 0.2)
    out.push({
      tone: total > prevTotal ? "good" : "bad",
      tab: "students",
      text: <>Submissions are {total > prevTotal ? "up" : "down"} <b>{Math.round((Math.abs(total - prevTotal) / prevTotal) * 100)}%</b> ({prevTotal} to {total}).</>,
    });

  if (w.sentBack.rate !== null && w.sentBack.rate >= 25 && w.sentBack.count >= 3)
    out.push({ tone: "info", tab: "review", text: <><b>{w.sentBack.rate}%</b> of final checks were sent back to be redone.</> });

  const empty = w.faculties.filter((f) => f.published === 0).map((f) => f.label);
  if (empty.length > 0 && library.published > 0)
    out.push({ tone: "info", tab: "library", text: <>No published notes yet for <b>{empty.join(", ")}</b>.</> });

  const fr = library.english + library.french ? Math.round((library.french / (library.english + library.french)) * 100) : null;
  if (fr !== null && library.published >= 10 && fr < 15)
    out.push({ tone: "info", tab: "library", text: <>Only <b>{fr}%</b> of the library is in French.</> });

  return out.slice(0, 5);
}

const TONE = {
  bad: { icon: AlertTriangle, className: "text-rose-600" },
  good: { icon: TrendingUp, className: "text-emerald-600" },
  info: { icon: Info, className: "text-brand-muted" },
};

function Insights({ data, goTo }: { data: FullAnalytics; goTo: (t: TabId) => void }) {
  const items = getInsights(data);
  if (items.length === 0)
    return (
      <p className="flex items-start gap-2 text-sm text-brand-body">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> Nothing unusual in the last {data.range.label}.
      </p>
    );
  return (
    <ul className="-my-3 divide-y divide-brand-border-light">
      {items.map((it, i) => {
        const Icon = it.tone === "bad" && it.tab === "students" ? TrendingDown : TONE[it.tone].icon;
        return (
          <li key={i}>
            <button type="button" onClick={() => goTo(it.tab)} className="group flex w-full items-start gap-3 py-3 text-left text-sm leading-relaxed text-brand-body">
              <Icon className={`mt-1 h-4 w-4 shrink-0 ${TONE[it.tone].className}`} />
              <span className="flex-1 group-hover:text-brand-red [&_b]:font-semibold [&_b]:text-brand-dark">{it.text}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

// ─── Review flow ─────────────────────────────────────────────────────

function ReviewFlow({ data }: { data: FullAnalytics }) {
  const { workflow: w, speed, rates, decisions, buckets, range, status } = data;
  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <TimingStat label="First check" hint="Submitted until a director acts" t={w.firstCheck} />
        <TimingStat label="Final check" hint="Sent to VP until they decide" t={w.finalCheck} />
        <TimingStat label="Start to finish" hint="Submitted until the first decision" t={{ median: speed.median, prev: speed.medianPrev, count: speed.count }} />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card title="Are we keeping up?" meta={`Per ${range.unit}`}>
          <Legend
            items={[
              { label: "Submitted", color: RED, value: fmt(w.submitted.reduce((s, v) => s + v, 0)) },
              { label: "First decision made", color: BLUE, value: fmt(w.decided.reduce((s, v) => s + v, 0)) },
            ]}
          />
          <LineChart
            ariaLabel={`Notes submitted and first decisions made per ${range.unit}`}
            labels={buckets}
            height={220}
            format={(v) => fmt(v)}
            series={[
              { label: "Submitted", color: RED, values: w.submitted },
              { label: "First decision", color: BLUE, values: w.decided },
            ]}
          />
          <DataTable columns={[cap(range.unit), "Submitted", "Decided"]} rows={buckets.map((b, i) => [b.tooltip, fmt(w.submitted[i]), fmt(w.decided[i])])} />
        </Card>
        <Card title="Final decisions" meta={`Per ${range.unit}`}>
          <Legend
            items={[
              { label: "Approved", color: STATUS.approved, value: fmt(decisions.approved.reduce((s, v) => s + v, 0)) },
              { label: "Fixed and approved", color: STATUS.changes, value: fmt(decisions.changes.reduce((s, v) => s + v, 0)) },
              { label: "Denied", color: STATUS.rejected, value: fmt(decisions.rejected.reduce((s, v) => s + v, 0)) },
            ]}
          />
          <ColumnChart
            ariaLabel="Final decisions over time, stacked by outcome"
            labels={buckets}
            height={220}
            unit="decisions"
            series={[
              { label: "Approved", color: STATUS.approved, values: decisions.approved },
              { label: "Fixed and approved", color: STATUS.changes, values: decisions.changes },
              { label: "Denied", color: STATUS.rejected, values: decisions.rejected },
            ]}
          />
          <DataTable
            columns={[cap(range.unit), "Approved", "Fixed", "Denied"]}
            rows={buckets.map((b, i) => [b.tooltip, fmt(decisions.approved[i]), fmt(decisions.changes[i]), fmt(decisions.rejected[i])])}
          />
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Approval rate"
          value={rates.approval === null ? "—" : `${rates.approval}%`}
          now={rates.approval}
          prev={rates.approvalPrev}
          mode="points"
          format={(v) => `${v}%`}
        />
        <Stat
          label="Sent back at final check"
          value={fmt(w.sentBack.count)}
          now={w.sentBack.count}
          prev={w.sentBack.prev}
          goodWhen="down"
          sub={w.sentBack.rate === null ? undefined : `${w.sentBack.rate}% of final checks`}
        />
        <Stat label="Student reports" value={fmt(w.reports.inRange)} now={w.reports.inRange} prev={w.reports.prev} goodWhen="down" />
        <Stat label="Decided within 24 hours" value={speed.within24 === null ? "—" : `${speed.within24}%`} sub={`of ${fmt(speed.count)} notes`} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card title="How long decisions take" meta={`${fmt(speed.count)} notes`}>
          <RankedBars rows={speed.bands} color={BLUE} total={speed.count} limit={5} />
        </Card>
        <Card title="Every note, by status" meta={`${fmt(status.total)} all time`}>
          <StatusList status={status} />
        </Card>
        <Card title="Why students report notes" meta={`Last ${range.label}`}>
          <RankedBars rows={w.reports.reasons} limit={5} emptyText="No reports in this period." />
        </Card>
      </div>
    </>
  );
}

function TimingStat({ label, hint, t }: { label: string; hint: string; t: Timing }) {
  return (
    <div className="rounded-lg border border-brand-border-light bg-white p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-brand-dark">{label}</p>
        <Delta current={t.median} previous={t.prev} goodWhen="down" />
      </div>
      <p className="text-xs text-brand-muted">{hint}</p>
      <p className="mt-3 text-3xl font-semibold tabular-nums text-brand-dark">{fmtDuration(t.median)}</p>
      <p className="mt-1 text-xs text-brand-muted">
        {t.count === 0 ? "None in this period" : `Median of ${fmt(t.count)}${t.prev === null ? "" : `, was ${fmtDuration(t.prev)}`}`}
      </p>
    </div>
  );
}

function StatusList({ status }: { status: FullAnalytics["status"] }) {
  const rows = [
    { label: "Published", value: status.approved, color: STATUS.approved },
    { label: "Waiting for a check", value: status.pending, color: STATUS.pending },
    { label: "Being fixed or in final check", value: status.changes, color: STATUS.changes },
    { label: "Reported", value: status.flagged, color: STATUS.flagged },
    { label: "Denied", value: status.rejected, color: STATUS.rejected },
  ];
  return (
    <>
      <StackedBar segments={rows} height="h-3" />
      <ul className="mt-4 space-y-2.5">
        {rows.map((s) => (
          <li key={s.label} className="flex items-center gap-2.5 text-sm">
            <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: s.color }} />
            <span className="flex-1 text-brand-body">{s.label}</span>
            <span className="font-semibold tabular-nums text-brand-dark">{fmt(s.value)}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

// ─── Library ─────────────────────────────────────────────────────────

function Library({ data }: { data: FullAnalytics }) {
  const { library: lib, workflow: w, buckets, range } = data;
  const [view, setView] = useState<"courses" | "subjects">("courses");
  const [query, setQuery] = useState("");
  const rows = (view === "courses" ? lib.courseRows : lib.subjectRows).filter((r) => r.label.toLowerCase().includes(query.trim().toLowerCase()));
  const langTotal = lib.english + lib.french;
  const max = Math.max(1, ...w.faculties.map((f) => f.published));

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Published notes" value={fmt(lib.published)} sub={`${fmt(lib.publishedInRange)} added in the last ${range.label}`} />
        <Stat label="Courses covered" value={fmt(lib.courses)} sub={`${fmt(lib.newCourses.length)} new in the last ${range.label}`} />
        <Stat label="Courses with only 1 note" value={fmt(lib.singleNoteCourses)} sub="Good targets for more notes" />
        <Stat label="Notes saved by students" value={fmt(w.saves.inRange)} now={w.saves.inRange} prev={w.saves.prev} sub={`${fmt(w.saves.total)} all time`} />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card title="Coverage by faculty" meta="Published notes">
          <ul className="space-y-3">
            {w.faculties.map((f) => (
              <li key={f.label} className="grid grid-cols-[8.5rem_minmax(0,1fr)_5.5rem] items-center gap-3 text-sm">
                <span className="truncate text-brand-body">{f.label}</span>
                <span className="h-2.5 rounded-r bg-brand-surface" title={`${f.label}: ${f.published} published, ${f.added} added in the last ${range.label}`}>
                  <span className="block h-full rounded-r" style={{ width: `${(f.published / max) * 100}%`, backgroundColor: RED }} />
                </span>
                <span className="text-right tabular-nums">
                  {f.published === 0 ? (
                    <span className="text-xs font-semibold text-rose-700">No notes yet</span>
                  ) : (
                    <>
                      <span className="font-semibold text-brand-dark">{fmt(f.published)}</span>
                      {f.added > 0 && <span className="ml-1.5 text-xs text-brand-muted">+{f.added}</span>}
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Most saved by students" meta="All time">
          {w.saves.top.length === 0 ? (
            <p className="text-sm text-brand-muted">No saved notes yet.</p>
          ) : (
            <ol className="-my-2.5 divide-y divide-brand-border-light">
              {w.saves.top.map((s) => (
                <li key={s.id} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="w-20 shrink-0 font-mono text-xs font-semibold text-brand-red">{s.course}</span>
                  <span className="min-w-0 flex-1 truncate font-medium text-brand-dark">{s.title}</span>
                  <span className="tabular-nums text-brand-muted">{s.value} {s.value === 1 ? "save" : "saves"}</span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card
          title="Notes per course"
          action={
            <Segmented
              label="Group by"
              options={[{ value: "courses" as const, label: "Courses" }, { value: "subjects" as const, label: "Subjects" }]}
              value={view}
              onChange={setView}
            />
          }
        >
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${view}`}
            aria-label={`Search ${view}`}
            className="mb-3 h-9 w-full rounded-md border border-brand-border-light bg-white px-3 text-sm text-brand-dark placeholder:text-brand-muted focus:border-brand-red focus:outline-none"
          />
          <RankedBars rows={rows} total={lib.published} limit={8} emptyText={query ? "No matches." : "No published notes yet."} />
        </Card>
        <div className="space-y-5">
          <Card title="Library size" meta="Published notes over time">
            <LineChart
              ariaLabel={`Total published notes over the last ${range.label}`}
              labels={buckets}
              height={150}
              format={(v) => fmt(v)}
              series={[{ label: "Published", color: RED, values: lib.cumulative, area: true }]}
            />
          </Card>
          <Card title="Language" meta={`${fmt(langTotal)} notes`}>
            <StackedBar segments={[{ label: "English", value: lib.english, color: RED }, { label: "French", value: lib.french, color: BLUE }]} />
            <div className="mt-3">
              <Legend
                items={[
                  { label: "English", color: RED, value: share(lib.english, langTotal) },
                  { label: "French", color: BLUE, value: share(lib.french, langTotal) },
                ]}
              />
            </div>
          </Card>
          <Card title="Note types" meta="Notes can have several">
            <RankedBars rows={lib.types} total={lib.published} limit={5} emptyText="No published notes yet." />
          </Card>
        </div>
      </div>
    </>
  );
}

// ─── Students ────────────────────────────────────────────────────────

function Students({ data }: { data: FullAnalytics }) {
  const { community: c, contributors, workflow: w, metrics, range } = data;
  const [board, setBoard] = useState<"range" | "all">("range");
  const [heat, setHeat] = useState<"submissions" | "signups">("submissions");
  const { fresh, returning } = w.contributors;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Students and staff" value={fmt(c.totalUsers)} sub={`${fmt(metrics.signups.total)} joined in the last ${range.label}`} />
        <Stat label="Active contributors" value={fmt(contributors.current)} now={contributors.current} prev={contributors.prev} />
        <Stat label="Volunteer hours awarded" value={fmt(metrics.hours.total, 1)} now={metrics.hours.total} prev={metrics.hours.prevTotal} format={(v) => fmt(v, 1)} />
        <Stat
          label="Signup to first note"
          value={c.medianDaysToFirst === null ? "—" : c.medianDaysToFirst < 1 ? "Under a day" : `${fmt(c.medianDaysToFirst)} days`}
          sub="Median, all time"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card title="From signup to published" meta="All time">
          <Funnel steps={c.activation} />
        </Card>
        <Card title="New or coming back?" meta={`Contributors, last ${range.label}`}>
          {fresh + returning === 0 ? (
            <p className="text-sm text-brand-muted">No submissions in this period.</p>
          ) : (
            <>
              <StackedBar height="h-4" segments={[{ label: "First time", value: fresh, color: RED }, { label: "Returning", value: returning, color: BLUE }]} />
              <div className="mt-4">
                <Legend
                  items={[
                    { label: "First time", color: RED, value: `${fresh} (${share(fresh, fresh + returning)})` },
                    { label: "Returning", color: BLUE, value: `${returning} (${share(returning, fresh + returning)})` },
                  ]}
                />
              </div>
            </>
          )}
          <dl className="mt-2 grid grid-cols-2 gap-4 border-t border-brand-border-light pt-4 text-sm">
            <div>
              <dt className="text-xs text-brand-muted">Ever submitted a note</dt>
              <dd className="mt-0.5 font-semibold text-brand-dark">{fmt(c.contributors)} people ({c.contributorRate}%)</dd>
            </div>
            <div>
              <dt className="text-xs text-brand-muted">Submitted 2 or more</dt>
              <dd className="mt-0.5 font-semibold text-brand-dark">{fmt(c.repeat)} people</dd>
            </div>
          </dl>
        </Card>
      </div>

      <Card
        title="Top contributors"
        action={
          <Segmented
            label="Period"
            options={[{ value: "range" as const, label: `Last ${range.label}` }, { value: "all" as const, label: "All time" }]}
            value={board}
            onChange={setBoard}
          />
        }
      >
        <Leaderboard leaders={board === "range" ? c.leadersRange : c.leadersAll} />
      </Card>

      <Card
        title="Busiest times"
        meta="All time, Ottawa time"
        action={
          <Segmented
            label="Activity"
            options={[{ value: "submissions" as const, label: "Submissions" }, { value: "signups" as const, label: "Signups" }]}
            value={heat}
            onChange={setHeat}
          />
        }
      >
        <Heatmap grid={heat === "submissions" ? c.heatSubmissions : c.heatSignups} unit={heat} />
      </Card>
    </>
  );
}

function Leaderboard({ leaders }: { leaders: Leader[] }) {
  if (leaders.length === 0) return <p className="text-sm text-brand-muted">No approved notes in this period.</p>;
  return (
    <ol className="grid grid-cols-1 gap-x-10 md:grid-cols-2">
      {leaders.map((l, i) => (
        <li key={`${l.name}-${i}`} className="flex items-center gap-3 border-b border-brand-border-light py-2.5 text-sm">
          <span className="w-5 text-right tabular-nums text-brand-muted">{i + 1}</span>
          <span className="min-w-0 flex-1 truncate font-medium text-brand-dark">{l.name}</span>
          <span className="tabular-nums text-brand-muted">{l.approved} {l.approved === 1 ? "note" : "notes"}</span>
          <span className="w-16 text-right font-semibold tabular-nums text-brand-dark">{fmt(l.hours, 1)} h</span>
        </li>
      ))}
    </ol>
  );
}

// ─── Team ────────────────────────────────────────────────────────────

type SortKey = "name" | "checks" | "fixes" | "finals" | "sentBack" | "total" | "lastActive";
const PEOPLE_COLUMNS: { key: SortKey; label: string; title: string }[] = [
  { key: "checks", label: "First checks", title: "Notes sent to final check" },
  { key: "fixes", label: "Fixes", title: "Corrected files submitted" },
  { key: "finals", label: "Final checks", title: "Approved, denied or sent back at final check" },
  { key: "sentBack", label: "Came back", title: "Notes they checked that were sent back" },
  { key: "total", label: "Total", title: "First checks, fixes and final checks" },
];

function Team({ data }: { data: FullAnalytics }) {
  const { workflow: w, range } = data;
  const { online, connected, selfId } = useAdminPresence();
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "total", dir: -1 });

  const rows = useMemo(() => {
    const val = (p: Person) =>
      sort.key === "name" ? p.name.toLowerCase() : sort.key === "lastActive" ? (p.lastActive ? new Date(p.lastActive).getTime() : 0) : p[sort.key];
    return [...w.people].sort((a, b) => (val(a) < val(b) ? -1 : val(a) > val(b) ? 1 : 0) * sort.dir);
  }, [w.people, sort]);

  const sum = (k: "checks" | "fixes" | "finals") => w.people.reduce((s, p) => s + p[k], 0);
  const active = w.people.filter((p) => p.total > 0).length;

  const header = (key: SortKey, label: string, title?: string, left = false) => (
    <th key={key} className={`px-4 py-2.5 font-medium ${left ? "text-left" : "text-right"}`} aria-sort={sort.key === key ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>
      <button
        type="button"
        title={title}
        onClick={() => setSort((s) => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : key === "name" ? 1 : -1 }))}
        className={`inline-flex items-center gap-1 whitespace-nowrap hover:text-brand-dark ${sort.key === key ? "text-brand-dark" : ""}`}
      >
        {label}
        {sort.key === key && (sort.dir === 1 ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
      </button>
    </th>
  );

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="People who reviewed" value={`${active} of ${w.people.length}`} sub={`In the last ${range.label}`} />
        <Stat label="First checks" value={fmt(sum("checks"))} sub="Notes sent to final check" />
        <Stat label="Fixes submitted" value={fmt(sum("fixes"))} sub="Corrected files uploaded" />
        <Stat label="Final checks" value={fmt(sum("finals"))} sub="Approved, denied or sent back" />
      </div>

      <OnlineNow online={online} connected={connected} selfId={selfId} team={w.people} />

      <Card title="Who did what" meta={`Last ${range.label}`} flush>
        {rows.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-brand-muted">No one on the review team yet.</p>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="border-b border-brand-border-light bg-brand-surface/60 text-xs text-brand-muted">
                  <tr>
                    {header("name", "Person", undefined, true)}
                    {PEOPLE_COLUMNS.map((c) => header(c.key, c.label, c.title))}
                    {header("lastActive", "Last active")}
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border-light">
                  {rows.map((p) => (
                    <tr key={p.id} className="hover:bg-brand-surface/50">
                      <td className="px-4 py-3">
                        <Link href={`/admin/analytics/${p.id}`} className="group flex items-center gap-3">
                          <Avatar name={p.name} presence={online.get(p.id)} />
                          <span className="min-w-0">
                            <span className="block truncate font-semibold text-brand-dark group-hover:text-brand-red">{p.name}</span>
                            <span className="block text-xs text-brand-muted">{p.role}</span>
                          </span>
                        </Link>
                      </td>
                      {PEOPLE_COLUMNS.map((c) => {
                        const v = p[c.key as "checks"];
                        return (
                          <td key={c.key} className={`px-4 py-3 text-right tabular-nums ${v === 0 ? "text-brand-muted" : c.key === "total" ? "font-semibold text-brand-dark" : "text-brand-body"}`}>
                            {v}
                          </td>
                        );
                      })}
                      <td className="whitespace-nowrap px-4 py-3 text-right text-xs text-brand-muted">
                        <PresenceText presence={online.get(p.id)} lastActive={p.lastActive} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="divide-y divide-brand-border-light md:hidden">
              {rows.map((p) => (
                <li key={p.id}>
                  <Link href={`/admin/analytics/${p.id}`} className="block px-4 py-4">
                    <span className="flex items-center gap-3">
                      <Avatar name={p.name} presence={online.get(p.id)} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-brand-dark">{p.name}</span>
                        <span className="block text-xs text-brand-muted">
                          {p.role}, <PresenceText presence={online.get(p.id)} lastActive={p.lastActive} prefix="active " />
                        </span>
                      </span>
                    </span>
                    <span className="mt-3 grid grid-cols-4 gap-2 text-center">
                      {PEOPLE_COLUMNS.filter((c) => c.key !== "total").map((c) => (
                        <span key={c.key}>
                          <span className="block text-sm font-semibold tabular-nums text-brand-dark">{p[c.key as "checks"]}</span>
                          <span className="block text-[11px] text-brand-muted">{c.label}</span>
                        </span>
                      ))}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
    </>
  );
}

// ─── Building blocks ─────────────────────────────────────────────────

function Card({ title, meta, action, flush, children }: { title: string; meta?: string; action?: ReactNode; flush?: boolean; children: ReactNode }) {
  return (
    <section className="min-w-0 overflow-hidden rounded-lg border border-brand-border-light bg-white">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-brand-border-light px-5 py-3.5">
        <h2 className="font-semibold text-brand-dark">
          {title}
          {meta && action && <span className="ml-2 text-xs font-normal text-brand-muted">{meta}</span>}
        </h2>
        {action ?? (meta && <span className="text-xs text-brand-muted">{meta}</span>)}
      </div>
      <div className={flush ? "" : "p-5"}>{children}</div>
    </section>
  );
}

function Stat({
  label,
  value,
  now,
  prev,
  sub,
  goodWhen,
  mode,
  format = (v: number) => fmt(v),
}: {
  label: string;
  value: string;
  now?: number | null;
  prev?: number | null;
  sub?: string;
  goodWhen?: "up" | "down";
  mode?: "percent" | "points";
  format?: (v: number) => string;
}) {
  const compared = now !== undefined && prev !== undefined;
  return (
    <div className="rounded-lg border border-brand-border-light bg-white p-4 sm:p-5">
      <p className="text-xs font-medium text-brand-muted sm:text-sm">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold tabular-nums text-brand-dark sm:text-3xl">{value}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-brand-muted">
        {compared && <Delta current={now} previous={prev} goodWhen={goodWhen} mode={mode} />}
        {sub ?? (compared && prev !== null ? `was ${format(prev)}` : null)}
      </div>
    </div>
  );
}

function Legend({ items }: { items: { label: string; color: string; value?: string }[] }) {
  return (
    <ul className="mb-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-brand-body">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: i.color }} />
          {i.label}
          {i.value !== undefined && <b className="font-semibold tabular-nums text-brand-dark">{i.value}</b>}
        </li>
      ))}
    </ul>
  );
}

// The same numbers as the chart above it, for anyone who'd rather read them
function DataTable({ columns, rows }: { columns: string[]; rows: string[][] }) {
  return (
    <details className="mt-3 text-sm">
      <summary className="cursor-pointer text-xs font-medium text-brand-muted hover:text-brand-red">Show as a table</summary>
      <div className="mt-2 max-h-64 overflow-auto rounded-md border border-brand-border-light">
        <table className="w-full tabular-nums">
          <thead className="sticky top-0 bg-brand-surface text-xs text-brand-muted">
            <tr>
              {columns.map((c, i) => (
                <th key={c} className={`px-3 py-2 font-medium ${i ? "text-right" : "text-left"}`}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border-light">
            {rows.map((r, i) => (
              <tr key={i}>
                {r.map((v, j) => (
                  <td key={j} className={`px-3 py-1.5 ${j ? "text-right text-brand-dark" : "text-brand-body"}`}>{v}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string; title?: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex max-w-full overflow-x-auto rounded-md border border-brand-border-light bg-white p-0.5 [scrollbar-width:none]">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          title={o.title}
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
          className={`h-8 whitespace-nowrap rounded px-3 text-xs font-semibold transition-colors ${
            o.value === value ? "bg-brand-red text-white" : "text-brand-body hover:text-brand-red"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const share = (part: number, total: number) => `${total ? Math.round((part / total) * 100) : 0}%`;

/** "3 hours", "4 days", "2 weeks": how a person would say it. */
function humanWait(hours: number) {
  if (hours < 1) return "under an hour";
  if (hours < 24) return `${Math.round(hours)} ${Math.round(hours) === 1 ? "hour" : "hours"}`;
  const days = Math.round(hours / 24);
  if (days < 14) return `${days} ${days === 1 ? "day" : "days"}`;
  if (days < 60) return `${Math.round(days / 7)} weeks`;
  return `${Math.round(days / 30)} months`;
}
