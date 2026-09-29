import {
  RANGES,
  bucketSeries,
  easternDayHour,
  percentile,
  subjectOf,
  type RangeKey,
} from "@/lib/analytics";
import { easternDateKey } from "@/lib/dateFormat";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export type NoteRow = {
  id: string;
  course_code: string | null;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  hours_awarded: number | null;
  uploader_id: string | null;
  author_name: string | null;
  language: string | null;
  note_types: string[] | null;
};

export type ProfileRow = {
  id: string;
  created_at: string;
  full_name: string | null;
  email: string | null;
  is_admin: boolean | null;
  status: string | null;
  last_admin_active_at: string | null;
};

export type AuditRow = {
  admin_id: string | null;
  action_type: string;
  target_type: string | null;
  target_id: string | null;
  created_at: string;
};

export type MetricKey = "submissions" | "signups" | "approvals" | "hours";

export type Metric = {
  label: string;
  unit: string;
  total: number;
  prevTotal: number;
  current: number[];
  previous: number[];
};

export type Row = { label: string; value: number };
export type Leader = { name: string; approved: number; hours: number };

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  lastActive: string | null;
  approved: number;
  changes: number;
  rejected: number;
  inRange: number;
  approvalRate: number | null;
  share: number | null;
  medianHours: number | null;
};

export type AnalyticsData = {
  range: { key: RangeKey; label: string; prevLabel: string; unit: "day" | "week" | "month"; days: number };
  generatedAt: string;
  buckets: { key: string; label: string; tooltip: string }[];
  metrics: Record<MetricKey, Metric>;
  contributors: { current: number; prev: number; series: number[] };
  attention: { pending: number; flagged: number; awaitingFixes: number; oldestHours: number | null; over48h: number };
  activity: { best: { label: string; value: number } | null; streak: number; activeDays: number; totalDays: number };
  status: { approved: number; pending: number; changes: number; flagged: number; rejected: number; total: number };
  funnel: Row[];
  rates: { approval: number | null; approvalPrev: number | null; flag: number; resub: number | null; resubApproved: number; resubTotal: number };
  speed: {
    median: number | null;
    medianPrev: number | null;
    p90: number | null;
    within24: number | null;
    count: number;
    series: (number | null)[];
    bands: Row[];
  };
  queueAging: Row[];
  decisions: { approved: number[]; changes: number[]; rejected: number[] };
  library: {
    published: number;
    publishedInRange: number;
    courses: number;
    subjects: number;
    avgHours: number;
    courseRows: Row[];
    subjectRows: Row[];
    english: number;
    french: number;
    types: Row[];
    newCourses: string[];
    singleNoteCourses: number;
    cumulative: number[];
  };
  community: {
    totalUsers: number;
    banned: number;
    admins: number;
    contributors: number;
    contributorRate: number;
    repeat: number;
    firstTimeInRange: number;
    medianDaysToFirst: number | null;
    activation: Row[];
    leadersAll: Leader[];
    leadersRange: Leader[];
    heatSubmissions: number[][];
    heatSignups: number[][];
  };
  team: { rows: TeamMember[]; activeReviewers: number; totalAdmins: number; decisionsInRange: number; decisionsPrev: number };
};

const ratio = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : null);
const sortRows = (m: Map<string, number>): Row[] =>
  [...m.entries()].sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }));
const bump = (m: Map<string, number>, k: string, by = 1) => m.set(k, (m.get(k) || 0) + by);

/** Pure: turns raw rows into everything the dashboard shows. */
export function computeAnalytics(
  { notes, profiles, audit }: { notes: NoteRow[]; profiles: ProfileRow[]; audit: AuditRow[] },
  rangeKey: RangeKey,
  now: Date = new Date()
): AnalyticsData {
  const cfg = RANGES[rangeKey];
  const nowMs = now.getTime();
  const start = nowMs - cfg.days * DAY_MS;
  const prevStart = start - cfg.days * DAY_MS;
  const prevNow = new Date(start);
  const t = (iso: string) => new Date(iso).getTime();
  const inRange = (iso: string | null) => !!iso && t(iso) >= start && t(iso) <= nowMs;
  const inPrev = (iso: string | null) => !!iso && t(iso) >= prevStart && t(iso) < start;

  const series = (rows: { at: string; value?: number }[], prev = false) =>
    bucketSeries(rows.filter((r) => (prev ? inPrev(r.at) : inRange(r.at))), cfg.days, cfg.bucketDays, prev ? prevNow : now).map((b) => b.value);
  const bucketMeta = bucketSeries([], cfg.days, cfg.bucketDays, now).map(({ key, label, tooltip }) => ({ key, label, tooltip }));
  const bucketIndex = (iso: string) => {
    const offset = t(iso) - (nowMs - bucketMeta.length * cfg.bucketDays * DAY_MS);
    if (cfg.bucketDays === 1) return bucketMeta.findIndex((b) => b.key === easternDateKey(new Date(iso)));
    return Math.floor(offset / (cfg.bucketDays * DAY_MS));
  };

  const sortedNotes = [...notes].sort((a, b) => t(a.created_at) - t(b.created_at));
  const noteById = new Map(sortedNotes.map((n) => [n.id, n]));
  const profileById = new Map(profiles.map((p) => [p.id, p]));
  const nameOf = (p?: ProfileRow) => p?.full_name || p?.email?.split("@")[0] || "Unknown";
  const contributorKey = (n: NoteRow) => n.uploader_id || n.author_name || null;
  const noteDecisions = audit.filter((r) => r.action_type.startsWith("NOTE_"));

  // ── Metrics ──
  const approvalsRows = noteDecisions.filter((r) => r.action_type === "NOTE_APPROVED").map((r) => ({ at: r.created_at }));
  const approvedNotes = sortedNotes.filter((n) => n.status === "approved");
  const hoursRows = approvedNotes.filter((n) => n.reviewed_at).map((n) => ({ at: n.reviewed_at as string, value: n.hours_awarded || 0 }));
  const metric = (label: string, unit: string, rows: { at: string; value?: number }[]): Metric => {
    const current = series(rows);
    const previous = series(rows, true);
    return { label, unit, current, previous, total: current.reduce((s, v) => s + v, 0), prevTotal: previous.reduce((s, v) => s + v, 0) };
  };
  const metrics: Record<MetricKey, Metric> = {
    submissions: metric("Submissions", "submissions", sortedNotes.map((n) => ({ at: n.created_at }))),
    signups: metric("Signups", "signups", profiles.map((p) => ({ at: p.created_at }))),
    approvals: metric("Approvals", "approvals", approvalsRows),
    hours: metric("Hours awarded", "hours", hoursRows),
  };

  // Contributors active in range, and first-ever submissions (new faces) over time
  const firstNoteBy = new Map<string, NoteRow>();
  for (const n of sortedNotes) {
    const k = contributorKey(n);
    if (k && !firstNoteBy.has(k)) firstNoteBy.set(k, n);
  }
  const activeSet = (pred: (iso: string) => boolean) =>
    new Set(sortedNotes.filter((n) => pred(n.created_at)).map(contributorKey).filter(Boolean)).size;
  const firstTimers = [...firstNoteBy.values()].map((n) => ({ at: n.created_at }));
  // Distinct contributors per bucket
  const activeByBucket = bucketMeta.map(() => new Set<string>());
  for (const n of sortedNotes) {
    const k = contributorKey(n);
    if (!k || !inRange(n.created_at)) continue;
    const idx = bucketIndex(n.created_at);
    if (idx >= 0 && idx < activeByBucket.length) activeByBucket[idx].add(k);
  }

  // ── Attention ──
  const pending = sortedNotes.filter((n) => n.status === "pending");
  const ageH = (n: NoteRow) => (nowMs - t(n.created_at)) / HOUR_MS;
  const attention = {
    pending: pending.length,
    flagged: sortedNotes.filter((n) => n.status === "flagged").length,
    awaitingFixes: sortedNotes.filter((n) => n.status === "changes_requested").length,
    oldestHours: pending[0] ? ageH(pending[0]) : null,
    over48h: pending.filter((n) => ageH(n) > 48).length,
  };
  const queueAging: Row[] = [
    { label: "Under a day", value: pending.filter((n) => ageH(n) < 24).length },
    { label: "1–2 days", value: pending.filter((n) => ageH(n) >= 24 && ageH(n) < 48).length },
    { label: "2–7 days", value: pending.filter((n) => ageH(n) >= 48 && ageH(n) < 168).length },
    { label: "Over a week", value: pending.filter((n) => ageH(n) >= 168).length },
  ];

  // ── Activity rhythm ──
  const subSeries = metrics.submissions.current;
  const bestIdx = subSeries.indexOf(Math.max(...subSeries));
  const dayKeys = new Set(sortedNotes.map((n) => easternDateKey(new Date(n.created_at))));
  let streak = 0;
  for (let i = dayKeys.has(easternDateKey(now)) ? 0 : 1; ; i++) {
    if (!dayKeys.has(easternDateKey(new Date(nowMs - i * DAY_MS)))) break;
    streak++;
  }
  const activeDays = new Set(sortedNotes.filter((n) => inRange(n.created_at)).map((n) => easternDateKey(new Date(n.created_at)))).size;

  // ── Status & funnel ──
  const count = (s: string) => sortedNotes.filter((n) => n.status === s).length;
  const status = {
    approved: approvedNotes.length,
    pending: pending.length,
    changes: count("changes_requested"),
    flagged: attention.flagged,
    rejected: count("rejected"),
    total: sortedNotes.length,
  };

  // First decision per note → review speed, funnel "reviewed", per-admin speed
  const firstDecision = new Map<string, { at: string; admin: string | null }>();
  const sentBack = new Set<string>();
  for (const r of [...noteDecisions].sort((a, b) => t(a.created_at) - t(b.created_at))) {
    if (r.target_type !== "note" || !r.target_id) continue;
    if (!firstDecision.has(r.target_id)) firstDecision.set(r.target_id, { at: r.created_at, admin: r.admin_id });
    if (r.action_type === "NOTE_CHANGES_REQUESTED") sentBack.add(r.target_id);
  }
  const reviewed = sortedNotes.filter((n) => n.status !== "pending" || firstDecision.has(n.id)).length;
  const funnel: Row[] = [
    { label: "Submitted", value: sortedNotes.length },
    { label: "Reviewed", value: reviewed },
    { label: "Approved", value: status.approved + status.flagged },
    { label: "Still live", value: status.approved },
  ];

  const decisionsIn = (pred: (iso: string) => boolean, type: string) => noteDecisions.filter((r) => r.action_type === type && pred(r.created_at)).length;
  const approvalRateFor = (pred: (iso: string) => boolean) => {
    const a = decisionsIn(pred, "NOTE_APPROVED");
    return ratio(a, a + decisionsIn(pred, "NOTE_REJECTED"));
  };
  let resubApproved = 0;
  for (const id of sentBack) if (noteById.get(id)?.status === "approved") resubApproved++;

  // ── Review speed ──
  const speedNow: number[] = [];
  const speedPrev: number[] = [];
  const speedByBucket: number[][] = bucketMeta.map(() => []);
  const speedByAdmin = new Map<string, number[]>();
  for (const [id, d] of firstDecision) {
    const note = noteById.get(id);
    if (!note) continue;
    const h = (t(d.at) - t(note.created_at)) / HOUR_MS;
    if (h < 0) continue;
    if (d.admin) speedByAdmin.set(d.admin, [...(speedByAdmin.get(d.admin) || []), h]);
    if (inRange(d.at)) {
      speedNow.push(h);
      const idx = bucketIndex(d.at);
      if (idx >= 0 && idx < speedByBucket.length) speedByBucket[idx].push(h);
    } else if (inPrev(d.at)) speedPrev.push(h);
  }
  const bands = [
    ["Under 1 hour", 0, 1],
    ["1–6 hours", 1, 6],
    ["6–24 hours", 6, 24],
    ["1–3 days", 24, 72],
    ["Over 3 days", 72, Infinity],
  ] as const;

  // ── Decisions over time ──
  const decisionSeries = (type: string) => series(noteDecisions.filter((r) => r.action_type === type).map((r) => ({ at: r.created_at })));

  // ── Library ──
  const courseCounts = new Map<string, number>();
  const subjectCounts = new Map<string, number>();
  const typeCounts = new Map<string, number>();
  const courseFirstPublished = new Map<string, string>();
  let english = 0;
  let french = 0;
  for (const n of approvedNotes) {
    const course = n.course_code?.trim().toUpperCase().replace(/\s+/g, "");
    if (course) {
      bump(courseCounts, course);
      const at = n.reviewed_at || n.created_at;
      const seen = courseFirstPublished.get(course);
      if (!seen || t(at) < t(seen)) courseFirstPublished.set(course, at);
    }
    bump(subjectCounts, subjectOf(n.course_code));
    for (const ty of n.note_types || []) bump(typeCounts, ty);
    if ((n.language || "EN").toUpperCase() === "FR") french++;
    else english++;
  }
  const lifetimeHours = approvedNotes.reduce((s, n) => s + (n.hours_awarded || 0), 0);
  const publishedBefore = approvedNotes.filter((n) => n.reviewed_at && t(n.reviewed_at) < start).length;
  const publishedSeries = series(approvedNotes.filter((n) => n.reviewed_at).map((n) => ({ at: n.reviewed_at as string })));
  let running = publishedBefore;
  const cumulative = publishedSeries.map((v) => (running += v));

  // ── Community ──
  const contributorStats = new Map<string, Leader & { submitted: number }>();
  const rangeLeaders = new Map<string, Leader>();
  for (const n of sortedNotes) {
    const k = contributorKey(n);
    if (!k) continue;
    const name = n.uploader_id ? nameOf(profileById.get(n.uploader_id)) : n.author_name || "Unknown";
    const e = contributorStats.get(k) || { name, submitted: 0, approved: 0, hours: 0 };
    e.submitted++;
    if (n.status === "approved") {
      e.approved++;
      e.hours += n.hours_awarded || 0;
      if (inRange(n.reviewed_at)) {
        const r = rangeLeaders.get(k) || { name, approved: 0, hours: 0 };
        r.approved++;
        r.hours += n.hours_awarded || 0;
        rangeLeaders.set(k, r);
      }
    }
    contributorStats.set(k, e);
  }
  const contributors = [...contributorStats.values()];
  const leaderSort = (a: Leader, b: Leader) => b.hours - a.hours || b.approved - a.approved;

  const uploaderIds = new Set(sortedNotes.map((n) => n.uploader_id).filter(Boolean) as string[]);
  const approvedUploaders = new Set(approvedNotes.map((n) => n.uploader_id).filter(Boolean) as string[]);
  const daysToFirst: number[] = [];
  for (const id of uploaderIds) {
    const p = profileById.get(id);
    const first = firstNoteBy.get(id);
    if (p && first) {
      const d = (t(first.created_at) - t(p.created_at)) / DAY_MS;
      if (d >= 0) daysToFirst.push(d);
    }
  }

  const heat = (dates: string[]) => {
    const grid = Array.from({ length: 7 }, () => Array(8).fill(0) as number[]);
    for (const iso of dates) {
      const { day, hour } = easternDayHour(iso);
      grid[day][Math.floor(hour / 3)]++;
    }
    return grid;
  };

  // ── Team ──
  const adminProfiles = profiles.filter((p) => p.is_admin);
  const inRangeDecisions = noteDecisions.filter((r) => inRange(r.created_at));
  const rows: TeamMember[] = adminProfiles.map((p) => {
    const mine = noteDecisions.filter((r) => r.admin_id === p.id);
    const approved = mine.filter((r) => r.action_type === "NOTE_APPROVED").length;
    const rejected = mine.filter((r) => r.action_type === "NOTE_REJECTED").length;
    const inRangeCount = inRangeDecisions.filter((r) => r.admin_id === p.id).length;
    return {
      id: p.id,
      name: nameOf(p),
      email: p.email || "",
      lastActive: p.last_admin_active_at,
      approved,
      rejected,
      changes: mine.filter((r) => r.action_type === "NOTE_CHANGES_REQUESTED").length,
      inRange: inRangeCount,
      approvalRate: ratio(approved, approved + rejected),
      share: ratio(inRangeCount, inRangeDecisions.length),
      medianHours: percentile(speedByAdmin.get(p.id) || [], 50),
    };
  });

  return {
    range: {
      key: rangeKey,
      label: cfg.label,
      prevLabel: cfg.prevLabel,
      unit: cfg.bucketDays === 1 ? "day" : cfg.bucketDays === 7 ? "week" : "month",
      days: cfg.days,
    },
    generatedAt: now.toISOString(),
    buckets: bucketMeta,
    metrics,
    contributors: { current: activeSet(inRange), prev: activeSet(inPrev), series: activeByBucket.map((set) => set.size) },
    attention,
    activity: {
      best: subSeries.some((v) => v > 0) ? { label: bucketMeta[bestIdx].tooltip, value: subSeries[bestIdx] } : null,
      streak,
      activeDays,
      totalDays: cfg.days,
    },
    status,
    funnel,
    rates: {
      approval: approvalRateFor(inRange),
      approvalPrev: approvalRateFor(inPrev),
      flag: ratio(status.flagged, status.approved + status.flagged) ?? 0,
      resub: ratio(resubApproved, sentBack.size),
      resubApproved,
      resubTotal: sentBack.size,
    },
    speed: {
      median: percentile(speedNow, 50),
      medianPrev: percentile(speedPrev, 50),
      p90: percentile(speedNow, 90),
      within24: ratio(speedNow.filter((h) => h <= 24).length, speedNow.length),
      count: speedNow.length,
      series: speedByBucket.map((hs) => percentile(hs, 50)),
      bands: bands.map(([label, lo, hi]) => ({ label, value: speedNow.filter((h) => h >= lo && h < hi).length })),
    },
    queueAging,
    decisions: {
      approved: decisionSeries("NOTE_APPROVED"),
      changes: decisionSeries("NOTE_CHANGES_REQUESTED"),
      rejected: decisionSeries("NOTE_REJECTED"),
    },
    library: {
      published: approvedNotes.length,
      publishedInRange: approvedNotes.filter((n) => inRange(n.reviewed_at)).length,
      courses: courseCounts.size,
      subjects: subjectCounts.size,
      avgHours: approvedNotes.length ? lifetimeHours / approvedNotes.length : 0,
      courseRows: sortRows(courseCounts),
      subjectRows: sortRows(subjectCounts),
      english,
      french,
      types: sortRows(typeCounts),
      newCourses: [...courseFirstPublished.entries()].filter(([, at]) => inRange(at)).map(([c]) => c).sort(),
      singleNoteCourses: [...courseCounts.values()].filter((v) => v === 1).length,
      cumulative,
    },
    community: {
      totalUsers: profiles.length,
      banned: profiles.filter((p) => p.status === "BANNED").length,
      admins: adminProfiles.length,
      contributors: contributors.length,
      contributorRate: ratio(contributors.length, profiles.length) ?? 0,
      repeat: contributors.filter((c) => c.submitted >= 2).length,
      firstTimeInRange: firstTimers.filter((f) => inRange(f.at)).length,
      medianDaysToFirst: percentile(daysToFirst, 50),
      activation: [
        { label: "Signed up", value: profiles.length },
        { label: "Submitted a note", value: [...uploaderIds].filter((id) => profileById.has(id)).length },
        { label: "Got one approved", value: [...approvedUploaders].filter((id) => profileById.has(id)).length },
      ],
      leadersAll: contributors.filter((c) => c.approved > 0).sort(leaderSort).slice(0, 8).map(({ name, approved, hours }) => ({ name, approved, hours })),
      leadersRange: [...rangeLeaders.values()].sort(leaderSort).slice(0, 8),
      heatSubmissions: heat(sortedNotes.map((n) => n.created_at)),
      heatSignups: heat(profiles.map((p) => p.created_at)),
    },
    team: {
      rows,
      activeReviewers: rows.filter((r) => r.inRange > 0).length,
      totalAdmins: rows.length,
      decisionsInRange: inRangeDecisions.length,
      decisionsPrev: noteDecisions.filter((r) => inPrev(r.created_at)).length,
    },
  };
}
