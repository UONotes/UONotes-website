"use client";

import { useState } from "react";
import { ArrowLeft, FileText, Loader2 } from "lucide-react";
import { releaseNoteLockAction } from "@/app/admin/queue/actions";

export function PdfViewer({ documentId, title }: { documentId: string, title: string }) {
  const [isReleasing, setIsReleasing] = useState(false);

  const handleRelease = async () => {
    if (isReleasing) return;
    setIsReleasing(true);
    
    try {
      // 1. Force the server action to run and wait for it to finish completely
      await releaseNoteLockAction(documentId);
    } catch (err) {
      console.error("Failed to release lock:", err);
    } finally {
      // 2. Force clean window navigation to bypass router cache
      window.location.href = "/admin/queue";
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-950 text-white overflow-hidden select-none">
      <div className="px-6 py-4 border-b border-gray-800/80 flex items-center justify-between bg-gray-900/50 backdrop-blur-md">
        <button 
          type="button"
          disabled={isReleasing}
          onClick={handleRelease}
          className="inline-flex items-center gap-2 text-xs font-mono font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-wider group cursor-pointer border-0 bg-transparent disabled:opacity-50"
        >
          {isReleasing ? (
            <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
          ) : (
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          )}
          {isReleasing ? "Releasing Lock..." : "Release & Return to Queue"}
        </button>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-mono font-bold tracking-wider uppercase">
            Active Review Session
          </span>
          <span className="text-xs font-mono text-gray-500">REF: {documentId.slice(0, 8)}</span>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-y-auto bg-radial-[at_top] from-gray-900 via-gray-950 to-black">
        <div className="w-full max-w-3xl aspect-[1/1.3] bg-white rounded-2xl shadow-2xl flex flex-col items-center justify-center p-8 text-gray-800 border border-white/10 relative group">
          <div className="absolute top-6 left-6 flex items-center gap-2 text-gray-400">
            <FileText className="w-5 h-5 text-red-600" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-gray-500">PDF Document Stream</span>
          </div>

          <div className="text-center space-y-3 max-w-md">
            <div className="w-16 h-16 rounded-3xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto text-red-600 shadow-inner">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-lg text-gray-900 tracking-tight leading-snug">{title}</h3>
            <p className="text-xs text-gray-500 font-mono">Secure sandboxed view loaded via Supabase Storage object pipeline.</p>
          </div>

          <div className="absolute bottom-6 text-[11px] font-mono text-gray-400 bg-gray-50 px-3.5 py-1.5 rounded-full border border-gray-200/60 shadow-xs">
            Page 1 of 12 — Scroll to inspect content
          </div>
        </div>
      </div>
    </div>
  );
}