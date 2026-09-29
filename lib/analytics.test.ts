import { describe, expect, it } from "vitest";
import { bucketSeries, easternDayHour, parseRange, percentile, subjectOf } from "./analytics";
import { computeAnalytics, type AuditRow, type NoteRow, type ProfileRow } from "./analytics-data";

// Tue Sep 29 2026, noon Eastern
const NOW = new Date("2026-09-29T16:00:00Z");

describe("helpers", () => {
  it("parseRange falls back to 30 days", () => {
    expect(parseRange(undefined)).toBe("30d");
    expect(parseRange("nonsense")).toBe("30d");
    expect(parseRange("1y")).toBe("1y");
  });

  it("percentile interpolates and handles empty input", () => {
    expect(percentile([], 50)).toBeNull();
    expect(percentile([5], 90)).toBe(5);
    expect(percentile([1, 2, 3, 4], 50)).toBe(2.5);
    expect(percentile([4, 1, 3, 2], 50)).toBe(2.5); // order doesn't matter
  });

  it("subjectOf reads the letter prefix", () => {
    expect(subjectOf("BIO1130")).toBe("BIO");
    expect(subjectOf(" csi 2110")).toBe("CSI");
    expect(subjectOf("1234")).toBe("Other");
    expect(subjectOf(null)).toBe("Other");
  });

  it("easternDayHour uses Toronto time, Monday = 0", () => {
    // 02:30 UTC Tue = 22:30 Mon in Toronto (EDT)
    expect(easternDayHour("2026-09-29T02:30:00Z")).toEqual({ day: 0, hour: 22 });
  });

  it("daily buckets align to Eastern calendar days", () => {
    const b = bucketSeries([{ at: "2026-09-28T03:00:00Z" }, { at: "2026-09-29T15:00:00Z" }], 7, 1, NOW);
    expect(b).toHaveLength(7);
    // 03:00 UTC Sep 28 is still Sep 27 in Toronto
    expect(b.find((x) => x.label === "Sep 27")?.value).toBe(1);
    expect(b.find((x) => x.label === "Sep 28")?.value).toBe(0);
    expect(b.at(-1)).toMatchObject({ label: "Sep 29", value: 1 });
  });

  it("wide buckets sum values and drop rows outside the window", () => {
    const rows = [
      { at: "2026-09-20T12:00:00Z", value: 2 },
      { at: "2026-09-21T12:00:00Z", value: 3 },
      { at: "2025-01-01T00:00:00Z", value: 100 },
    ];
    const b = bucketSeries(rows, 90, 7, NOW);
    expect(b).toHaveLength(13);
    expect(b.reduce((s, x) => s + x.value, 0)).toBe(5);
    expect(b[0].tooltip).toMatch(/^Week of /);
  });
});

// ── A small, hand-checked dataset ──────────────────────────────────
const profile = (id: string, created_at: string, extra: Partial<ProfileRow> = {}): ProfileRow => ({
  id, created_at, full_name: id.toUpperCase(), email: `${id}@uottawa.ca`, is_admin: false, status: "ACTIVE", last_admin_active_at: null, ...extra,
});
const note = (id: string, uploader: string, course: string, status: string, created: string, reviewed: string | null, extra: Partial<NoteRow> = {}): NoteRow => ({
  id, uploader_id: uploader, course_code: course, status, created_at: created, reviewed_at: reviewed, hours_awarded: null, author_name: null, language: "EN", note_types: [], ...extra,
});
const decision = (admin: string, action: string, noteId: string, at: string): AuditRow => ({
  admin_id: admin, action_type: action, target_type: "note", target_id: noteId, created_at: at,
});

const profiles = [
  profile("a1", "2026-01-01T00:00:00Z", { is_admin: true }),
  profile("a2", "2026-01-01T00:00:00Z", { is_admin: true }),
  profile("u1", "2026-09-20T12:00:00Z"),
  profile("u2", "2026-08-20T12:00:00Z"), // previous 30-day window
  profile("u3", "2026-09-28T12:00:00Z", { status: "BANNED" }),
];
const notes = [
  note("n1", "u1", "BIO1130", "approved", "2026-09-21T14:00:00Z", "2026-09-21T20:00:00Z", { hours_awarded: 2 }),
  note("n2", "u1", "bio 1130", "approved", "2026-09-22T14:00:00Z", "2026-09-23T14:00:00Z", { hours_awarded: 3, language: "FR" }),
  note("n3", "u2", "CHM1311", "rejected", "2026-08-25T14:00:00Z", "2026-08-26T14:00:00Z"),
  note("n4", "u3", "PHY1121", "pending", "2026-09-26T16:00:00Z", null), // waiting 72h
  note("n5", "u3", "MAT1320", "pending", "2026-09-29T10:00:00Z", null), // waiting 6h
  note("n6", "u2", "PSY1101", "flagged", "2026-09-10T14:00:00Z", "2026-09-11T14:00:00Z"),
];
const audit = [
  decision("a1", "NOTE_APPROVED", "n1", "2026-09-21T20:00:00Z"), // 6h after submission
  decision("a2", "NOTE_CHANGES_REQUESTED", "n2", "2026-09-22T16:00:00Z"), // 2h, n2's first decision
  decision("a2", "NOTE_APPROVED", "n2", "2026-09-23T14:00:00Z"), // later decision, not "first"
  decision("a1", "NOTE_REJECTED", "n3", "2026-08-26T14:00:00Z"), // 24h, previous window
  decision("a1", "NOTE_APPROVED", "n6", "2026-09-11T14:00:00Z"), // 24h
];

describe("computeAnalytics (30 days)", () => {
  const d = computeAnalytics({ notes, profiles, audit }, "30d", NOW);

  it("compares this period with the one before", () => {
    expect(d.metrics.submissions).toMatchObject({ total: 5, prevTotal: 1 });
    expect(d.metrics.signups).toMatchObject({ total: 2, prevTotal: 1 });
    expect(d.metrics.approvals).toMatchObject({ total: 3, prevTotal: 0 });
    expect(d.metrics.hours.total).toBe(5);
    expect(d.contributors).toMatchObject({ current: 3, prev: 1 });
  });

  it("counts statuses and the funnel", () => {
    expect(d.status).toEqual({ approved: 2, pending: 2, changes: 0, flagged: 1, rejected: 1, total: 6 });
    expect(d.funnel.map((f) => f.value)).toEqual([6, 4, 3, 2]);
  });

  it("measures review speed from each note's first decision only", () => {
    expect(d.speed.count).toBe(3); // n1 6h, n2 2h, n6 24h
    expect(d.speed.median).toBe(6);
    expect(d.speed.medianPrev).toBe(24);
    expect(d.speed.within24).toBe(100);
  });

  it("computes rates", () => {
    expect(d.rates.approval).toBe(100);
    expect(d.rates.approvalPrev).toBe(0);
    expect(d.rates).toMatchObject({ resub: 100, resubApproved: 1, resubTotal: 1 });
  });

  it("reports what needs attention", () => {
    expect(d.attention).toMatchObject({ pending: 2, flagged: 1, over48h: 1 });
    expect(d.attention.oldestHours).toBeCloseTo(72);
    expect(d.queueAging.map((q) => q.value)).toEqual([1, 0, 1, 0]);
  });

  it("normalises course codes in the library", () => {
    expect(d.library.courseRows).toEqual([{ label: "BIO1130", value: 2 }]);
    expect(d.library).toMatchObject({ published: 2, courses: 1, english: 1, french: 1, singleNoteCourses: 0 });
    expect(d.library.newCourses).toEqual(["BIO1130"]);
  });

  it("describes the community", () => {
    expect(d.community).toMatchObject({ totalUsers: 5, banned: 1, admins: 2, contributors: 3, repeat: 3, firstTimeInRange: 2 });
    expect(d.community.activation.map((a) => a.value)).toEqual([5, 3, 1]);
  });

  it("summarises each admin", () => {
    const a1 = d.team.rows.find((r) => r.id === "a1")!;
    const a2 = d.team.rows.find((r) => r.id === "a2")!;
    expect(a1).toMatchObject({ approved: 2, rejected: 1, changes: 0, inRange: 2, approvalRate: 67, share: 50, medianHours: 24 });
    expect(a2).toMatchObject({ approved: 1, changes: 1, inRange: 2, share: 50, medianHours: 2 });
    expect(d.team).toMatchObject({ activeReviewers: 2, totalAdmins: 2, decisionsInRange: 4, decisionsPrev: 1 });
  });

  it("tracks the submission rhythm", () => {
    expect(d.activity.streak).toBe(1); // today yes, yesterday no
    expect(d.activity.activeDays).toBe(5);
  });
});
