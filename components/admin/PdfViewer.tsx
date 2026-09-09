"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { releaseNoteLockAction, claimNoteAction } from "@/app/admin/queue/actions";

export function PdfViewer({ 
  documentId, 
  title, 
  fileUrl,
  readOnly = false,
}: { 
  documentId: string; 
  title: string;
  fileUrl: string; 
  readOnly?: boolean;
}) {
  const [isReleasing, setIsReleasing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (readOnly) return;
    claimNoteAction(documentId).catch((err) => {
      console.error("Failed to claim note:", err);
    });
  }, [documentId, readOnly]);

  const handleRelease = async () => {
    if (isReleasing) return;

    if (readOnly) {
      router.push("/admin/queue");
      return;
    }

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
    <div className="flex flex-col h-full bg-[#3D3A36] text-white overflow-hidden select-none">
      <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between bg-[#2A2825]/90 backdrop-blur-md z-10">
        <button 
          type="button"
          disabled={isReleasing}
          onClick={handleRelease}
          className="inline-flex items-center gap-2 text-xs font-medium text-gray-300 hover:text-white transition-colors group cursor-pointer border-0 bg-transparent disabled:opacity-50"
        >
          {isReleasing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          )}
          {isReleasing ? "Releasing…" : readOnly ? "Back to queue" : "Release & return to queue"}
        </button>
        <div className="flex items-center gap-2">
          {readOnly ? (
            <span className="text-[11px] font-medium text-orange-300 bg-orange-500/10 px-2.5 py-1 rounded-full">
              Read-only · awaiting student fixes
            </span>
          ) : (
            <span className="text-[11px] font-medium text-blue-300 bg-blue-500/10 px-2.5 py-1 rounded-full">
              Claimed for review
            </span>
          )}
        </div>
      </div>
      
      <div className="flex-1 w-full h-full relative bg-[#3D3A36]">
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