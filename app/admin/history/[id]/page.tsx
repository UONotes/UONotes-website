import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createR2Client, R2_BUCKET_NAME } from "@/lib/r2";
import { HistoryDocumentViewer } from "@/components/admin/HistoryDocumentViewer";
import { DecisionDetailPanel, type DecisionDetail, type DecisionType } from "@/components/admin/DecisionDetailPanel";
import { DECISION_ACTIONS } from "@/lib/review";

type NoteAuditDetails = {
  note_title?: string | null;
  course_code?: string | null;
  note_owner_id?: string | null;
  reason?: string | null;
  attachment_key?: string | null;
  original_file_key?: string | null;
  checked_by?: string | null;
  recommendation?: "approve" | "reject" | null;
};

type ReviewerJoin = { id: string; full_name: string | null; email: string | null };

type AuditRow = {
  id: string;
  action_type: string;
  target_type: string | null;
  target_id: string | null;
  created_at: string;
  details: NoteAuditDetails | null;
  admin: ReviewerJoin | ReviewerJoin[] | null;
};

export default async function AdminHistoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user: caller } } = await supabase.auth.getUser();
  if (!caller) redirect("/signin");

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", caller.id)
    .single();

  if (!callerProfile?.is_admin) redirect("/");

  const { data: logRow, error } = await supabase
    .from("admin_audit_log")
    .select("id, action_type, target_type, target_id, created_at, details, admin:profiles(id, full_name, email)")
    .eq("id", id)
    .single();

  if (error || !logRow) notFound();

  const row = logRow as unknown as AuditRow;

  if (
    row.target_type !== "note" ||
    !(DECISION_ACTIONS as readonly string[]).includes(row.action_type)
  ) {
    notFound();
  }

  const reviewer = Array.isArray(row.admin) ? row.admin[0] : row.admin;
  const reviewerName = reviewer?.full_name || reviewer?.email?.split("@")[0] || "Unknown reviewer";

  let note: {
    id: string;
    title: string;
    course_code: string;
    file_key: string | null;
    file_type: string | null;
    file_size: number | null;
    language: string | null;
    note_types: string[] | null;
    author_email: string | null;
    author_name: string | null;
    uploader_id: string | null;
    created_at: string;
    status: string;
    hours_awarded: number | null;
  } | null = null;

  if (row.target_id) {
    const { data: noteRow } = await supabase
      .from("notes")
      .select("id, title, course_code, file_key, file_type, file_size, language, note_types, author_email, author_name, uploader_id, created_at, status, hours_awarded")
      .eq("id", row.target_id)
      .single();
    note = noteRow ?? null;
  }

  let fileUrl: string | null = null;
  if (note?.file_key) {
    const r2 = createR2Client();
    const command = new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: note.file_key });
    fileUrl = await getSignedUrl(r2, command, { expiresIn: 3600 });
  }

  let attachmentUrl: string | null = null;
  // Legacy fix requests carried a reviewer attachment; fixed notes keep
  // the submitter's original upload.
  const attachmentKey = row.details?.attachment_key || row.details?.original_file_key;
  if (attachmentKey) {
    const r2 = createR2Client();
    const command = new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: attachmentKey });
    attachmentUrl = await getSignedUrl(r2, command, { expiresIn: 3600 });
  }

  let submitterEmail: string | null = note?.author_email ?? null;
  let submitterName: string | null = note?.author_name ?? null;
  const ownerId = row.details?.note_owner_id || note?.uploader_id || null;
  if (ownerId) {
    const { data: ownerProfile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", ownerId)
      .single();
    submitterEmail = submitterEmail ?? ownerProfile?.email ?? null;
    submitterName = submitterName ?? ownerProfile?.full_name ?? null;
  }

  let checkerName: string | null = null;
  if (row.details?.checked_by) {
    const { data: checkerProfile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", row.details.checked_by)
      .single();
    checkerName = checkerProfile?.full_name || checkerProfile?.email || "Unknown director";
  }

  const title = row.details?.note_title || note?.title || "Note no longer available";
  const courseCode = row.details?.course_code || note?.course_code || "—";

  const detail: DecisionDetail = {
    actionType: row.action_type as DecisionType,
    decidedAt: row.created_at,
    reviewerName,
    reviewerEmail: reviewer?.email || "",
    checkerName,
    checkerRecommendation: row.details?.recommendation ?? null,
    reason: row.details?.reason || null,
    attachmentUrl,
    hoursAwarded: note?.hours_awarded ?? null,
    title,
    courseCode,
    language: note?.language ?? null,
    noteTypes: note?.note_types || [],
    submitterName,
    submitterEmail,
    submittedAt: note?.created_at ?? null,
    fileSize: note?.file_size ?? null,
    currentStatus: note?.status ?? null,
    noteExists: Boolean(note),
  };

  return (
    <div className="flex flex-col lg:flex-row h-full bg-brand-surface overflow-y-auto lg:overflow-hidden relative">
      {/* Phones and tablets: document on top at a fixed height, details and
          actions scroll underneath. Laptops and up: side by side. */}
      <div className="h-[60dvh] md:h-[70dvh] lg:h-full lg:flex-1 shrink-0 lg:shrink lg:min-w-0 bg-[#262626] overflow-hidden relative z-0">
        <HistoryDocumentViewer title={title} fileUrl={fileUrl} fileType={note?.file_type ?? null} fileKey={note?.file_key ?? null} />
      </div>

      <div className="w-full lg:w-[380px] xl:w-[420px] lg:h-full shrink-0 bg-white border-t lg:border-t-0 lg:border-l border-brand-border-light flex flex-col lg:overflow-y-auto z-10">
        <DecisionDetailPanel detail={detail} />
      </div>
    </div>
  );
}