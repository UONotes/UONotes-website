"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Search, X } from "lucide-react";
import { NoteCard } from "@/components/ui/NoteCard";
import { ReportModal } from "@/components/notes/ReportModal";

// Same "rubber stamp" lettering as the navbar
const STAMP_TEXT = "font-mono font-bold uppercase tracking-[0.16em]";
const STAMP_INK = "bg-brand-red shadow-[inset_0_0_0_2px_rgba(255,240,240,0.35)]";
const LABEL = `text-[11px] sm:text-xs text-brand-red ${STAMP_TEXT} tracking-[0.2em]`;

// Exact shape of a Note row matching the Supabase schema
export interface NoteItem {
  id: string;
  title: string;
  course_code: string;
  file_key: string;
  created_at?: string;
  author_name?: string | null;
  fileUrl?: string;
}

interface CourseFolderViewProps {
  courseCode: string;
  notes: NoteItem[];
}

export function CourseFolderView({ courseCode, notes }: CourseFolderViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [reportNote, setReportNote] = useState<NoteItem | null>(null);
  const code = courseCode.toUpperCase();

  // Newest first, then filtered by the search box
  const filteredNotes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return [...notes]
      .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))
      .filter((n) => n.title.toLowerCase().includes(query));
  }, [notes, searchQuery]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      // Centred, with the same space on both sides; on wide screens that space also clears the binder edge and lines up with the navbar logo
      className="w-full px-5 pb-20 pt-8 sm:px-8 sm:pt-12 lg:px-12 min-[1360px]:px-[var(--content-left)]"
    >
      <div className="mx-auto w-full max-w-[1440px]">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className={`flex items-center gap-2 text-[11px] sm:text-xs ${STAMP_TEXT}`}>
          <Link href="/notes" className="inline-flex items-center gap-1.5 text-gray-500 transition-colors hover:text-brand-red">
            <ArrowLeft className="h-3.5 w-3.5" /> All notes
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-brand-red">{code}</span>
        </nav>

        {/* Heading + search */}
        <header className="mt-6 flex flex-col gap-6 border-b-2 border-[#1f2a44] pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className={LABEL}>{"// Course folder"}</p>
            <h1 className="mt-3 text-5xl font-black leading-none tracking-[-0.045em] text-gray-900 sm:text-6xl lg:text-[4.5rem]">{code}</h1>
            <p className={`mt-3 text-[10px] text-gray-500 sm:text-[11px] ${STAMP_TEXT}`}>
              {notes.length} reviewed {notes.length === 1 ? "note" : "notes"}
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 lg:w-[22rem] lg:items-end">
            <label className="flex w-full items-center gap-3 border-2 border-brand-red bg-white px-4 transition-shadow focus-within:shadow-[0_0_0_4px_rgba(143,0,24,0.12)]">
              <Search className="h-4 w-4 shrink-0 text-brand-red" />
              <span className="sr-only">Search this folder</span>
              <input
                type="text"
                inputMode="search"
                placeholder="Search this folder..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full min-w-0 bg-transparent py-3 text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none"
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery("")} className="text-gray-400 hover:text-brand-red" aria-label="Clear search">
                  <X className="h-4 w-4" />
                </button>
              )}
            </label>
            <Link href="/submit" className={`text-[10px] text-brand-red hover:underline sm:text-[11px] ${STAMP_TEXT}`}>
              Took {code}? Share your notes &rarr;
            </Link>
          </div>
        </header>

        {/* Notes */}
        <div className="mt-8 grid grid-cols-2 gap-3.5 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4 min-[1700px]:grid-cols-5">
          {filteredNotes.length > 0 ? (
            filteredNotes.map((note) => (
              <NoteCard
                key={note.id}
                id={String(note.id)}
                title={note.title}
                course={note.course_code}
                fileUrl={note.fileUrl}
                author={note.author_name}
                date={note.created_at}
                onReport={() => setReportNote(note)}
              />
            ))
          ) : (
            <div className="col-span-full border-2 border-dashed border-brand-red/30 bg-white/60 px-6 py-14 text-center">
              <p className="text-lg font-black tracking-tight text-gray-900">
                {notes.length === 0 ? `No notes for ${code} yet.` : "Nothing matches that."}
              </p>
              <p className="mx-auto mt-1.5 max-w-sm text-sm text-gray-500">
                {notes.length === 0
                  ? "Be the first to share yours and help the next class out."
                  : `No notes in this folder match “${searchQuery.trim()}”.`}
              </p>
              <div className="mt-5 flex justify-center">
                {notes.length === 0 ? (
                  <Link href="/submit" className={`px-5 py-3 text-[11px] text-white ${STAMP_TEXT} ${STAMP_INK}`}>
                    Upload a note &uarr;
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className={`border-2 border-dashed border-brand-red px-4 py-2.5 text-[11px] text-brand-red transition-colors hover:border-solid hover:bg-brand-red hover:text-white ${STAMP_TEXT}`}
                  >
                    Clear search
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {reportNote && (
        <ReportModal
          isOpen={!!reportNote}
          onClose={() => setReportNote(null)}
          documentTitle={reportNote.title}
          noteId={reportNote.id}
        />
      )}
    </motion.div>
  );
}