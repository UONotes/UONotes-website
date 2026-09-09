"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FileUp, Clock, CheckCircle2, XCircle, Search, MessageSquareText, X, Flag, RotateCcw, Bookmark, Eye, Trash2, UploadCloud, Loader2, Paperclip } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { resubmitNoteAction, getFeedbackAttachmentUrlAction } from "@/app/(main)/notes/actions";
import { ALLOWED_FILE_EXTENSIONS, isAllowedFileType, isAllowedFileSize } from "@/lib/fileValidation";

const notebookStyle = {
  backgroundImage: `
    linear-gradient(90deg, transparent 64px, rgba(168, 49, 66, 0.15) 64px, rgba(168, 49, 66, 0.15) 66px, transparent 66px),
    linear-gradient(transparent 31px, #e5e7eb 32px)
  `,
  backgroundSize: "100% 100%, 100% 32px",
};

interface DatabaseSubmission {
  id: string;
  title: string;
  status: string;
  hours_awarded: number | null;
  flag_reason: string | null;
  feedback_attachment_key: string | null;
}

interface SubmissionItem {
  id: string;
  title: string;
  hours: number;
  status: "Pending" | "Accepted" | "Rejected" | "Flagged" | "Changes Requested";
  feedback?: string;
  hasAttachment: boolean;
}

interface DatabaseSavedNote {
  id: string;
  note_id: string;
  notes: { id: string; title: string; course_code: string } | { id: string; title: string; course_code: string }[] | null;
}

function mapStatus(status: string): SubmissionItem["status"] {
  if (status === "approved") return "Accepted";
  if (status === "rejected") return "Rejected";
  if (status === "flagged") return "Flagged";
  if (status === "changes_requested") return "Changes Requested";
  return "Pending";
}

export function DashboardView({
  submissions: rawSubmissions,
  savedNotes: rawSavedNotes,
}: {
  submissions: DatabaseSubmission[];
  savedNotes: DatabaseSavedNote[];
}) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionItem | null>(null);
  const [savedNotes, setSavedNotes] = useState(rawSavedNotes);

  const [resubmitFile, setResubmitFile] = useState<File | null>(null);
  const [isResubmitting, setIsResubmitting] = useState(false);
  const [resubmitError, setResubmitError] = useState("");
  const [resubmitSuccess, setResubmitSuccess] = useState(false);

  const [isFetchingAttachment, setIsFetchingAttachment] = useState(false);
  const [attachmentError, setAttachmentError] = useState("");

  const submissions: SubmissionItem[] = useMemo(
    () =>
      rawSubmissions.map((note) => ({
        id: note.id,
        title: note.title,
        hours: note.hours_awarded ?? 0,
        status: mapStatus(note.status),
        feedback: note.flag_reason || undefined,
        hasAttachment: Boolean(note.feedback_attachment_key),
      })),
    [rawSubmissions]
  );

  const filteredSubmissions = submissions.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = useMemo(() => {
    const totalSubmissions = submissions.length;
    const hoursEarned = submissions
      .filter((s) => s.status === "Accepted")
      .reduce((sum, s) => sum + s.hours, 0);
    const pendingSubmissions = submissions.filter((s) => s.status === "Pending").length;
    return { totalSubmissions, hoursEarned, pendingSubmissions };
  }, [submissions]);

  async function handleUnsave(savedRowId: string, noteId: string) {
    setSavedNotes((prev) => prev.filter((s) => s.id !== savedRowId));

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("saved_notes").delete().eq("user_id", user.id).eq("note_id", noteId);
  }

  function closeModal() {
    setSelectedSubmission(null);
    setResubmitFile(null);
    setResubmitError("");
    setResubmitSuccess(false);
    setAttachmentError("");
  }

  async function handleViewAttachment() {
    if (!selectedSubmission) return;
    setAttachmentError("");
    setIsFetchingAttachment(true);
    try {
      const url = await getFeedbackAttachmentUrlAction(selectedSubmission.id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Couldn't load the attachment.";
      setAttachmentError(message);
    } finally {
      setIsFetchingAttachment(false);
    }
  }

  async function handleResubmit() {
    if (!selectedSubmission || !resubmitFile) return;

    if (!isAllowedFileType(resubmitFile.type || "application/pdf")) {
      setResubmitError("Unsupported file format. Please upload a PDF, DOCX, PPTX, PNG, or JPG.");
      return;
    }
    if (!isAllowedFileSize(resubmitFile.size)) {
      setResubmitError("File exceeds the 25MB limit.");
      return;
    }

    setResubmitError("");
    setIsResubmitting(true);

    try {
      const presignRes = await fetch("/api/notes/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: resubmitFile.name,
          fileType: resubmitFile.type || "application/pdf",
          fileSize: resubmitFile.size,
        }),
      });

      const presignData = await presignRes.json();
      if (!presignRes.ok) {
        throw new Error(presignData.error || "Failed to generate storage authorization.");
      }

      const { uploadUrl, fileKey } = presignData;

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": resubmitFile.type || "application/pdf" },
        body: resubmitFile,
      });

      if (!uploadRes.ok) {
        throw new Error("Direct file upload to storage failed. Please check your connection.");
      }

      await resubmitNoteAction(
        selectedSubmission.id,
        fileKey,
        resubmitFile.size,
        resubmitFile.type || "application/pdf"
      );

      setResubmitSuccess(true);
      setResubmitFile(null);
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong resubmitting your file.";
      setResubmitError(message);
    } finally {
      setIsResubmitting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="w-full min-h-[calc(100vh-80px)] py-12 px-6 lg:px-12 flex flex-col items-center"
    >
      <div className="w-full max-w-7xl mx-auto flex flex-col gap-10">
        
        <div 
          className="w-full bg-white p-8 sm:p-14 lg:p-16 rounded-3xl shadow-xl border border-brand-red/15 relative overflow-hidden"
          style={notebookStyle}
        >
          <div className="absolute top-0 bottom-0 left-16 sm:left-20 w-[2px] bg-[#a83142]/25 pointer-events-none z-0" />
          <div className="absolute top-0 left-0 bottom-0 w-10 sm:w-16 bg-gradient-to-r from-black/[0.04] to-transparent pointer-events-none z-10" />

          <div className="relative z-20 pl-8 sm:pl-12">

            <div className="mb-10 border-b border-gray-200/80 pb-6">
              <span className="text-xs font-mono uppercase tracking-[0.3em] text-brand-red font-bold">
                uOttawa // Student Portal
              </span>
              <h1 className="text-4xl font-black tracking-tight font-sans text-gray-900 mt-1">
                Dashboard
              </h1>
            </div>

            <div className="mb-12">
              <div className="flex items-center gap-2 mb-5">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-red animate-pulse" />
                <h2 className="text-xl font-bold font-logo text-brand-red tracking-wide">Statistics Overview</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white/90 backdrop-blur-xs border border-brand-red/20 rounded-2xl p-6 text-center shadow-xs">
                  <p className="text-4xl font-black text-gray-900 mb-1 font-sans">{stats.totalSubmissions}</p>
                  <p className="text-xs font-mono uppercase tracking-wider text-gray-500 font-bold">Total Submissions</p>
                </div>
                <div className="bg-white/90 backdrop-blur-xs border border-brand-red/20 rounded-2xl p-6 text-center shadow-xs">
                  <p className="text-4xl font-black text-gray-900 mb-1 font-sans">{stats.hoursEarned}</p>
                  <p className="text-xs font-mono uppercase tracking-wider text-gray-500 font-bold">Hours Earned</p>
                </div>
                <div className="bg-white/90 backdrop-blur-xs border border-brand-red/20 rounded-2xl p-6 text-center shadow-xs">
                  <p className="text-4xl font-black text-gray-900 mb-1 font-sans">{stats.pendingSubmissions}</p>
                  <p className="text-xs font-mono uppercase tracking-wider text-gray-500 font-bold">Pending Submissions</p>
                </div>
              </div>

              <div className="mt-8 flex justify-center">
                <Link
                  href="/submit"
                  className="inline-flex items-center gap-2.5 px-8 py-4 bg-brand-red text-white text-xs font-mono font-bold uppercase tracking-widest rounded-xl hover:bg-brand-red-hover transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <FileUp className="w-4 h-4" />
                  Submit New Notes
                </Link>
              </div>
            </div>

            <div className="mb-12">
              <div className="flex items-center gap-2 mb-6">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-red animate-pulse" />
                <h2 className="text-xl font-bold font-logo text-brand-red tracking-wide">My Submissions</h2>
              </div>

              <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center gap-4 mb-4">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search note titles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-sans focus:outline-none focus:border-brand-red/50 transition-colors shadow-xs"
                  />
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50/80 text-[11px] font-mono font-bold uppercase tracking-wider text-gray-500">
                        <th className="py-4 px-6">Note Title</th>
                        <th className="py-4 px-6 text-center">Hours</th>
                        <th className="py-4 px-6 text-center">Status</th>
                        <th className="py-4 px-6 text-right">Feedback</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm font-sans text-gray-700">
                      {filteredSubmissions.length > 0 ? (
                        filteredSubmissions.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                            <td className="py-4 px-6 font-semibold text-gray-900">{item.title}</td>
                            <td className="py-4 px-6 text-center font-mono text-xs">{item.hours} hrs</td>
                            <td className="py-4 px-6 text-center">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider ${
                                item.status === "Accepted" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                                item.status === "Pending" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                                item.status === "Changes Requested" ? "bg-orange-50 text-orange-700 border border-orange-200" :
                                item.status === "Flagged" ? "bg-purple-50 text-purple-700 border border-purple-200" :
                                "bg-rose-50 text-rose-700 border border-rose-200"
                              }`}>
                                {item.status === "Accepted" && <CheckCircle2 className="w-3.5 h-3.5" />}
                                {item.status === "Pending" && <Clock className="w-3.5 h-3.5" />}
                                {item.status === "Changes Requested" && <RotateCcw className="w-3.5 h-3.5" />}
                                {item.status === "Flagged" && <Flag className="w-3.5 h-3.5" />}
                                {item.status === "Rejected" && <XCircle className="w-3.5 h-3.5" />}
                                {item.status}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right">
                              {item.feedback ? (
                                <button
                                  onClick={() => setSelectedSubmission(item)}
                                  className={`inline-flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                                    item.status === "Changes Requested"
                                      ? "text-orange-700 bg-orange-100 hover:bg-orange-600 hover:text-white"
                                      : "text-brand-red bg-brand-red/10 hover:bg-brand-red hover:text-white"
                                  }`}
                                >
                                  <MessageSquareText className="w-3.5 h-3.5" />
                                  {item.status === "Changes Requested" ? "View & Resubmit" : "View Feedback"}
                                </button>
                              ) : (
                                <span className="text-gray-400 font-mono text-xs">N/A</span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-12 text-center text-gray-500 font-light">
                            {rawSubmissions.length === 0
                              ? "You haven't submitted any notes yet."
                              : "No submissions found matching your search."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Saved Notes Section */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-red animate-pulse" />
                <h2 className="text-xl font-bold font-logo text-brand-red tracking-wide">Saved Notes</h2>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50/80 text-[11px] font-mono font-bold uppercase tracking-wider text-gray-500">
                        <th className="py-4 px-6">Note Title</th>
                        <th className="py-4 px-6">Course</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm font-sans text-gray-700">
                      {savedNotes.length > 0 ? (
                        savedNotes.map((saved) => {
                          const note = Array.isArray(saved.notes) ? saved.notes[0] : saved.notes;
                          if (!note) return null;
                          return (
                            <tr key={saved.id} className="hover:bg-gray-50/60 transition-colors">
                              <td className="py-4 px-6 font-semibold text-gray-900">{note.title}</td>
                              <td className="py-4 px-6 font-mono text-xs text-brand-red font-bold">{note.course_code}</td>
                              <td className="py-4 px-6 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Link
                                    href={`/notes/view/${note.id}`}
                                    className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-brand-red bg-brand-red/10 hover:bg-brand-red hover:text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    View
                                  </Link>
                                  <button
                                    onClick={() => handleUnsave(saved.id, note.id)}
                                    className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-gray-500 bg-gray-100 hover:bg-rose-100 hover:text-rose-600 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Remove
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={3} className="py-12 text-center text-gray-500 font-light">
                            <div className="flex flex-col items-center gap-2">
                              <Bookmark className="w-6 h-6 text-gray-300" />
                              You haven&apos;t saved any notes yet.
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      <AnimatePresence>
        {selectedSubmission && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-white p-8 rounded-3xl shadow-2xl max-w-lg w-full border border-brand-red/15 relative overflow-hidden"
            >
              <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-brand-red font-bold">
                    {selectedSubmission.status === "Changes Requested" ? "Fixes Requested" : "Review Notes"}
                  </span>
                  <h3 className="text-xl font-bold font-logo text-gray-900 mt-0.5">{selectedSubmission.title}</h3>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-brand-red hover:text-white transition-colors cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-xs font-mono uppercase tracking-wider text-gray-400 font-bold mb-2">
                  {selectedSubmission.status === "Changes Requested" ? "What needs to be fixed:" : "Reviewer Feedback Comment:"}
                </p>
                <div className={`p-5 rounded-2xl text-sm leading-relaxed font-sans border ${
                  selectedSubmission.status === "Changes Requested"
                    ? "bg-orange-50/60 border-orange-200 text-orange-950"
                    : "bg-[#FFF0F0]/60 border-brand-red/20 text-gray-800"
                }`}>
                  {selectedSubmission.feedback}
                </div>
                {selectedSubmission.hasAttachment && (
                  <div className="mt-3 flex flex-col gap-2">
                    <button
                      onClick={handleViewAttachment}
                      disabled={isFetchingAttachment}
                      className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer w-fit disabled:opacity-50"
                    >
                      {isFetchingAttachment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Paperclip className="w-3.5 h-3.5" />}
                      {isFetchingAttachment ? "Loading..." : "View Reviewer's Attachment"}
                    </button>
                    {attachmentError && (
                      <div className="p-2.5 bg-red-50 text-red-600 text-[11px] font-mono font-bold uppercase tracking-wider rounded-lg border border-red-200 text-center">
                        {attachmentError}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {selectedSubmission.status === "Changes Requested" && (
                <div className="mb-6 flex flex-col gap-3">
                  {resubmitSuccess ? (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      Fixed file uploaded — it&apos;s back in the review queue.
                    </div>
                  ) : (
                    <>
                      <label className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                        <UploadCloud className="w-4 h-4 text-gray-400" />
                        Upload your corrected file
                      </label>
                      <input
                        type="file"
                        accept={ALLOWED_FILE_EXTENSIONS}
                        onChange={(e) => setResubmitFile(e.target.files?.[0] ?? null)}
                        className="w-full text-xs font-sans text-gray-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-mono file:font-bold file:uppercase file:tracking-wider file:bg-orange-100 file:text-orange-700 hover:file:bg-orange-200 file:cursor-pointer cursor-pointer border border-gray-200 rounded-xl"
                      />
                      {resubmitError && (
                        <div className="p-3 bg-red-50 text-red-600 text-[11px] font-mono font-bold uppercase tracking-wider rounded-lg border border-red-200 text-center">
                          {resubmitError}
                        </div>
                      )}
                      <button
                        onClick={handleResubmit}
                        disabled={!resubmitFile || isResubmitting}
                        className="w-full py-3.5 bg-orange-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-orange-700 transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isResubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                        {isResubmitting ? "Uploading..." : "Resubmit Fixed File"}
                      </button>
                    </>
                  )}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={closeModal}
                  className="px-6 py-2.5 bg-brand-red text-white text-xs font-mono font-bold uppercase tracking-wider rounded-xl hover:bg-brand-red-hover transition-all cursor-pointer shadow-sm"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}