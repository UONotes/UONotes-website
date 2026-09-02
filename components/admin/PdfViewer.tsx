"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { releaseNoteLockAction, claimNoteAction } from "@/app/admin/queue/actions";

export function PdfViewer({ 
  documentId, 
  title, 
  fileUrl 
}: { 
  documentId: string; 
  title: string;
  fileUrl: string; 
}) {
  const [isReleasing, setIsReleasing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    claimNoteAction(documentId).catch((err) => {
      console.error("Failed to claim note:", err);
    });
  }, [documentId]);

  const handleRelease = async () => {
    if (isReleasing) return;
    setIsReleasing(true);
    
    try {
      await releaseNoteLockAction(documentId);
      router.push("/admin/queue");
      router.refresh(); 
    } catch (err) {
      console.error("Failed to release lock:", err);
      setIsReleasing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#525659] text-white overflow-hidden select-none">
      <div className="px-6 py-4 border-b border-gray-800/80 flex items-center justify-between bg-gray-900/90 backdrop-blur-md z-10">
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
      
      <div className="flex-1 w-full h-full relative bg-[#525659]">
        <iframe
          src={`${fileUrl}#view=FitH`}
          className="w-full h-full border-0 absolute inset-0"
          title={title}
          allow="autoplay; fullscreen"
        />
      </div>
    </div>
  );
}