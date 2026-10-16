"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Download, Bookmark, Flag, Loader2, Languages } from "lucide-react";
import { ReportModal } from "@/components/notes/ReportModal";
import { SaveNoteButton } from "@/components/notes/SaveNoteButton";
import { formatDate } from "@/lib/dateFormat";

// Same "rubber stamp" lettering as the navbar
const STAMP_TEXT = "font-mono font-bold uppercase tracking-[0.16em]";
const STAMP_INK = "bg-brand-red shadow-[inset_0_0_0_2px_rgba(255,240,240,0.35)]";

type ViewerNote = {
  id: string;
  title: string;
  course_code: string;
  course_name?: string | null;
  author_name?: string | null;
  created_at: string;
  file_size?: number | null;
  file_type?: string | null;
};

function formatBytes(bytes: number | null | undefined) {
  if (!bytes) return "—";
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
  note: ViewerNote;
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
      <div className="flex min-h-[60vh] w-full items-center justify-center p-6">
        <div className="border-2 border-dashed border-brand-red/30 bg-white p-8 text-center font-mono text-sm text-gray-500">
          Error: Note data missing from server payload.
        </div>
      </div>
    );
  }

  const facts = [
    { label: "Author", value: note.author_name || "Anonymous" },
    { label: "Uploaded", value: formatDate(note.created_at) },
    { label: "File size", value: formatBytes(note.file_size) },
    { label: "Format", value: (note.file_type?.split("/")[1] || "PDF").toUpperCase() },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full px-4 pb-20 pt-8 sm:px-8 sm:pt-12 lg:px-12"
    >
      <div className="mx-auto w-full max-w-5xl">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className={`flex flex-wrap items-center gap-2 text-[10px] sm:text-[11px] ${STAMP_TEXT}`}>
          <Link href="/notes" className="inline-flex items-center gap-1.5 text-gray-500 transition-colors hover:text-brand-red">
            <ArrowLeft className="h-3.5 w-3.5" /> All notes
          </Link>
          <span className="text-gray-300">/</span>
          <Link href={`/notes/${note.course_code}`} className="text-brand-red hover:underline">
            {note.course_code} folder
          </Link>
        </nav>

        {/* Title + actions */}
        <header className="mt-6 flex flex-col gap-6 border-b-2 border-[#1f2a44] pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <span className={`inline-block px-2 py-1 text-[10px] text-white sm:text-[11px] ${STAMP_TEXT} ${STAMP_INK}`}>{note.course_code}</span>
            {note.course_name && <span className="ml-3 text-sm text-gray-500">{note.course_name}</span>}
            <h1 className="mt-3 text-[1.75rem] font-black leading-[1.08] tracking-[-0.035em] text-gray-900 sm:text-4xl lg:text-[2.75rem]">
              {note.title}
            </h1>

            {translationPair && (
              <Link
                href={`/notes/view/${translationPair.id}`}
                className={`mt-3 inline-flex items-center gap-1.5 text-[10px] text-brand-red hover:underline sm:text-[11px] ${STAMP_TEXT}`}
              >
                <Languages className="h-3.5 w-3.5" />
                {translationPair.language === "FR" ? "Voir en français" : "View in English"}
              </Link>
            )}
          </div>

          {/* Download is the main action; Save is a toggle; Report stays quiet */}
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setIsReportOpen(true)}
              className="p-3 text-gray-400 transition-colors hover:text-brand-red"
              title="Report this note"
              aria-label="Report this note"
            >
              <Flag className="h-4 w-4" />
            </button>

            <SaveNoteButton
              noteId={note.id}
              render={({ isSaved, isToggling, toggle }) => (
                <button
                  type="button"
                  onClick={toggle}
                  disabled={isToggling}
                  aria-pressed={isSaved}
                  className={`inline-flex items-center gap-2 border-2 px-4 py-2.5 text-[11px] transition-colors disabled:opacity-60 ${STAMP_TEXT} ${
                    isSaved
                      ? "border-brand-red bg-brand-red/[0.07] text-brand-red"
                      : "border-dashed border-brand-red text-brand-red hover:border-solid"
                  }`}
                >
                  <Bookmark className="h-4 w-4" style={{ fill: isSaved ? "currentColor" : "none" }} />
                  {isSaved ? "Saved" : "Save"}
                </button>
              )}
            />

            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className={`inline-flex items-center gap-2 px-5 py-3 text-[11px] text-white transition-colors hover:bg-brand-red-hover disabled:cursor-not-allowed disabled:opacity-60 ${STAMP_TEXT} ${STAMP_INK}`}
            >
              {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {isDownloading ? "Preparing..." : "Download"}
            </button>
          </div>
        </header>

        {/* Details */}
        <dl className="mt-6 grid grid-cols-2 border-t-4 border-brand-red bg-white shadow-[0_14px_24px_-18px_rgba(0,0,0,0.45)] lg:grid-cols-4">
          {facts.map((fact, i) => (
            <div
              key={fact.label}
              className={`min-w-0 px-4 py-3.5 sm:px-5 ${i % 2 === 0 ? "border-r" : ""} ${i < 2 ? "border-b lg:border-b-0" : ""} ${
                i === 1 ? "lg:border-r" : ""
              } border-[#f0e3e5]`}
            >
              <dt className={`text-[9px] text-gray-400 sm:text-[10px] ${STAMP_TEXT}`}>{fact.label}</dt>
              <dd className="mt-1 truncate text-sm font-semibold text-gray-900" title={fact.value}>
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>

        {/* PDF */}
        <div className="relative mt-8 h-[65vh] w-full overflow-hidden border border-black/10 bg-[#525659] shadow-[0_22px_40px_-28px_rgba(0,0,0,0.5)] sm:h-[80vh]">
          {!iframeLoaded && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#fffdf8]">
              <Loader2 className="h-6 w-6 animate-spin text-brand-red" />
              <p className={`text-[10px] text-gray-400 ${STAMP_TEXT}`}>Loading document...</p>
            </div>
          )}
          <iframe
            src={`${fileUrl}#view=FitH`}
            onLoad={() => setIframeLoaded(true)}
            className="absolute inset-0 h-full w-full border-0"
            title={note.title}
            allow="autoplay; fullscreen"
          />
        </div>
      </div>

      <ReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} documentTitle={note.title} noteId={note.id} />
    </motion.div>
  );
}