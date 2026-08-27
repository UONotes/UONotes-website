"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, FileText, Download, Bookmark, Flag } from "lucide-react";
import { ReportModal } from "@/components/notes/ReportModal";

const notebookStyle = {
  backgroundImage: `
    linear-gradient(90deg, transparent 64px, rgba(168, 49, 66, 0.15) 64px, rgba(168, 49, 66, 0.15) 66px, transparent 66px),
    linear-gradient(transparent 31px, #e5e7eb 32px)
  `,
  backgroundSize: "100% 100%, 100% 32px",
};

export function NoteViewer({ noteId }: { noteId: string }) {
  const [isReportOpen, setIsReportOpen] = useState(false);

  const note = {
    title: noteId === "2" ? "Binary Trees & Graphs Summary" : noteId === "3" ? "Final Exam Cheat Sheet" : "Midterm Comprehensive Guide",
    courseCode: "CSI2110",
    courseName: "Data Structures and Algorithms",
    author: "student@uottawa.ca",
    uploadedDate: "October 14, 2026",
    pages: 14,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="w-full min-h-[calc(100vh-60px)] py-4 sm:py-12 px-3 sm:px-6 lg:px-12 flex flex-col items-center bg-gray-50/50 overflow-hidden"
    >
      <div className="w-full max-w-5xl mx-auto flex flex-col gap-8">
        
        {/* ==========================================
            MASTER NOTEBOOK CONTAINER
        ========================================== */}
        <div 
          className="w-full bg-white p-3 sm:p-10 lg:p-12 rounded-2xl sm:rounded-[2rem] shadow-xl border border-brand-red/15 relative overflow-hidden"
          style={notebookStyle}
        >
          {/* Responsive Red Margin Line */}
          <div className="absolute top-0 bottom-0 left-6 sm:left-16 lg:left-20 w-[2px] bg-[#a83142]/25 pointer-events-none z-0" />
          
          {/* Responsive Notebook Spine Shadow */}
          <div className="absolute top-0 left-0 bottom-0 w-4 sm:w-12 lg:w-16 bg-gradient-to-r from-black/[0.04] to-transparent pointer-events-none z-10" />

          {/* Inner Layout Wrapper - Reclaims left padding on mobile */}
          <div className="relative z-20 pl-6 sm:pl-10 lg:pl-16">

            {/* ==========================================
                HEADER & MOBILE-OPTIMIZED ACTIONS
            ========================================== */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 sm:gap-6 mb-6 sm:mb-8 border-b border-gray-200/80 pb-5 sm:pb-6">
              
              <div className="w-full lg:w-auto">
                {/* 
                  BREADCRUMB NAVIGATION
                  Cleanly separates Global and Course-specific back options
                */}
                <nav className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-4">
                  <Link 
                    href="/notes" 
                    className="inline-flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-mono font-bold text-gray-500 hover:text-brand-red transition-colors bg-gray-100 sm:bg-transparent px-2 sm:px-0 py-1 sm:py-0 rounded-md sm:rounded-none uppercase tracking-wider"
                  >
                    <ArrowLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Database
                  </Link>
                  <span className="text-gray-300 font-mono text-[10px] sm:text-xs">/</span>
                  <Link 
                    href={`/notes/${note.courseCode}`} 
                    className="inline-flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-mono font-bold text-brand-red hover:underline bg-brand-red/5 sm:bg-transparent px-2 sm:px-0 py-1 sm:py-0 rounded-md sm:rounded-none uppercase tracking-wider"
                  >
                    {note.courseCode} Folder
                  </Link>
                </nav>

                <span className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.3em] text-brand-red font-bold block mt-1">
                  {note.courseCode} // {note.courseName}
                </span>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight font-sans text-gray-900 mt-1.5">
                  {note.title}
                </h1>
              </div>

              {/* Action Buttons - Wraps gracefully, Download expands on mobile */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full lg:w-auto">
                <button
                  onClick={() => setIsReportOpen(true)}
                  className="flex-1 lg:flex-none inline-flex justify-center items-center gap-1.5 px-3 sm:px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] sm:text-xs font-mono font-bold uppercase rounded-xl border border-rose-200 transition-colors cursor-pointer"
                >
                  <Flag className="w-3.5 h-3.5" /> Report
                </button>
                <button
                  onClick={() => alert("Note bookmarked!")}
                  className="shrink-0 p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl border border-gray-200 transition-colors cursor-pointer"
                  title="Bookmark"
                >
                  <Bookmark className="w-4 h-4 sm:w-4 sm:h-4" />
                </button>
                <button
                  onClick={() => alert("PDF downloaded successfully!")}
                  className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-5 py-3 sm:py-2.5 bg-brand-red text-white text-[10px] sm:text-xs font-mono font-bold uppercase rounded-xl hover:bg-brand-red-hover transition-all shadow-sm cursor-pointer mt-1 sm:mt-0"
                >
                  <Download className="w-4 h-4" /> Download PDF
                </button>
              </div>
            </div>

            {/* ==========================================
                DOCUMENT METADATA BAR
            ========================================== */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-xl sm:rounded-2xl border border-gray-100 mb-6 sm:mb-8 text-[10px] sm:text-xs font-mono">
              <div className="bg-white sm:bg-transparent p-2 sm:p-0 rounded-lg sm:rounded-none border sm:border-0 border-gray-100">
                <span className="text-gray-400 block uppercase mb-0.5">Author</span>
                <span className="font-semibold text-gray-800 break-all sm:break-normal">{note.author}</span>
              </div>
              <div className="bg-white sm:bg-transparent p-2 sm:p-0 rounded-lg sm:rounded-none border sm:border-0 border-gray-100">
                <span className="text-gray-400 block uppercase mb-0.5">Uploaded</span>
                <span className="font-semibold text-gray-800">{note.uploadedDate}</span>
              </div>
              <div className="bg-white sm:bg-transparent p-2 sm:p-0 rounded-lg sm:rounded-none border sm:border-0 border-gray-100">
                <span className="text-gray-400 block uppercase mb-0.5">Length</span>
                <span className="font-semibold text-gray-800">{note.pages} Pages</span>
              </div>
              <div className="bg-white sm:bg-transparent p-2 sm:p-0 rounded-lg sm:rounded-none border sm:border-0 border-gray-100">
                <span className="text-gray-400 block uppercase mb-0.5">Format</span>
                <span className="font-semibold text-gray-800">Searchable PDF</span>
              </div>
            </div>

            {/* ==========================================
                PDF VIEWER MOCK FRAME
            ========================================== */}
            <div className="w-full h-[400px] sm:h-[600px] bg-white rounded-xl sm:rounded-2xl border border-gray-300 shadow-inner flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 sm:p-8 text-center bg-gradient-to-b from-gray-50/50 to-white">
                <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-brand-red/30 mb-3 sm:mb-4 animate-bounce" />
                <h3 className="text-lg sm:text-xl font-bold font-sans text-gray-800 mb-1.5 sm:mb-2">PDF Document Viewer</h3>
                <p className="text-[11px] sm:text-xs text-gray-500 max-w-sm mb-4 sm:mb-6 px-4">
                  This document is securely hosted. You can download the full PDF above or inspect the pages directly.
                </p>
                <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-brand-red/10 text-brand-red rounded-full text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider">
                  ID: {noteId} - {note.courseCode}
                </span>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        documentTitle={note.title}
      />
    </motion.div>
  );
}