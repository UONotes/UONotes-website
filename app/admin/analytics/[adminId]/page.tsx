import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createR2Client, R2_BUCKET_NAME } from "@/lib/r2";
import { bucketSeries, easternDayHour } from "@/lib/analytics";
import { getAnalytics, isSuperAdmin } from "@/lib/analytics-loader";
import { AdminProfileView, type HistoryEntry } from "@/components/admin/analytics/AdminProfileView";

type AuditDetails = {
  note_title?: string | null;
  course_code?: string | null;
  reason?: string | null;
  attachment_key?: string | null;
  reasons?: string[];
  custom_note?: string | null;
};

type AuditRow = {
  id: string;
  action_type: string;
  target_type: string | null;
  target_id: string | null;
  created_at: string;
  details: AuditDetails | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const HISTORY_LIMIT = 300;

export default async function AdminAnalyticsDetailPage({ params }: { params: Promise<{ adminId: string }> }) {
  const { adminId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/signin");
  if (!(await isSuperAdmin(supabase, user.id))) redirect("/admin");

  const db = createAdminClient();
  const [{ data: target }, analytics, rows] = await Promise.all([
    db.from("profiles").select("full_name, email, last_admin_active_at, is_admin, is_super_admin").eq("id", adminId).single(),
    getAnalytics("30d"),
    (async () => {
      const all: AuditRow[] = [];
      for (let from = 0; ; from += 1000) {
        const { data } = await db
          .from("admin_audit_log")
          .select("id, action_type, target_type, target_id, created_at, details")
          .eq("admin_id", adminId)
          .in("action_type", ["NOTE_APPROVED", "NOTE_REJECTED", "NOTE_CHANGES_REQUESTED", "BAN", "UNBAN"])
          .order("created_at", { ascending: false })
          .range(from, from + 999);
        all.push(...((data as AuditRow[]) || []));
        if (!data || data.length < 1000) break;
      }
      return all;
    })(),
  ]);

  if (!target) notFound();

  const now = new Date();
  const decisions = rows.filter((r) => r.action_type.startsWith("NOTE_"));
  const inLast = (days: number, offset = 0) => (r: AuditRow) => {
    const age = now.getTime() - new Date(r.created_at).getTime();
    return age >= offset * DAY_MS && age < (offset + days) * DAY_MS;
  };
  const series = (type: string) =>
    bucketSeries(
      decisions.filter((r) => r.action_type === type && inLast(30)(r)).map((r) => ({ at: r.created_at })),
      30,
      1,
      now
    ).map((b) => b.value);

  const heat = Array.from({ length: 7 }, () => Array(8).fill(0) as number[]);
  for (const r of decisions) {
    const { day, hour } = easternDayHour(r.created_at);
    heat[day][Math.floor(hour / 3)]++;
  }

  // ── History (most recent first) ──
  const recent = rows.slice(0, HISTORY_LIMIT);
  // Older note entries logged before we snapshotted title/course won't have
  // them in `details`; ban entries point at a profile. Look both up.
  const missingNoteIds = [...new Set(recent.filter((r) => r.target_type === "note" && !r.details?.note_title && r.target_id).map((r) => r.target_id as string))];
  const userIds = [...new Set(recent.filter((r) => r.target_type === "user" && r.target_id).map((r) => r.target_id as string))];
  const [{ data: fallbackNotes }, { data: targetUsers }] = await Promise.all([
    missingNoteIds.length ? db.from("notes").select("id, title, course_code").in("id", missingNoteIds) : Promise.resolve({ data: [] }),
    userIds.length ? db.from("profiles").select("id, full_name, email").in("id", userIds) : Promise.resolve({ data: [] }),
  ]);
  const noteLookup = new Map((fallbackNotes || []).map((n: { id: string; title: string; course_code: string }) => [n.id, n]));
  const userLookup = new Map((targetUsers || []).map((u: { id: string; full_name: string | null; email: string | null }) => [u.id, u]));

  const r2 = createR2Client();
  const history: HistoryEntry[] = await Promise.all(
    recent.map(async (r): Promise<HistoryEntry> => {
      if (r.target_type === "user") {
        const u = r.target_id ? userLookup.get(r.target_id) : undefined;
        return {
          id: r.id,
          kind: r.action_type === "BAN" ? "ban" : "unban",
          at: r.created_at,
          title: u?.full_name || u?.email?.split("@")[0] || "Unknown user",
          subtitle: u?.email || "",
          reason: [...(r.details?.reasons ?? []), r.details?.custom_note].filter(Boolean).join(" · ") || null,
          attachmentUrl: null,
        };
      }
      const fallback = r.target_id ? noteLookup.get(r.target_id) : undefined;
      return {
        id: r.id,
        kind: r.action_type === "NOTE_APPROVED" ? "approved" : r.action_type === "NOTE_REJECTED" ? "rejected" : "changes",
        at: r.created_at,
        title: r.details?.note_title || fallback?.title || "Note no longer available",
        subtitle: r.details?.course_code || fallback?.course_code || "—",
        reason: r.details?.reason || null,
        attachmentUrl: r.details?.attachment_key
          ? await getSignedUrl(r2, new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: r.details.attachment_key }), { expiresIn: 3600 })
          : null,
      };
    })
  );

  const member = analytics.team.rows.find((m) => m.id === adminId) ?? null;
  const count = (t: string) => decisions.filter((r) => r.action_type === t).length;

  return (
    <AdminProfileView
      admin={{
        id: adminId,
        name: target.full_name || target.email?.split("@")[0] || "Admin",
        email: target.email || "",
        role: target.is_super_admin ? "Super admin" : target.is_admin ? "Admin" : "Former admin",
        lastActive: target.last_admin_active_at,
      }}
      stats={{
        last30: decisions.filter(inLast(30)).length,
        prev30: decisions.filter(inLast(30, 30)).length,
        approved: count("NOTE_APPROVED"),
        changes: count("NOTE_CHANGES_REQUESTED"),
        rejected: count("NOTE_REJECTED"),
        bans: rows.filter((r) => r.action_type === "BAN").length,
        unbans: rows.filter((r) => r.action_type === "UNBAN").length,
        medianHours: member?.medianHours ?? null,
        teamMedianHours: analytics.speed.median,
        share: member?.share ?? null,
        firstDecision: decisions.at(-1)?.created_at ?? null,
      }}
      chart={{
        labels: analytics.buckets,
        approved: series("NOTE_APPROVED"),
        changes: series("NOTE_CHANGES_REQUESTED"),
        rejected: series("NOTE_REJECTED"),
      }}
      heat={heat}
      history={history}
      historyTruncated={rows.length > HISTORY_LIMIT}
    />
  );
}
