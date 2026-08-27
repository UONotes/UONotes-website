"use client";

import { Info } from "lucide-react";

type NoteMeta = { title: string; courseCode: string; uploaderEmail: string; pages: number; };

export function DocumentMetadata({ note }: { note: NoteMeta }) {
  return (
    <div className="p-5 sm:p-6 border-b border-gray-100">
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 mb-4 rounded-md bg-blue-50 text-blue-700 text-[10px] font-mono font-bold uppercase tracking-wider border border-blue-200/50">
        <Info className="w-3 h-3" /> Locked to you
      </div>
      <h2 className="text-lg sm:text-xl font-black text-gray-900 mb-1 leading-tight">{note.title}</h2>
      <p className="text-xs sm:text-sm font-mono font-bold text-brand-red mb-5">{note.courseCode}</p>
      
      <div className="space-y-2.5 text-[11px] sm:text-xs">
        <div className="flex justify-between border-b border-gray-50 pb-2.5">
          <span className="text-gray-500 font-mono uppercase tracking-wider">Uploader</span>
          <span className="font-semibold text-gray-900 truncate max-w-[150px]">{note.uploaderEmail}</span>
        </div>
        <div className="flex justify-between border-b border-gray-50 pb-2.5">
          <span className="text-gray-500 font-mono uppercase tracking-wider">Pages</span>
          <span className="font-semibold text-gray-900">{note.pages}</span>
        </div>
      </div>
    </div>
  );
}