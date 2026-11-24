import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound, redirect } from "next/navigation";
import { PdfViewer } from "@/components/admin/PdfViewer";
import { DocumentMetadata, type NoteReport } from "@/components/admin/DocumentMetadata";
import { ReviewActionPanel } from "@/components/admin/ReviewActionPanel";
import { FixUploadPanel } from "@/components/admin/FixUploadPanel";
import { FinalCheckPanel } from "@/components/admin/FinalCheckPanel";
import { ClaimGate } from "@/components/admin/ClaimGate";
import { ClaimHeartbeat } from "@/components/admin/ClaimHeartbeat";
import { Lock, Wrench, ShieldCheck } from "lucide-react";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createR2Client, R2_BUCKET_NAME } from "@/lib/r2";
import { canFinalCheck, claimExpiresAt, fileExtension, isClaimActive, REQUIRE_SECOND_REVIEWER } from "@/lib/review";
import { formatDateTime } from "@/lib/dateFormat";

function InfoBox({
  tone,
  icon: Icon,
  title,
  children,
}: {
  tone: "orange" | "amber" | "teal";
  icon: typeof Lock;
  title: string;
  children: React.ReactNode;
}) {
  const styles = {
    orange: "border-amber-100 bg-amber-50/60 text-amber-800 [&_p]:text-amber-900/80",
    amber: "border-amber-100 bg-amber-50/60 text-amber-800 [&_p]:text-amber-900/80",
    teal: "border-stone-200 bg-stone-100/60 text-stone-900 [&_p]:text-stone-900/80",
  }[tone];
  return (
    <div className={`border-t p-5 sm:p-6 flex flex-col gap-2 shrink-0 ${styles}`}>
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Icon className="w-4 h-4" /> {title}
      </div>
      <p className="text-xs leading-relaxed">{children}</p>
    </div>
  );
}

export default async function DocumentReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user: caller } } = await supabase.auth.getUser();
  if (!caller) redirect("/signin");

  const [{ data: note, error }, { data: callerProfile }] = await Promise.all([
    supabase
      .from("notes")
      .select(`
        id,
        title,
        course_code,
        status,
        file_key,
        file_size,
        file_type,
        flag_reason,
        created_at,
        language,
        note_types,
        author_email,
        reviewed_by,
        claimed_at,
        hours_awarded,
        corrected_file_key,
        corrected_file_type,
        checked_by,
        checked_at,
        recommendation,
        recommendation_note,
        recommended_hours,
        returned_by,
        returned_at,
        return_note
      `)
      .eq("id", id)
      .single(),
    // "*" so a missing role column can't fail the lookup and hide the final-check controls.
    supabase.from("profiles").select("*").eq("id", caller.id).single(),
  ]);

  if (error) console.error("Database Error on Review Page:", error.message);
  if (error || !note) notFound();

  const isFinalChecker = canFinalCheck(callerProfile);

  // Viewing a note never claims it — only an explicit click on "Claim
  // for review" (via ClaimGate/claimNoteAction) does that. A claim also
  // lapses once its holder goes inactive (lib/review.ts), at which point
  // the note is claimable again even though reviewed_by is still set.
  const claimedByCaller = note.reviewed_by === caller.id;
  const claimActive = isClaimActive(note);
  const claimedByOther = Boolean(note.reviewed_by) && !claimedByCaller && claimActive;
  const isBeingFixed = note.status === "in_revision";
  const isFinalCheck = note.status === "fix_review";
  const isFix = isFinalCheck && Boolean(note.corrected_file_key);
  // Super admins can sign off on notes they sent up themselves.
  const isOwnCheck = isFinalCheck && note.checked_by === caller.id && !callerProfile?.is_super_admin;

  // Everyone whose name appears on this page, in one lookup.
  const peopleIds = Array.from(
    new Set([note.reviewed_by, note.checked_by, note.returned_by].filter((v): v is string => Boolean(v)))
  );
  const people = new Map<string, { full_name: string | null; email: string | null }>();
  if (peopleIds.length > 0) {
    const { data: profiles } = await supabase.from("profiles").select("id, full_name, email").in("id", peopleIds);
    (profiles || []).forEach((p) => people.set(p.id, p));
  }
  const nameOf = (userId: string | null, fallback: string) => {
    if (!userId) return fallback;
    if (userId === caller.id) return "You";
    const p = people.get(userId);
    return p?.full_name || p?.email || fallback;
  };
  const claimHolderEmail = note.reviewed_by && !claimedByCaller ? people.get(note.reviewed_by)?.email ?? null : null;
  const checkerName = nameOf(note.checked_by, "A director");

  const r2 = createR2Client();
  const fileUrl = await getSignedUrl(r2, new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: note.file_key }), {
    expiresIn: 3600,
  });

  const safeTitle = (note.title || "note").replace(/[^\w\- ]+/g, "").trim().slice(0, 80) || "note";
  const downloadUrl = await getSignedUrl(
    r2,
    new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: note.file_key,
      ResponseContentDisposition: `attachment; filename="${safeTitle}.${fileExtension(note.file_key) || "pdf"}"`,
    }),
    { expiresIn: 3600 }
  );

  // A director's corrected file, shown next to the original during the
  // final check.
  let comparison: { fileUrl: string; fileType: string | null; fileKey: string; downloadUrl: string } | null = null;
  if (isFix) {
    const correctedKey = note.corrected_file_key as string;
    const [correctedUrl, correctedDownloadUrl] = await Promise.all([
      getSignedUrl(r2, new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: correctedKey }), { expiresIn: 3600 }),
      getSignedUrl(
        r2,
        new GetObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: correctedKey,
          ResponseContentDisposition: `attachment; filename="${safeTitle} (fixed).${fileExtension(correctedKey) || "pdf"}"`,
        }),
        { expiresIn: 3600 }
      ),
    ]);
    comparison = { fileUrl: correctedUrl, fileType: note.corrected_file_type ?? null, fileKey: correctedKey, downloadUrl: correctedDownloadUrl };
  }

  // Reports live in their own table (one row per reporter) and are only
  // readable with the service role.
  const admin = createAdminClient();
  const { data: reportRows } = await admin
    .from("note_reports")
    .select("id, reporter_id, reason, created_at")
    .eq("note_id", note.id)
    .is("resolved_at", null)
    .order("created_at", { ascending: true });

  const reporterIds = Array.from(new Set((reportRows || []).map((r) => r.reporter_id)));
  const reporterEmails = new Map<string, string>();
  if (reporterIds.length > 0) {
    const { data: reporterProfiles } = await admin.from("profiles").select("id, email").in("id", reporterIds);
    (reporterProfiles || []).forEach((p) => reporterEmails.set(p.id, p.email));
  }
  const reports: NoteReport[] = (reportRows || []).map((r) => ({
    id: r.id,
    reason: r.reason,
    reporterEmail: reporterEmails.get(r.reporter_id) ?? null,
    createdAt: r.created_at,
  }));

  const formattedNote = {
    id: note.id,
    title: note.title,
    courseCode: note.course_code,
    uploaderEmail: note.author_email || "Unknown User",
    fileSize: note.file_size || 0,
    flagReason: note.flag_reason || null,
    status: note.status,
    createdAt: note.created_at,
    language: note.language || "EN",
    noteTypes: note.note_types || [],
  };

  const sentBack = note.return_note
    ? { note: note.return_note, by: nameOf(note.returned_by, "VP Notes"), at: note.returned_at }
    : null;

  const lockExpiry = claimExpiresAt(note)?.toISOString() ?? null;

  let panel: React.ReactNode;
  if (claimedByCaller && isBeingFixed) {
    panel = (
      <FixUploadPanel
        noteId={note.id}
        originalDownloadUrl={downloadUrl}
        wasPublished={reports.length > 0}
        currentHoursAwarded={note.hours_awarded}
        lockExpiresAt={lockExpiry}
      />
    );
  } else if (claimedByCaller && isFinalCheck) {
    panel = (
      <FinalCheckPanel
        noteId={note.id}
        checkerName={checkerName}
        checkedAt={note.checked_at}
        recommendation={note.recommendation}
        recommendationNote={note.recommendation_note}
        isFix={isFix}
        wasPublished={reports.length > 0}
        recommendedHours={note.recommended_hours ?? note.hours_awarded}
      />
    );
  } else if (claimedByCaller) {
    panel = <ReviewActionPanel noteId={note.id} currentHoursAwarded={note.hours_awarded} currentStatus={note.status} />;
  } else if (claimedByOther && isBeingFixed) {
    panel = (
      <InfoBox tone="orange" icon={Wrench} title="Being fixed by another director">
        {claimHolderEmail || "Another director"} is correcting this note offline. It stays with them until
        {lockExpiry ? ` ${formatDateTime(lockExpiry)}` : " they finish"} — after that, you can take it over.
      </InfoBox>
    );
  } else if (claimedByOther) {
    panel = (
      <InfoBox tone="amber" icon={Lock} title={isFinalCheck ? "Final check in progress" : "Claimed by another director"}>
        {claimHolderEmail || "Someone"} currently has this note claimed. You can keep looking through it, but
        decisions are locked until they release it, decide on it, or go inactive for 30 minutes.
      </InfoBox>
    );
  } else if (isFinalCheck && !isFinalChecker) {
    panel = (
      <InfoBox tone="teal" icon={ShieldCheck} title="Waiting for VP Notes">
        {checkerName} sent this note to final check. Only VP Notes or a super admin can
        approve and publish it, deny it, or send it back to pending.
      </InfoBox>
    );
  } else if (isOwnCheck && REQUIRE_SECOND_REVIEWER) {
    panel = (
      <InfoBox tone="teal" icon={ShieldCheck} title="Waiting for a final check">
        You sent this note to final check, so another VP Notes member or a super admin has to do the final check.
      </InfoBox>
    );
  } else {
    panel = (
      <ClaimGate
        noteId={note.id}
        isBeingFixed={isBeingFixed}
        isFinalCheck={isFinalCheck}
        expiredHolderEmail={note.reviewed_by && !claimActive ? claimHolderEmail : null}
      />
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-full bg-brand-surface overflow-y-auto lg:overflow-hidden relative">
      {claimedByCaller && <ClaimHeartbeat noteId={note.id} />}

      {/* Phones and tablets: document on top at a fixed height, details and
          actions scroll underneath. Laptops and up: side by side. */}
      <div className="h-[60dvh] md:h-[70dvh] lg:h-full lg:flex-1 shrink-0 lg:shrink lg:min-w-0 bg-[#262626] overflow-hidden relative z-0">
        <PdfViewer
          documentId={formattedNote.id}
          title={formattedNote.title}
          fileUrl={fileUrl}
          fileType={note.file_type ?? null}
          fileKey={note.file_key}
          downloadUrl={downloadUrl}
          isBeingFixed={isBeingFixed}
          isFinalCheck={isFinalCheck}
          comparison={comparison}
          claimedByCaller={claimedByCaller}
          claimedByOtherEmail={claimedByOther ? claimHolderEmail : null}
        />
      </div>

      <div className="w-full lg:w-[380px] xl:w-[420px] lg:h-full shrink-0 bg-white border-t lg:border-t-0 lg:border-l border-brand-border-light flex flex-col justify-between lg:overflow-y-auto z-10">
        <DocumentMetadata
          note={formattedNote}
          reports={reports}
          sentBack={sentBack}
          finalCheck={
            isFinalCheck && !claimedByCaller
              ? { checkerName, checkedAt: note.checked_at, recommendation: note.recommendation, isFix }
              : null
          }
        />
        <div id="review-actions">{panel}</div>
      </div>
    </div>
  );
}
