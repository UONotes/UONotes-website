import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { PdfViewer } from "@/components/admin/PdfViewer";
import { DocumentMetadata } from "@/components/admin/DocumentMetadata";
import { ReviewActionPanel } from "@/components/admin/ReviewActionPanel";
import { AlertTriangle, Clock3 } from "lucide-react";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createR2Client, R2_BUCKET_NAME } from "@/lib/r2";

export default async function DocumentReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user: caller } } = await supabase.auth.getUser();
  if (!caller) redirect("/signin");

  const { data: note, error } = await supabase
    .from("notes")
    .select(`
      id,
      title,
      course_code,
      status,
      file_key,
      file_size,
      flag_reason,
      flagged_by,
      feedback_attachment_key,
      created_at,
      language,
      note_types,
      author_email,
      reviewed_by,
      hours_awarded
    `)
    .eq("id", id)
    .single();

  if (error) console.error("Database Error on Review Page:", error.message);
  if (error || !note) notFound();

  if (note.reviewed_by && note.reviewed_by !== caller.id) {
    const { data: reviewerProfile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", note.reviewed_by)
      .single();

    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-[#FBF8F3]">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="font-logo text-xl font-bold text-[#23201D]">Someone else has this one</h2>
        <p className="text-sm text-gray-500 max-w-sm mt-1.5 mb-6">
          {reviewerProfile?.email || "Another admin"} is currently reviewing this submission. Pick a different item from the queue.
        </p>
        <a href="/admin/queue" className="px-5 py-2.5 bg-[#23201D] text-white text-sm font-semibold rounded-xl hover:bg-black transition-colors">
          Back to queue
        </a>
      </div>
    );
  }

  const r2 = createR2Client();
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: note.file_key,
  });
  
  const fileUrl = await getSignedUrl(r2, command, { expiresIn: 3600 });

  let reporterEmail: string | null = null;
  if (note.flagged_by) {
    const { data: reporterProfile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", note.flagged_by)
      .single();
    reporterEmail = reporterProfile?.email ?? null;
  }

  let feedbackAttachmentUrl: string | null = null;
  if (note.feedback_attachment_key) {
    const attachmentCommand = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: note.feedback_attachment_key,
    });
    feedbackAttachmentUrl = await getSignedUrl(r2, attachmentCommand, { expiresIn: 3600 });
  }

  const formattedNote = {
    id: note.id,
    title: note.title,
    courseCode: note.course_code,
    uploaderEmail: note.author_email || "Unknown User",
    reporterEmail,
    fileSize: note.file_size || 0,
    flagReason: note.flag_reason || null,
    feedbackAttachmentUrl,
    status: note.status,
    createdAt: note.created_at,
    language: note.language || "EN",
    noteTypes: note.note_types || [],
  };

  const isChangesRequested = note.status === "changes_requested";

  return (
    <div className="flex flex-col lg:flex-row h-full bg-[#FBF8F3] overflow-hidden relative">
      <div className="flex-1 h-full bg-[#3D3A36] overflow-hidden relative z-0">
        <PdfViewer documentId={formattedNote.id} title={formattedNote.title} fileUrl={fileUrl} readOnly={isChangesRequested} />
      </div>
      
      <div className="w-full lg:w-[420px] h-full bg-white border-l border-black/5 flex flex-col justify-between overflow-y-auto z-10">
        <DocumentMetadata note={formattedNote} />
        {isChangesRequested ? (
          <div className="border-t border-orange-100 bg-orange-50/60 p-6 flex flex-col gap-2 shrink-0">
            <div className="flex items-center gap-2 text-orange-800 text-sm font-semibold">
              <Clock3 className="w-4 h-4" /> Waiting on the student
            </div>
            <p className="text-xs text-orange-900/80 leading-relaxed">
              This note is out with the submitter for the fixes requested above. It can&apos;t be claimed or
              re-reviewed until they resubmit — it&apos;ll return to the Pending queue automatically when they do.
            </p>
          </div>
        ) : (
          <ReviewActionPanel
            noteId={formattedNote.id}
            currentHoursAwarded={note.hours_awarded}
            currentStatus={note.status}
          />
        )}
      </div>
    </div>
  );
}