"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { releaseNoteLockAction } from "@/app/admin/queue/actions";

export function PdfViewer({
  documentId,
  title,
  fileUrl,
  readOnly = false,
  claimedByCaller = false,
  claimedByOtherEmail = null,
}: {
  documentId: string;
  title: string;
  fileUrl: string;
  readOnly?: boolean;
  // Whether the CURRENT admin has this note claimed. Only they can
  // release the lock — viewing the note never claims it anymore, so
  // this has to be passed in explicitly rather than assumed.
  claimedByCaller?: boolean;
  // Set when someone else has this note claimed, so we can say who
  // without blocking the view itself.
  claimedByOtherEmail?: string | null;
}) {
  const [isReleasing, setIsReleasing] = useState(false);
  const router = useRouter();

  // Only someone who actually holds the claim has anything to release.
  // Everyone else (read-only changes_requested view, or just browsing
  // an unclaimed/someone-else's-claimed note) simply navigates back.
  const canRelease = !readOnly && claimedByCaller;

  const handleRelease = async () => {
    if (isReleasing) return;

    if (!canRelease) {
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
          {isReleasing ? "Releasing…" : canRelease ? "Release & return to queue" : "Back to queue"}
        </button>
        <div className="flex items-center gap-2">
          {readOnly ? (
            <span className="text-[11px] font-medium text-orange-300 bg-orange-500/10 px-2.5 py-1 rounded-full">
              Read-only · awaiting student fixes
            </span>
          ) : claimedByCaller ? (
            <span className="text-[11px] font-medium text-blue-300 bg-blue-500/10 px-2.5 py-1 rounded-full">
              Claimed for review
            </span>
          ) : claimedByOtherEmail ? (
            <span className="text-[11px] font-medium text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-full">
              Claimed by {claimedByOtherEmail}
            </span>
          ) : (
            <span className="text-[11px] font-medium text-gray-300 bg-white/5 px-2.5 py-1 rounded-full">
              Viewing · not claimed
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