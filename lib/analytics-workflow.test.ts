import { describe, expect, it } from "vitest";
import { computeWorkflow, type WorkProfile, type WorkRow } from "./analytics-workflow";
import type { NoteRow } from "./analytics-data";

const NOW = new Date("2026-09-29T16:00:00Z");
const note = (id: string, course: string, status: string, created: string, extra: Partial<NoteRow> = {}): NoteRow => ({
  id, title: id, uploader_id: "u1", course_code: course, status, created_at: created, reviewed_at: null,
  hours_awarded: null, author_name: null, language: "EN", note_types: [], ...extra,
});
const ev = (admin: string, action: string, id: string, at: string, checked_by: string | null = null): WorkRow => ({
  admin_id: admin, action_type: action, target_type: "note", target_id: id, created_at: at, checked_by,
});
const person = (id: string, extra: Partial<WorkProfile> = {}): WorkProfile => ({
  id, created_at: "2026-01-01T00:00:00Z", full_name: id, email: null, is_admin: true, status: "ACTIVE", last_admin_active_at: null, ...extra,
});

const d = computeWorkflow(
  {
    profiles: [person("dir"), person("vp", { is_vp_notes: true }), person("stu", { is_admin: false })],
    notes: [
      note("n1", "BIO1130", "approved", "2026-09-20T00:00:00Z", { reviewed_at: "2026-09-20T14:00:00Z" }),
      note("n2", "MED1000", "fix_review", "2026-09-20T00:00:00Z", { uploader_id: "u2" }),
      note("n3", "EDU1000", "pending", "2026-09-25T00:00:00Z"),
      note("n4", "CSI2110", "flagged", "2026-01-25T00:00:00Z"),
    ],
    audit: [
      ev("dir", "NOTE_SENT_TO_FINAL_CHECK", "n1", "2026-09-20T10:00:00Z"),
      ev("vp", "NOTE_APPROVED", "n1", "2026-09-20T14:00:00Z", "dir"),
      ev("dir", "NOTE_FIXES_STARTED", "n2", "2026-09-20T20:00:00Z"),
      ev("dir", "NOTE_FIX_SUBMITTED", "n2", "2026-09-29T12:00:00Z"),
      ev("dir", "NOTE_SENT_TO_FINAL_CHECK", "n3", "2026-09-26T00:00:00Z"),
      ev("vp", "NOTE_SENT_BACK_TO_PENDING", "n3", "2026-09-26T06:00:00Z", "dir"),
    ],
    saves: [
      { note_id: "n1", created_at: "2026-09-28T00:00:00Z" },
      { note_id: "n1", created_at: "2026-01-28T00:00:00Z" },
      { note_id: "n4", created_at: "2026-09-28T00:00:00Z" },
    ],
    reports: [
      { reason: "Wrong course: it is BIO", created_at: "2026-09-28T00:00:00Z" },
      { reason: "Wrong course", created_at: "2026-09-27T00:00:00Z" },
    ],
  },
  "30d",
  NOW
);
const stage = (k: string) => d.stages.find((s) => s.key === k)!;

describe("computeWorkflow", () => {
  it("times each stage from when the note entered it", () => {
    expect(stage("fix_review")).toMatchObject({ count: 1, oldestHours: 4, overdue: 0 });
    expect(stage("pending")).toMatchObject({ count: 1, oldestHours: 82, overdue: 1 }); // since it was sent back
    expect(stage("flagged")).toMatchObject({ count: 1, oldestHours: null });
  });

  it("splits first check from final check", () => {
    expect(d.firstCheck).toMatchObject({ median: 20, count: 3 }); // 10h, 20h, 24h
    expect(d.finalCheck).toMatchObject({ median: 5, count: 2 }); // 4h, 6h
  });

  it("credits directors as well as final checkers", () => {
    expect(d.people).toHaveLength(2);
    expect(d.people.find((p) => p.id === "dir")).toMatchObject({ checks: 2, fixes: 1, finals: 0, sentBack: 1, total: 3, role: "Notes Director" });
    expect(d.people.find((p) => p.id === "vp")).toMatchObject({ checks: 0, finals: 2, total: 2, role: "VP Notes" });
    expect(d.sentBack).toEqual({ count: 1, prev: 0, rate: 50 });
  });

  it("counts coverage, contributors, saves and reports", () => {
    expect(d.faculties.find((f) => f.label === "Science")).toMatchObject({ published: 1, added: 1 });
    expect(d.contributors).toEqual({ fresh: 1, returning: 1 });
    expect(d.saves).toMatchObject({ total: 3, inRange: 2, prev: 0 });
    expect(d.saves.top).toEqual([{ id: "n1", title: "n1", course: "BIO1130", value: 2 }]);
    expect(d.reports.reasons).toEqual([{ label: "Wrong course", value: 2 }]);
  });

  it("compares work coming in with work going out", () => {
    const sum = (a: number[]) => a.reduce((s, v) => s + v, 0);
    expect(sum(d.submitted)).toBe(3);
    expect(sum(d.decided)).toBe(1);
  });
});
