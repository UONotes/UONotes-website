"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Wrench } from "lucide-react";
import { claimNoteAction } from "@/app/admin/queue/actions";

export function ClaimGate({
  noteId,
  isBeingFixed = false,
  isFinalCheck = false,
  expiredHolderEmail = null,
}: {
  noteId: string;
  isBeingFixed?: boolean;
  isFinalCheck?: boolean;
  // Set when someone had this claimed but went inactive long enough for
  // their claim to lapse.
  expiredHolderEmail?: string | null;
}) {
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleClaim = async () => {
    if (isClaiming) return;
    setIsClaiming(true);
    setError("");

    try {
      await claimNoteAction(noteId);
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to claim this note.";
      setError(message);
      setIsClaiming(false);
    }
  };

  return (
    <div className="border-t border-brand-border-light p-5 sm:p-6 flex flex-col gap-4 shrink-0 bg-white">
      <div className="flex items-start gap-3 p-4 bg-slate-100 border border-slate-200 rounded-lg">
        <Lock className="w-4 h-4 text-slate-600 mt-0.5 shrink-0" />
        <p className="text-xs text-slate-900 leading-relaxed">
          {isFinalCheck ? (
            <>
              A director has reviewed this note and sent it to final check. Claim it to see their recommendation
              (and the original and fixed versions side by side, if they fixed it), then approve and publish it,
              deny it, or send it back to pending.
            </>
          ) : isBeingFixed ? (
            <>
              {expiredHolderEmail || "A director"} started fixing this note but hasn&apos;t finished within 3 days.
              You can take the fix over — download the original, correct it and upload the fixed version.
            </>
          ) : (
            <>
              {expiredHolderEmail && <>{expiredHolderEmail}&apos;s claim on this note expired after inactivity. </>}
              You&apos;re viewing this submission, but it isn&apos;t claimed yet. Claiming it locks it to you so no
              one else can review it at the same time. Other directors can still open and look through it. They
              just won&apos;t be able to act on it while you have it claimed.
            </>
          )}
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-xs font-medium rounded-lg border border-red-200">
          {error}
        </div>
      )}

      <button
        onClick={handleClaim}
        disabled={isClaiming}
        className="w-full py-3.5 bg-brand-red text-white text-sm font-semibold rounded-lg hover:bg-brand-red-hover transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {isClaiming ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isBeingFixed ? (
          <Wrench className="w-4 h-4" />
        ) : (
          <Lock className="w-4 h-4" />
        )}
        {isFinalCheck ? "Claim for final check" : isBeingFixed ? "Take over fixing" : "Claim for review"}
      </button>
    </div>
  );
}
