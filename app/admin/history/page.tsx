import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createR2Client, R2_BUCKET_NAME } from "@/lib/r2";
import { DecisionHistoryExplorer, type DecisionEntry, type DecisionType } from "@/components/admin/DecisionHistoryExplorer";

const DECISION_ACTIONS: DecisionType[] = ["NOTE_APPROVED", "NOTE_REJECTED", "NOTE_CHANGES_REQUESTED"];

type NoteAuditDetails = {
  note_title?: string | null;
  course_code?: string | null;
  note_owner_id?: string | null;
  reason?: string | null;
  attachment_key?: string | null;
};

type ReviewerJoin = { id: string; full_name: string | null; email: string | null };

type AuditRow = {
  id: string;
  action_type: string;
  target_id: string | null;
  created_at: string;
  details: NoteAuditDetails | null;
  admin: ReviewerJoin | ReviewerJoin[] | null;
};

export default async function AdminHistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!callerProfile?.is_admin) redirect("/");

  const { data: logRows } = await supabase
    .from("admin_audit_log")
    .select("id, action_type, target_id, created_at, details, admin:profiles(id, full_name, email)")
    .eq("target_type", "note")
    .in("action_type", DECISION_ACTIONS)
    .order("created_at", { ascending: false })
    .limit(500);

  const rows = (logRows || []) as unknown as AuditRow[];

  // Look up every referenced note in one batch. This serves two
  // purposes: (1) legacy audit rows logged before we started
  // snapshotting note_title/course_code onto the row fall back to this
  // live data, and (2) we use it to know whether the note still exists
  // at all, so we only link out to notes a director can actually open.
  const allNoteIds = Array.from(
    new Set(rows.map((r) => r.target_id).filter((id): id is string => Boolean(id)))
  );
  const noteFallbackMap = new Map<string, { title: string; course_code: string; author_email: string | null; author_name: string | null }>();
  if (allNoteIds.length > 0) {
    const { data: fallbackNotes } = await supabase
      .from("notes")
      .select("id, title, course_code, author_email, author_name")
      .in("id", allNoteIds);
    (fallbackNotes || []).forEach((n) =>
      noteFallbackMap.set(n.id, { title: n.title, course_code: n.course_code, author_email: n.author_email, author_name: n.author_name })
    );
  }

  // Submitter identity: the note itself carries the name/email the
  // submitter typed in at upload time (author_name/author_email), which
  // is what we show by default. If we also have their account id, pull
  // their profile as a fallback for whichever of those two is missing.
  const ownerIds = Array.from(
    new Set(rows.map((r) => r.details?.note_owner_id).filter((id): id is string => Boolean(id)))
  );
  const ownerProfileMap = new Map<string, { full_name: string | null; email: string | null }>();
  if (ownerIds.length > 0) {
    const { data: ownerProfiles } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", ownerIds);
    (ownerProfiles || []).forEach((p) => {
      ownerProfileMap.set(p.id, { full_name: p.full_name, email: p.email });
    });
  }

  const r2 = createR2Client();

  const entries: DecisionEntry[] = await Promise.all(
    rows.map(async (row) => {
      const reviewer = Array.isArray(row.admin) ? row.admin[0] : row.admin;
      const reviewerName = reviewer?.full_name || reviewer?.email?.split("@")[0] || "Unknown reviewer";
      const fallback = row.target_id ? noteFallbackMap.get(row.target_id) : undefined;

      let attachmentUrl: string | null = null;
      if (row.details?.attachment_key) {
        const command = new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: row.details.attachment_key });
        attachmentUrl = await getSignedUrl(r2, command, { expiresIn: 3600 });
      }

      const ownerId = row.details?.note_owner_id || null;
      const ownerProfile = ownerId ? ownerProfileMap.get(ownerId) : undefined;

      const submitterEmail = fallback?.author_email || ownerProfile?.email || null;
      const submitterName = fallback?.author_name || ownerProfile?.full_name || null;

      return {
        id: row.id,
        noteId: row.target_id,
        noteExists: Boolean(fallback),
        actionType: row.action_type as DecisionType,
        createdAt: row.created_at,
        title: row.details?.note_title || fallback?.title || "Note no longer available",
        courseCode: row.details?.course_code || fallback?.course_code || "—",
        reason: row.details?.reason || null,
        attachmentUrl,
        submitterName,
        submitterEmail,
        reviewerId: reviewer?.id || "unknown",
        reviewerName,
        reviewerEmail: reviewer?.email || "",
      };
    })
  );

  const reviewerMap = new Map<string, string>();
  entries.forEach((e) => {
    if (e.reviewerId !== "unknown" && !reviewerMap.has(e.reviewerId)) {
      reviewerMap.set(e.reviewerId, e.reviewerName);
    }
  });
  const reviewers = Array.from(reviewerMap.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <div className="pb-6 border-b border-black/5">
        <h1 className="font-logo text-3xl font-bold text-[#23201D] tracking-tight">Decision History</h1>
        <p className="text-sm text-gray-500 mt-1">
          Every note that&apos;s been approved, rejected or sent back for fixes.
        </p>
      </div>

      <DecisionHistoryExplorer entries={entries} reviewers={reviewers} />
    </div>
  );
}