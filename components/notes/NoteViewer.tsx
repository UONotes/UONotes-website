"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronRight, Download, Bookmark, Flag, Loader2, Languages, User, Calendar, HardDrive, FileType } from "lucide-react";import { ReportModal } from "@/components/notes/ReportModal";
import { SaveNoteButton } from "@/components/notes/SaveNoteButton";
import { formatDate } from "@/lib/dateFormat";

const notebookStyle = {
  backgroundImage: `
    linear-gradient(90deg, transparent 64px, rgba(168, 49, 66, 0.15) 64px, rgba(168, 49, 66, 0.15) 66px, transparent 66px),
    linear-gradient(transparent 31px, #e5e7eb 32px)
  `,
  backgroundSize: "100% 100%, 100% 32px",
};

function formatBytes(bytes: number) {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function NoteViewer({
  note,
  fileUrl,
  translationPair,
}: {
  note: any;
  fileUrl: string;
  translationPair: { id: string; title: string; language: string } | null;
}) {
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownload() {
    if (isDownloading) return;
    setIsDownloading(true);

    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `${note.course_code}_${note.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setIsDownloading(false);
    }
  }

  if (!note || !fileUrl) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="p-8 text-center font-mono text-gray-500 bg-white border border-gray-200 rounded-2xl shadow-sm">
          Error: Note data missing from server payload.
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="w-full min-h-[calc(100vh-60px)] py-4 sm:py-12 px-3 sm:px-6 lg:px-12 flex flex-col items-center overflow-hidden"
    >
      <div className="w-full max-w-5xl mx-auto flex flex-col gap-8">
        <div
          className="w-full bg-white p-3 sm:p-10 lg:p-12 rounded-2xl sm:rounded-[2rem] shadow-xl border border-brand-red/15 relative overflow-hidden"
          style={notebookStyle}
        >
          <div className="absolute top-0 bottom-0 left-6 sm:left-16 lg:left-20 w-[2px] bg-[#a83142]/25 pointer-events-none z-0" />
          <div className="absolute top-0 left-0 bottom-0 w-4 sm:w-12 lg:w-16 bg-gradient-to-r from-black/[0.04] to-transparent pointer-events-none z-10" />

          <div className="relative z-20 pl-6 sm:pl-10 lg:pl-16">

                       {/* Breadcrumb */}
            <nav className="inline-flex items-center gap-1 mb-5 bg-gray-50 border border-gray-100 rounded-full px-1.5 py-1 w-fit">
              <Link
                href="/notes"
                className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-mono font-bold text-gray-500 hover:text-brand-red hover:bg-white transition-colors uppercase tracking-wider"
              >
                <ArrowLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Database
              </Link>
              <ChevronRight className="w-3 h-3 text-gray-300 shrink-0" />
              <Link
                href={`/notes/${note.course_code}`}
                className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-mono font-bold text-brand-red bg-white shadow-xs uppercase tracking-wider hover:bg-brand-red hover:text-white hover:shadow-sm transition-colors"
              >
                {note.course_code} Folder
              </Link>
            </nav>

            {/* Title block + actions */}
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-8 pb-6 border-b border-gray-200/80">
              <div className="min-w-0">
                <span className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.3em] text-brand-red font-bold block">
                  {note.course_code} // {note.course_name || "Course Notes"}
                </span>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight font-sans text-gray-900 mt-1.5 leading-tight">
                  {note.title}
                </h1>

                {translationPair && (
                  <Link
                    href={`/notes/view/${translationPair.id}`}
                    className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-brand-red hover:underline"
                  >
                    <Languages className="w-3.5 h-3.5" />
                    {translationPair.language === "FR" ? "Voir en français" : "View in English"}
                  </Link>
                )}
              </div>

              {/* Actions — clear hierarchy: Download is primary, Save is a
                  secondary toggle, Report is quiet since it's rarely used */}
              <div className="flex items-center gap-2 shrink-0">
                <SaveNoteButton
                  noteId={note.id}
                  render={({ isSaved, isToggling, toggle }) => (
                    <button
                      onClick={toggle}
                      disabled={isToggling}
                      className={`p-3 rounded-xl border transition-colors cursor-pointer disabled:opacity-60 ${
                        isSaved
                          ? "bg-brand-red/10 text-brand-red border-brand-red/30 hover:bg-brand-red/20"
                          : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700"
                      }`}
                      title={isSaved ? "Remove from saved" : "Save"}
                    >
                      <Bookmark className="w-4 h-4" style={{ fill: isSaved ? "currentColor" : "none" }} />
                    </button>
                  )}
                />

                <button
                  onClick={() => setIsReportOpen(true)}
                  className="p-3 rounded-xl border border-gray-200 text-gray-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                  title="Report this document"
                >
                  <Flag className="w-4 h-4" />
                </button>

                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-brand-red text-white text-xs font-mono font-bold uppercase tracking-wider rounded-xl hover:bg-brand-red-hover transition-all shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {isDownloading ? "Preparing..." : "Download"}
                </button>
              </div>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 text-xs">
              <div className="flex items-start gap-2.5">
                <User className="w-4 h-4 text-gray-300 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-gray-400 uppercase tracking-wider text-[10px] font-bold mb-0.5">Author</p>
                  <p className="font-semibold text-gray-800 truncate" title={note.author_name || "Anonymous"}>
                    {note.author_name || "Anonymous"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Calendar className="w-4 h-4 text-gray-300 mt-0.5 shrink-0" />
                <div>
                  <p className="text-gray-400 uppercase tracking-wider text-[10px] font-bold mb-0.5">Uploaded</p>
                  <p className="font-semibold text-gray-800">{formatDate(note.created_at)}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <HardDrive className="w-4 h-4 text-gray-300 mt-0.5 shrink-0" />
                <div>
                  <p className="text-gray-400 uppercase tracking-wider text-[10px] font-bold mb-0.5">File Size</p>
                  <p className="font-semibold text-gray-800">{formatBytes(note.file_size)}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <FileType className="w-4 h-4 text-gray-300 mt-0.5 shrink-0" />
                <div>
                  <p className="text-gray-400 uppercase tracking-wider text-[10px] font-bold mb-0.5">Format</p>
                  <p className="font-semibold text-gray-800 uppercase">{note.file_type?.split("/")[1] || "PDF"}</p>
                </div>
              </div>
            </div>

            {/* PDF viewer */}
            <div className="w-full h-[60vh] sm:h-[80vh] bg-[#525659] rounded-xl sm:rounded-2xl border border-gray-300 shadow-inner relative overflow-hidden">
              {!iframeLoaded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-50 z-10">
                  <Loader2 className="w-6 h-6 text-brand-red animate-spin" />
                  <p className="text-xs text-gray-400 font-mono">Loading document...</p>
                </div>
              )}
              <iframe
                src={`${fileUrl}#view=FitH`}
                onLoad={() => setIframeLoaded(true)}
                className="w-full h-full border-0 absolute inset-0 z-20"
                title={note.title}
                allow="autoplay; fullscreen"
              />
            </div>
          </div>
        </div>
      </div>

      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        documentTitle={note.title}
        noteId={note.id}
      />
    </motion.div>
  );
}