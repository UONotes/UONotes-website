import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { PdfViewer } from "@/components/admin/PdfViewer";
import { DocumentMetadata } from "@/components/admin/DocumentMetadata";
import { ReviewActionPanel } from "@/components/admin/ReviewActionPanel";
import { AlertTriangle, ArrowLeft } from "lucide-react";

export default async function DocumentReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user: caller } } = await supabase.auth.getUser();
  if (!caller) redirect("/login");

  // Fetch note with uploader, reporter, and reviewer relations
  const { data: note, error } = await supabase
    .from("notes")
    .select(`
      id,
      title,
      course_code,
      status,
      file_key,
      flag_reason,
      created_at,
      uploader:uploader_id(email),
      reporter:flagged_by(email),
      reviewer:reviewed_by(id, email)
    `)
    .eq("id", id)
    .single();

  if (error || !note) {
    notFound();
  }

  // Safely extract relations handling array or object returns from Supabase
  const reviewerData = Array.isArray(note.reviewer) ? note.reviewer[0] : note.reviewer;
  const reviewerObj = reviewerData as { id: string; email: string } | null;

  const uploaderData = Array.isArray(note.uploader) ? note.uploader[0] : note.uploader;
  const reporterData = Array.isArray(note.reporter) ? note.reporter[0] : note.reporter;

  // EPHEMERAL SESSION LOCKING GUARD
  if (reviewerObj && reviewerObj.id !== caller.id) {
    return (
      <div className="w-full h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-4 shadow-xs">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-gray-900 tracking-tight">Document Currently Locked</h2>
        <p className="text-xs text-gray-500 max-w-sm mt-1 mb-6">
          This submission is actively being reviewed by another administrator ({reviewerObj.email || "Unknown Admin"}). Please select a different item from the queue.
        </p>
        <a href="/admin/queue" className="px-5 py-2.5 bg-gray-900 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md hover:bg-gray-800 transition-colors">
          Return to Queue
        </a>
      </div>
    );
  }

  // Lock to current admin session if unassigned
  if (!reviewerObj) {
    await supabase
      .from("notes")
      .update({ reviewed_by: caller.id })
      .eq("id", id);
  }

  const formattedNote = {
    id: note.id,
    title: note.title,
    courseCode: note.course_code,
    uploaderEmail: (uploaderData as any)?.email || "Unknown User",
    reporterEmail: (reporterData as any)?.email || null,
    pages: 4, 
    flagReason: note.flag_reason || null,
    status: note.status,
  };

  // Server action to release the lock manually if the admin wants to back out safely
  async function releaseLockAndReturn() {
    "use server";
    const sb = await createClient();
    await sb
      .from("notes")
      .update({ reviewed_by: null })
      .eq("id", id);
    redirect("/admin/queue");
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] bg-gray-50 overflow-hidden relative">
      
      {/* SAFE EXIT / RELEASE LOCK BAR OVERLAY */}
      <div className="absolute top-4 left-4 z-30">
        <form action={releaseLockAndReturn}>
          <button
            type="submit"
            className="px-3.5 py-2 rounded-xl bg-white/90 backdrop-blur-md border border-gray-200 text-gray-700 hover:text-gray-900 text-xs font-mono font-bold uppercase tracking-wider shadow-md hover:bg-white transition-all flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Release & Return to Queue
          </button>
        </form>
      </div>

      {/* LEFT: IMMERSIVE PDF VIEWER */}
      <div className="flex-1 h-full bg-gray-950 overflow-hidden relative">
        <PdfViewer documentId={formattedNote.id} title={formattedNote.title} />
      </div>

      {/* RIGHT: METADATA & AUDIT ACTION PANEL */}
      <div className="w-full lg:w-[420px] h-full bg-white border-l border-gray-100 flex flex-col justify-between overflow-y-auto shadow-xl z-10 pt-12 lg:pt-0">
        <div>
          <DocumentMetadata note={formattedNote} />
        </div>

        <ReviewActionPanel noteId={formattedNote.id} />
      </div>
    </div>
  );
}