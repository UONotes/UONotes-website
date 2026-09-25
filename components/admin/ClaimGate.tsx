"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import { claimNoteAction } from "@/app/admin/queue/actions";

export function ClaimGate({ noteId }: { noteId: string }) {
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
    <div className="border-t border-black/5 p-6 flex flex-col gap-4 shrink-0 bg-white">
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
        <Lock className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-900 leading-relaxed">
          You&apos;re viewing this submission, but it isn&apos;t claimed yet. Claiming it locks it to you
          so no one else can review it at the same time. Other admins can still open and look
          through it they just won&apos;t be able to act on it while you have it claimed.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-xs font-medium rounded-xl border border-red-200">
          {error}
        </div>
      )}

      <button
        onClick={handleClaim}
        disabled={isClaiming}
        className="w-full py-3.5 bg-[#23201D] text-white text-sm font-semibold rounded-xl hover:bg-black transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {isClaiming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
        Claim for review
      </button>
    </div>
  );
}