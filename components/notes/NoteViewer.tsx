"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Download, Bookmark, Flag, Loader2 } from "lucide-react";
import { ReportModal } from "@/components/notes/ReportModal";

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

// Expecting the correct props from the server page
export function NoteViewer({ note, fileUrl }: { note: any; fileUrl: string }) {
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  // The guard that caught the error - it will safely pass now!
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
      className="w-full min-h-[calc(100vh-60px)] py-4 sm:py-12 px-3 sm:px-6 lg:px-12 flex flex-col items-center bg-gray-50/50 overflow-hidden"
    >
      <div className="w-full max-w-5xl mx-auto flex flex-col gap-8">
        <div 
          className="w-full bg-white p-3 sm:p-10 lg:p-12 rounded-2xl sm:rounded-[2rem] shadow-xl border border-brand-red/15 relative overflow-hidden"
          style={notebookStyle}
        >
          <div className="absolute top-0 bottom-0 left-6 sm:left-16 lg:left-20 w-[2px] bg-[#a83142]/25 pointer-events-none z-0" />
          <div className="absolute top-0 left-0 bottom-0 w-4 sm:w-12 lg:w-16 bg-gradient-to-r from-black/[0.04] to-transparent pointer-events-none z-10" />

          <div className="relative z-20 pl-6 sm:pl-10 lg:pl-16">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 sm:gap-6 mb-6 sm:mb-8 border-b border-gray-200/80 pb-5 sm:pb-6">
              
              <div className="w-full lg:w-auto">
                <nav className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-4">
                  <Link 
                    href="/notes" 
                    className="inline-flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-mono font-bold text-gray-500 hover:text-brand-red transition-colors bg-gray-100 sm:bg-transparent px-2 sm:px-0 py-1 sm:py-0 rounded-md sm:rounded-none uppercase tracking-wider"
                  >
                    <ArrowLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Database
                  </Link>
                  <span className="text-gray-300 font-mono text-[10px] sm:text-xs">/</span>
                  <Link 
                    href={`/notes/${note.course_code}`} 
                    className="inline-flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-mono font-bold text-brand-red hover:underline bg-brand-red/5 sm:bg-transparent px-2 sm:px-0 py-1 sm:py-0 rounded-md sm:rounded-none uppercase tracking-wider"
                  >
                    {note.course_code} Folder
                  </Link>
                </nav>

                <span className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.3em] text-brand-red font-bold block mt-1">
                  {note.course_code} // {note.course_name || "Course Notes"}
                </span>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight font-sans text-gray-900 mt-1.5">
                  {note.title}
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full lg:w-auto">
                <button
                  onClick={() => setIsReportOpen(true)}
                  className="flex-1 lg:flex-none inline-flex justify-center items-center gap-1.5 px-3 sm:px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] sm:text-xs font-mono font-bold uppercase rounded-xl border border-rose-200 transition-colors cursor-pointer"
                >
                  <Flag className="w-3.5 h-3.5" /> Report
                </button>
                <button
                  className="shrink-0 p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl border border-gray-200 transition-colors cursor-pointer"
                  title="Bookmark"
                >
                  <Bookmark className="w-4 h-4 sm:w-4 sm:h-4" />
                </button>
                <a
                  href={fileUrl}
                  download={`${note.course_code}_${note.title}.pdf`}
                  className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-5 py-3 sm:py-2.5 bg-brand-red text-white text-[10px] sm:text-xs font-mono font-bold uppercase rounded-xl hover:bg-red-800 transition-all shadow-sm cursor-pointer mt-1 sm:mt-0"
                >
                  <Download className="w-4 h-4" /> Download PDF
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-xl sm:rounded-2xl border border-gray-100 mb-6 sm:mb-8 text-[10px] sm:text-xs font-mono shadow-sm">
              <div className="bg-white sm:bg-transparent p-2 sm:p-0 rounded-lg sm:rounded-none border sm:border-0 border-gray-100 lg:border-r border-gray-200">
                <span className="text-gray-400 block uppercase mb-0.5 font-bold tracking-wider">Author</span>
                <span className="font-semibold text-gray-800 break-all sm:break-normal truncate block" title={note.author_email || "Anonymous"}>
                  {note.author_email || "Anonymous"}
                </span>
              </div>
              <div className="bg-white sm:bg-transparent p-2 sm:p-0 rounded-lg sm:rounded-none border sm:border-0 border-gray-100 lg:border-r border-gray-200 lg:pl-4">
                <span className="text-gray-400 block uppercase mb-0.5 font-bold tracking-wider">Uploaded</span>
                <span className="font-semibold text-gray-800">
                  {new Date(note.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="bg-white sm:bg-transparent p-2 sm:p-0 rounded-lg sm:rounded-none border sm:border-0 border-gray-100 lg:border-r border-gray-200 lg:pl-4">
                <span className="text-gray-400 block uppercase mb-0.5 font-bold tracking-wider">Payload Size</span>
                <span className="font-semibold text-gray-800">{formatBytes(note.file_size)}</span>
              </div>
              <div className="bg-white sm:bg-transparent p-2 sm:p-0 rounded-lg sm:rounded-none border sm:border-0 border-gray-100 lg:pl-4">
                <span className="text-gray-400 block uppercase mb-0.5 font-bold tracking-wider">Format</span>
                <span className="font-semibold text-gray-800 uppercase">
                  {note.file_type?.split('/')[1] || "PDF"}
                </span>
              </div>
            </div>

            <div className="w-full h-[60vh] sm:h-[80vh] bg-[#525659] rounded-xl sm:rounded-2xl border border-gray-300 shadow-inner relative overflow-hidden">
              {!iframeLoaded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-gray-100 z-10 text-center">
                  <Loader2 className="w-8 h-8 text-brand-red animate-spin mb-4" />
                  <p className="text-xs text-gray-500 font-mono">Loading secure document stream...</p>
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
      />
    </motion.div>
  );
}