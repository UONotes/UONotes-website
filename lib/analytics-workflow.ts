// Pure: the review-pipeline, demand and coverage numbers behind the
// analytics page. Unlike computeAnalytics (final decisions only), this
// also reads the steps in between: first checks, fixes and send-backs.
import { RANGES, bucketSeries, percentile, type RangeKey } from "@/lib/analytics";
import type { AuditRow, NoteRow, ProfileRow, Row } from "@/lib/analytics-data";
import { FACULTY_PREFIXES, facultyOf } from "@/lib/faculties";
import { roleOf, ROLE_LABEL } from "@/lib/admin";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export const WORKFLOW_ACTIONS = [
  "NOTE_SENT_TO_FINAL_CHECK",
  "NOTE_FIXES_STARTED",
  "NOTE_FIXES_TAKEN_OVER",
  "NOTE_FIXES_CANCELLED",
  "NOTE_FIX_SUBMITTED",
  "NOTE_FIX_SENT_BACK",
  "NOTE_SENT_BACK_TO_PENDING",
] as const;

// checked_by: who sent the note to final check (logged on final decisions)
export type WorkRow = AuditRow & { checked_by?: string | null };
export type SaveRow = { note_id: string; created_at: string };
export type ReportRow = { reason: string | null; created_at: string };
export type WorkProfile = ProfileRow & { is_vp_notes?: boolean | null; is_super_admin?: boolean | null };

export type StageKey = "pending" | "flagged" | "in_revision" | "fix_review";
export type Stage = { key: StageKey; label: string; count: number; oldestHours: number | null; overdue: number; limitHours: number };
export type Timing = { median: number | null; prev: number | null; count: number };
export type Person = {
  id: string;
  name: string;
  email: string;
  role: string;
  lastActive: string | null;
  checks: number;
  fixes: number;
  finals: number;
  sentBack: number;
  total: number;
};

export type WorkflowData = {
  stages: Stage[];
  firstCheck: Timing;
  finalCheck: Timing;
  submitted: number[];
  decided: number[];
  sentBack: { count: number; prev: number; rate: number | null };
  people: Person[];
  faculties: { label: string; published: number; added: number }[];
  contributors: { fresh: number; returning: number };
  saves: { total: number; inRange: number; prev: number; top: { id: string; title: string; course: string; value: number }[] };
  reports: { inRange: number; prev: number; reasons: Row[] };
};

const FINAL = new Set(["NOTE_APPROVED", "NOTE_APPROVED_WITH_FIXES", "NOTE_REJECTED"]);
const TO_FINAL_CHECK = new Set(["NOTE_SENT_TO_FINAL_CHECK", "NOTE_FIX_SUBMITTED"]);
const FIRST_CHECK = new Set([...TO_FINAL_CHECK, "NOTE_FIXES_STARTED"]);
const SENT_BACK = new Set(["NOTE_SENT_BACK_TO_PENDING", "NOTE_FIX_SENT_BACK"]);
const FIX_STARTED = new Set(["NOTE_FIXES_STARTED", "NOTE_FIXES_TAKEN_OVER"]);

// How long a note can sit in a stage before it counts as late
const STAGES: { key: StageKey; label: string; limitHours: number }[] = [
  { key: "pending", label: "Waiting for a check", limitHours: 48 },
  { key: "flagged", label: "Reported", limitHours: 48 },
  { key: "in_revision", label: "Being fixed", limitHours: 72 },
  { key: "fix_review", label: "Final check", limitHours: 48 },
];

export function computeWorkflow(
  input: { notes: NoteRow[]; profiles: WorkProfile[]; audit: WorkRow[]; saves: SaveRow[]; reports: ReportRow[] },
  rangeKey: RangeKey,
  now: Date = new Date()
): WorkflowData {
  const cfg = RANGES[rangeKey];
  const nowMs = now.getTime();
  const start = nowMs - cfg.days * DAY_MS;
  const prevStart = start - cfg.days * DAY_MS;
  const t = (iso: string) => new Date(iso).getTime();
  const inRange = (iso: string) => t(iso) >= start && t(iso) <= nowMs;
  const inPrev = (iso: string) => t(iso) >= prevStart && t(iso) < start;
  const series = (dates: string[]) =>
    bucketSeries(dates.filter(inRange).map((at) => ({ at })), cfg.days, cfg.bucketDays, now).map((b) => b.value);

  const audit = input.audit.filter((r) => r.action_type.startsWith("NOTE_")).sort((a, b) => t(a.created_at) - t(b.created_at));
  const noteById = new Map(input.notes.map((n) => [n.id, n]));
  const eventsByNote = new Map<string, WorkRow[]>();
  for (const r of audit) {
    if (r.target_type !== "note" || !r.target_id) continue;
    const list = eventsByNote.get(r.target_id);
    if (list) list.push(r);
    else eventsByNote.set(r.target_id, [r]);
  }

  // ── Where open notes are, and since when ──
  // Reports aren't in the audit log, so a reported note has no known start.
  const enteredStage = (n: NoteRow): string | null => {
    if (n.status === "flagged") return null;
    const match = n.status === "pending" ? SENT_BACK : n.status === "in_revision" ? FIX_STARTED : TO_FINAL_CHECK;
    const last = (eventsByNote.get(n.id) ?? []).filter((r) => match.has(r.action_type)).pop();
    return last?.created_at ?? (n.status === "pending" ? n.created_at : null);
  };
  const stages: Stage[] = STAGES.map((s) => {
    const here = input.notes.filter((n) => n.status === s.key);
    const waits = here
      .map(enteredStage)
      .filter((iso): iso is string => !!iso)
      .map((iso) => (nowMs - t(iso)) / HOUR_MS);
    return {
      ...s,
      count: here.length,
      oldestHours: waits.length ? Math.max(...waits) : null,
      overdue: waits.filter((h) => h > s.limitHours).length,
    };
  });

  // ── How long each stage takes ──
  const first = { now: [] as number[], prev: [] as number[] };
  const final = { now: [] as number[], prev: [] as number[] };
  const record = (into: typeof first, at: string, from: string) => {
    const hours = (t(at) - t(from)) / HOUR_MS;
    if (hours < 0) return;
    if (inRange(at)) into.now.push(hours);
    else if (inPrev(at)) into.prev.push(hours);
  };
  const firstDecided: string[] = [];
  for (const [id, events] of eventsByNote) {
    const note = noteById.get(id);
    const decidedAt = events.find((r) => FINAL.has(r.action_type))?.created_at;
    if (note && decidedAt) firstDecided.push(decidedAt);
    const check = events.find((r) => FIRST_CHECK.has(r.action_type));
    // A check that comes after a decision is about a report, not the original submission
    if (note && check && (!decidedAt || t(check.created_at) <= t(decidedAt))) record(first, check.created_at, note.created_at);
    let waitingSince: string | null = null;
    for (const r of events) {
      if (TO_FINAL_CHECK.has(r.action_type)) waitingSince = r.created_at;
      else if (FINAL.has(r.action_type) || SENT_BACK.has(r.action_type)) {
        if (waitingSince) record(final, r.created_at, waitingSince);
        waitingSince = null;
      }
    }
  }
  const timing = (v: typeof first): Timing => ({ median: percentile(v.now, 50), prev: percentile(v.prev, 50), count: v.now.length });

  // ── Send-backs ──
  const countIn = (set: Set<string>, pred: (iso: string) => boolean) =>
    audit.filter((r) => set.has(r.action_type) && pred(r.created_at)).length;
  const backNow = countIn(SENT_BACK, inRange);
  const outcomes = backNow + countIn(FINAL, inRange);

  // ── People ──
  const recent = audit.filter((r) => inRange(r.created_at));
  const people: Person[] = input.profiles
    .filter((p) => p.is_admin || p.is_vp_notes || p.is_super_admin)
    .map((p) => {
      const mine = recent.filter((r) => r.admin_id === p.id);
      const n = (set: Set<string>) => mine.filter((r) => set.has(r.action_type)).length;
      const checks = mine.filter((r) => r.action_type === "NOTE_SENT_TO_FINAL_CHECK").length;
      const fixes = mine.filter((r) => r.action_type === "NOTE_FIX_SUBMITTED").length;
      const finals = n(FINAL) + n(SENT_BACK);
      return {
        id: p.id,
        name: p.full_name || p.email?.split("@")[0] || "Unknown",
        email: p.email || "",
        role: ROLE_LABEL[roleOf(p)],
        lastActive: p.last_admin_active_at,
        checks,
        fixes,
        finals,
        sentBack: recent.filter((r) => SENT_BACK.has(r.action_type) && r.checked_by === p.id).length,
        total: checks + fixes + finals,
      };
    });

  // ── Coverage ──
  const approved = input.notes.filter((n) => n.status === "approved");
  const faculties = Object.keys(FACULTY_PREFIXES).map((label) => {
    const mine = approved.filter((n) => facultyOf(n.course_code) === label);
    return { label, published: mine.length, added: mine.filter((n) => n.reviewed_at && inRange(n.reviewed_at)).length };
  });

  // ── New vs returning contributors ──
  const earliest = new Map<string, number>();
  const active = new Set<string>();
  for (const n of input.notes) {
    const key = n.uploader_id || n.author_name;
    if (!key) continue;
    earliest.set(key, Math.min(earliest.get(key) ?? Infinity, t(n.created_at)));
    if (inRange(n.created_at)) active.add(key);
  }
  const fresh = [...active].filter((k) => (earliest.get(k) as number) >= start).length;

  // ── Saves and reports ──
  const saveCounts = new Map<string, number>();
  for (const s of input.saves) saveCounts.set(s.note_id, (saveCounts.get(s.note_id) ?? 0) + 1);
  const top = [...saveCounts.entries()]
    .filter(([id]) => noteById.get(id)?.status === "approved")
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([id, value]) => {
      const n = noteById.get(id) as NoteRow;
      return { id, title: n.title || "Untitled", course: n.course_code ?? "", value };
    });
  // Group "Reason: details" under the reason
  const reasons = new Map<string, number>();
  for (const r of input.reports.filter((x) => inRange(x.created_at))) {
    const label = r.reason?.split(/[:\n]/)[0].trim().slice(0, 60) || "No reason given";
    reasons.set(label, (reasons.get(label) ?? 0) + 1);
  }

  return {
    stages,
    firstCheck: timing(first),
    finalCheck: timing(final),
    submitted: series(input.notes.map((n) => n.created_at)),
    decided: series(firstDecided),
    sentBack: { count: backNow, prev: countIn(SENT_BACK, inPrev), rate: outcomes ? Math.round((backNow / outcomes) * 100) : null },
    people,
    faculties,
    contributors: { fresh, returning: active.size - fresh },
    saves: {
      total: input.saves.length,
      inRange: input.saves.filter((s) => inRange(s.created_at)).length,
      prev: input.saves.filter((s) => inPrev(s.created_at)).length,
      top,
    },
    reports: {
      inRange: input.reports.filter((r) => inRange(r.created_at)).length,
      prev: input.reports.filter((r) => inPrev(r.created_at)).length,
      reasons: [...reasons.entries()].sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value })),
    },
  };
}
