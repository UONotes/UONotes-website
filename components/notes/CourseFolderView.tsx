"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Folder, FileText, Bookmark, ArrowLeft, Search, Flag } from "lucide-react";
import { ReportModal } from "@/components/notes/ReportModal";

const notebookStyle = {
  backgroundImage: `
    linear-gradient(90deg, transparent 64px, rgba(168, 49, 66, 0.15) 64px, rgba(168, 49, 66, 0.15) 66px, transparent 66px),
    linear-gradient(transparent 31px, #e5e7eb 32px)
  `,
  backgroundSize: "100% 100%, 100% 32px",
};

interface NoteItem {
  id: string;
  title: string;
  courseCode: string;
  pdfUrl: string;
}

const mockCourseNotes: Record<string, NoteItem[]> = {
  "CSI2110": [
    { id: "1", title: "Midterm Comprehensive Guide", courseCode: "CSI2110", pdfUrl: "/notes/csi2110-midterm.pdf" },
    { id: "2", title: "Binary Trees & Graphs Summary", courseCode: "CSI2110", pdfUrl: "/notes/csi2110-trees.pdf" },
    { id: "3", title: "Final Exam Cheat Sheet", courseCode: "CSI2110", pdfUrl: "/notes/csi2110-final.pdf" },
    { id: "4", title: "Week 1-4 Lecture Notes", courseCode: "CSI2110", pdfUrl: "/notes/csi2110-w1-4.pdf" },
  ]
};

export function CourseFolderView({ courseCode }: { courseCode: string }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [reportNote, setReportNote] = useState<NoteItem | null>(null);

  const notes = mockCourseNotes[courseCode] || [
    { id: "1", title: "Midterm Summary Notes", courseCode: courseCode, pdfUrl: "#" },
    { id: "2", title: "Final Review Sheet", courseCode: courseCode, pdfUrl: "#" },
  ];

  const filteredNotes = notes.filter(n => n.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="w-full min-h-[calc(100vh-60px)] py-4 sm:py-12 px-3 sm:px-6 lg:px-12 flex flex-col items-center bg-gray-50/50 overflow-hidden"
    >
      <div className="w-full max-w-[1600px] mx-auto">
        
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
          <div className="relative z-20 pl-6 sm:pl-10 lg:pl-16 w-full flex flex-col gap-5 sm:gap-8">

            {/* Back Button */}
            <div>
              <Link href="/notes" className="inline-flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-mono font-bold text-brand-red hover:underline bg-brand-red/5 sm:bg-transparent px-2 sm:px-0 py-1 sm:py-0 rounded-md sm:rounded-none w-fit transition-colors">
                <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Back to Global Database
              </Link>
            </div>

            {/* ==========================================
                HEADER & MOBILE-OPTIMIZED SEARCH
            ========================================== */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 sm:gap-6 border-b border-gray-200/80 pb-5 sm:pb-6">
              
              <div className="flex items-start sm:items-center gap-4 sm:gap-5">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-brand-red/10 text-brand-red flex items-center justify-center shrink-0">
                  <Folder className="w-6 h-6 sm:w-8 sm:h-8 fill-brand-red/20" />
                </div>
                <div>
                  <span className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.3em] text-brand-red font-bold block mb-1">
                    Course Folder
                  </span>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight font-sans text-gray-900 leading-none">
                    {courseCode}
                  </h1>
                  <p className="text-[10px] sm:text-xs text-gray-500 font-mono mt-1.5 sm:mt-2">
                    {notes.length} verified documents
                  </p>
                </div>
              </div>

              {/* Search Bar - Full width on mobile, constrained on desktop */}
              <div className="relative w-full lg:w-72 shrink-0">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search this folder..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-sans focus:outline-none focus:border-brand-red/50 transition-colors shadow-xs"
                />
              </div>
            </div>

            {/* ==========================================
                DOCUMENT GRID (Mobile Responsive Cards)
            ========================================== */}
            <div className="pb-8">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                transition={{ duration: 0.4 }}
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6"
              >
                {filteredNotes.length > 0 ? (
                  filteredNotes.map((note) => (
                    <div key={note.id} className="bg-white border border-brand-red/20 rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between gap-5 sm:gap-6 group">
                      
                      {/* Thumbnail Placeholder */}
                      <Link href={`/notes/view/${note.id}`} className="h-32 sm:h-36 bg-gray-50 rounded-lg sm:rounded-xl border border-gray-100 flex flex-col items-center justify-center text-gray-400 relative overflow-hidden group-hover:bg-brand-red/[0.02] transition-colors cursor-pointer">
                        <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-brand-red/40 mb-2 group-hover:scale-110 group-hover:text-brand-red transition-all" />
                        <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-wider text-gray-400 group-hover:text-brand-red/80 transition-colors">
                          PDF Preview
                        </span>
                      </Link>

                      <div>
                        <Link href={`/notes/view/${note.id}`}>
                          <h3 className="font-bold text-gray-900 font-sans text-sm sm:text-base mb-1 line-clamp-1 group-hover:text-brand-red transition-colors cursor-pointer">
                            {note.title}
                          </h3>
                        </Link>
                        <p className="text-[10px] sm:text-xs font-mono text-brand-red font-semibold">{note.courseCode}</p>
                      </div>

                      {/* Actions - Thumb optimized */}
                      <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-100">
                        <Link
                          href={`/notes/view/${note.id}`}
                          className="flex-1 py-2 sm:py-2.5 px-3 bg-brand-red text-white text-center text-[10px] sm:text-xs font-mono font-bold rounded-lg sm:rounded-xl hover:bg-brand-red-hover transition-colors shadow-xs"
                        >
                          View PDF
                        </Link>
                        <button
                          onClick={() => alert("Note saved to bookmarks!")}
                          className="shrink-0 p-2 sm:p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg sm:rounded-xl border border-gray-200 transition-colors cursor-pointer"
                          title="Save note"
                        >
                          <Bookmark className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          onClick={() => setReportNote(note)}
                          className="shrink-0 p-2 sm:p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg sm:rounded-xl border border-rose-200 transition-colors cursor-pointer"
                          title="Report document"
                        >
                          <Flag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-12 text-center flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl">
                    <Search className="w-8 h-8 text-gray-300 mb-3" />
                    <p className="text-sm text-gray-500 font-medium">No documents found matching &quot;{searchQuery}&quot;</p>
                    <button onClick={() => setSearchQuery("")} className="mt-2 text-xs font-mono font-bold text-brand-red hover:underline">Clear search</button>
                  </div>
                )}
              </motion.div>
            </div>

          </div>
        </div>

      </div>

      {/* Report Modal Integration */}
      {reportNote && (
        <ReportModal
          isOpen={!!reportNote}
          onClose={() => setReportNote(null)}
          documentTitle={reportNote.title}
        />
      )}
    </motion.div>
  );
}