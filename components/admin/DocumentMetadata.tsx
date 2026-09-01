"use client";

import { User, FileDigit, Flag, ShieldCheck, Calendar, Globe, Hash, LayoutTemplate } from "lucide-react";

type NoteMeta = { 
  id: string;
  title: string; 
  courseCode: string; 
  uploaderEmail: string; 
  fileSize: number; 
  flagReason?: string | null;
  reporterEmail?: string | null;
  createdAt: string;
  language: string;
  noteTypes: string[];
};

function formatBytes(bytes: number) {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function DocumentMetadata({ note }: { note: NoteMeta }) {
  const hasFlag = Boolean(note.flagReason);
  const formattedDate = new Date(note.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
  });

  return (
    <div className="flex flex-col">
      {/* Top Banner */}
      <div className="bg-indigo-600 px-6 py-2.5 flex items-center justify-between text-white shadow-sm">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
          <ShieldCheck className="w-4 h-4 text-indigo-200" />
          Audit Sandbox Locked
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          <span className="text-[10px] font-mono font-medium text-indigo-200">System Active</span>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-8">
        
        {/* Header Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-gray-900 text-white text-[11px] font-mono font-bold tracking-widest uppercase">
              {note.courseCode}
            </span>
            <span className="px-2.5 py-1 rounded-md bg-gray-200/60 text-gray-600 text-[11px] font-mono font-bold uppercase border border-gray-200">
              <Globe className="w-3 h-3 inline-block mr-1 -mt-0.5" />
              {note.language}
            </span>
          </div>
          
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 leading-[1.15] tracking-tight">
            {note.title}
          </h2>

          {/* Dynamic Tags */}
          {note.noteTypes && note.noteTypes.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {note.noteTypes.map((type, i) => (
                <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100/80">
                  <LayoutTemplate className="w-3.5 h-3.5 opacity-60" />
                  {type}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Flag Alert */}
        {hasFlag && (
          <div className="relative overflow-hidden p-5 rounded-2xl bg-red-50 border border-red-200/60 shadow-sm">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-2xl" />
            <div className="flex items-center gap-2 text-red-800 text-[11px] font-black uppercase tracking-wider mb-2">
              <Flag className="w-4 h-4" /> Community Flag Report
            </div>
            <p className="text-sm text-red-950 font-medium leading-relaxed mb-3">
              &ldquo;{note.flagReason}&rdquo;
            </p>
            {note.reporterEmail && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-100/50 text-red-800 text-[10px] font-mono font-semibold border border-red-200/50">
                <User className="w-3 h-3" /> Reported by {note.reporterEmail}
              </div>
            )}
          </div>
        )}

        {/* System Telemetry Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-1">
            <div className="flex items-center gap-1.5 text-gray-400 text-[10px] font-black uppercase tracking-wider">
              <User className="w-3.5 h-3.5" /> Submitter
            </div>
            <p className="text-xs font-semibold text-gray-900 truncate" title={note.uploaderEmail}>
              {note.uploaderEmail}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-1">
            <div className="flex items-center gap-1.5 text-gray-400 text-[10px] font-black uppercase tracking-wider">
              <FileDigit className="w-3.5 h-3.5" /> Payload Size
            </div>
            <p className="text-xs font-mono font-semibold text-gray-900">
              {formatBytes(note.fileSize)}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-1">
            <div className="flex items-center gap-1.5 text-gray-400 text-[10px] font-black uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5" /> Uploaded At
            </div>
            <p className="text-xs font-semibold text-gray-900">
              {formattedDate}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-1">
            <div className="flex items-center gap-1.5 text-gray-400 text-[10px] font-black uppercase tracking-wider">
              <Hash className="w-3.5 h-3.5" /> System ID
            </div>
            <p className="text-[10px] font-mono font-medium text-gray-500 truncate">
              {note.id}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}