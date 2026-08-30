"use client";

import { User, BookOpen, Flag } from "lucide-react";

type NoteMeta = { 
  title: string; 
  courseCode: string; 
  uploaderEmail: string; 
  pages: number; 
  flagReason?: string | null;
  reporterEmail?: string | null;
};

export function DocumentMetadata({ note }: { note: NoteMeta }) {
  const hasFlag = Boolean(note.flagReason);

  return (
    <div className="p-6 sm:p-8 space-y-6 bg-white border-b border-gray-100">
      
      {/* SESSION SECURITY STATE BADGE */}
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-blue-50 text-blue-700 text-xs font-mono font-bold uppercase tracking-wider border border-blue-100/80 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
          Locked & Reserved to You
        </div>
        <span className="text-[10px] font-mono text-gray-400 uppercase">Secure Sandbox</span>
      </div>

      {/* TITLE & COURSE CODE */}
      <div className="space-y-2">
        <div className="inline-block px-3 py-1 rounded-xl bg-gray-900 text-white text-[11px] font-mono font-bold tracking-wider uppercase shadow-2xs">
          {note.courseCode}
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-gray-900 leading-snug tracking-tight">{note.title}</h2>
      </div>
      
      {/* COMMUNITY FLAG REPORT CARD */}
      {hasFlag && (
        <div className="relative overflow-hidden p-5 rounded-3xl bg-gradient-to-br from-purple-50/90 via-purple-50/40 to-white border border-purple-200/80 shadow-xs space-y-3">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-purple-800 text-xs font-mono font-bold uppercase tracking-wider">
              <div className="w-6 h-6 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700">
                <Flag className="w-3.5 h-3.5" />
              </div>
              Community Flag Report
            </div>
            {note.reporterEmail && (
              <span className="text-[10px] font-mono text-purple-700 bg-purple-100/80 px-2.5 py-1 rounded-lg border border-purple-200/50 font-semibold">
                Reported by: {note.reporterEmail}
              </span>
            )}
          </div>

          <p className="text-xs text-purple-950 font-medium leading-relaxed bg-white/90 p-3.5 rounded-2xl border border-purple-100/80 shadow-2xs">
            &ldquo;{note.flagReason}&rdquo;
          </p>
        </div>
      )}

      {/* METRICS & TELEMETRY GRID */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-100 space-y-1.5 transition-all hover:bg-gray-100/50">
          <div className="flex items-center gap-1.5 text-gray-400 text-[10px] font-mono font-bold uppercase tracking-wider">
            <User className="w-3.5 h-3.5 text-gray-500" /> Submitter
          </div>
          <p className="text-xs font-semibold text-gray-900 truncate" title={note.uploaderEmail}>
            {note.uploaderEmail}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-100 space-y-1.5 transition-all hover:bg-gray-100/50">
          <div className="flex items-center gap-1.5 text-gray-400 text-[10px] font-mono font-bold uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5 text-gray-500" /> Length
          </div>
          <p className="text-xs font-semibold text-gray-900">
            {note.pages} Page{note.pages !== 1 ? 's' : ''} verified
          </p>
        </div>
      </div>
    </div>
  );
}