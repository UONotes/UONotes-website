import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { PdfViewer } from "@/components/admin/PdfViewer";
import { DocumentMetadata } from "@/components/admin/DocumentMetadata";
import { ReviewActionPanel } from "@/components/admin/ReviewActionPanel";
import { AlertTriangle } from "lucide-react";
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
      <div className="w-full h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-4 shadow-xs">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-gray-900 tracking-tight">Document Currently Locked</h2>
        <p className="text-xs text-gray-500 max-w-sm mt-1 mb-6">
          This submission is actively being reviewed by another administrator ({reviewerProfile?.email || "Unknown Admin"}). Please select a different item from the queue.
        </p>
        <a href="/admin/queue" className="px-5 py-2.5 bg-gray-900 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md hover:bg-gray-800 transition-colors">
          Return to Queue
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

  const formattedNote = {
    id: note.id,
    title: note.title,
    courseCode: note.course_code,
    uploaderEmail: note.author_email || "Unknown User",
    reporterEmail: null,
    fileSize: note.file_size || 0,
    flagReason: note.flag_reason || null,
    status: note.status,
    createdAt: note.created_at,
    language: note.language || "EN",
    noteTypes: note.note_types || [],
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] bg-gray-50 overflow-hidden relative">
      <div className="flex-1 h-full bg-gray-950 overflow-hidden relative shadow-[inset_-10px_0_20px_rgba(0,0,0,0.2)] z-0">
        <PdfViewer documentId={formattedNote.id} title={formattedNote.title} fileUrl={fileUrl} />
      </div>
      
      <div className="w-full lg:w-[460px] h-full bg-[#FAFAFA] border-l border-gray-200 flex flex-col justify-between overflow-y-auto shadow-2xl z-10 pt-12 lg:pt-0">
        <DocumentMetadata note={formattedNote} />
        <ReviewActionPanel
          noteId={formattedNote.id}
          currentHoursAwarded={note.hours_awarded}
          currentStatus={note.status}
        />
      </div>
    </div>
  );
}