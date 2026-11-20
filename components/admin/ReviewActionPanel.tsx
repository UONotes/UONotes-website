"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendToFinalCheckAction, startFixesAction } from "@/app/admin/queue/actions";
import { Loader2, Send, ThumbsDown, Wrench } from "lucide-react";

interface ReviewActionPanelProps {
  noteId: string;
  currentHoursAwarded?: number | null;
  currentStatus?: string;
}

type Decision = "approve" | "reject" | "fix";

// A director's review. Nothing is published or rejected from here: every
// choice sends the note to VP Notes for a final check (fixing goes there
// too, once the corrected file is uploaded).
export function ReviewActionPanel({ noteId, currentHoursAwarded, currentStatus }: ReviewActionPanelProps) {
  const router = useRouter();
  const [feedback, setFeedback] = useState("");
  const [hoursInput, setHoursInput] = useState(
    currentHoursAwarded != null ? String(currentHoursAwarded) : "1"
  );
  const [isSubmitting, setIsSubmitting] = useState<Decision | null>(null);
  const [error, setError] = useState("");

  const isResolvingFlag = currentStatus === "flagged";

  const handleDecision = async (decision: Decision) => {
    if (decision === "reject" && feedback.trim().length < 10) {
      setError("Add a brief explanation (10+ characters) for recommending rejection.");
      return;
    }

    const hours = parseInt(hoursInput, 10) || 0;

    // A reported note keeps the hours it already earned (the server
    // enforces this too), so only a fresh approval needs a number.
    if (!isResolvingFlag && decision === "approve" && hours < 1) {
      setError("Enter how many volunteer hours to award (1 or more).");
      return;
    }

    setError("");
    setIsSubmitting(decision);

    try {
      if (decision === "fix") {
        await startFixesAction(noteId, feedback.trim());
        // Stay on the page: it now shows the upload panel for the fix.
        router.refresh();
        setIsSubmitting(null);
        setFeedback("");
        return;
      }

      await sendToFinalCheckAction(noteId, decision, feedback.trim(), decision === "approve" ? hours : undefined);
      router.push("/admin/queue");
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong saving this decision.";
      setError(message);
      setIsSubmitting(null);
    }
  };

  const secondaryClass =
    "w-full py-3 bg-white border border-gray-200 text-xs font-semibold rounded-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50";

  return (
    <div className="border-t border-brand-border-light p-5 sm:p-6 flex flex-col gap-5 shrink-0 bg-white">
      {isResolvingFlag && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
          This document was already published with <strong>{currentHoursAwarded ?? 0} hours</strong> awarded
          before it was reported. If VP Notes keeps it, it&apos;s restored exactly as it was — no hours are lost.
        </div>
      )}

      {!isResolvingFlag && (
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-gray-500">Volunteer hours to award (if approving)</label>
          <input
            type="number"
            min={1}
            value={hoursInput}
            onChange={(e) => setHoursInput(e.target.value)}
            onBlur={() => {
              if (hoursInput.trim() === "") setHoursInput("0");
            }}
            className="w-full sm:w-28 p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-base sm:text-sm focus:outline-none focus:border-gray-400 focus:bg-white transition-all font-medium"
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-gray-500">Notes for VP Notes</label>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder={
            isResolvingFlag
              ? "Required if recommending removal. Explain whether the reports hold up…"
              : "Required if recommending rejection. Anything VP Notes should know…"
          }
          className="w-full h-24 p-3.5 bg-gray-50 border border-gray-200 rounded-lg text-base sm:text-sm focus:outline-none focus:border-gray-400 focus:bg-white transition-all resize-none placeholder:text-gray-400"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-xs font-medium rounded-lg border border-red-200">{error}</div>
      )}

      <div className="flex flex-col gap-2.5 pt-1">
        <button
          onClick={() => handleDecision("approve")}
          disabled={isSubmitting !== null}
          className="w-full py-3.5 bg-brand-red text-white text-sm font-semibold rounded-lg hover:bg-brand-red-hover transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSubmitting === "approve" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {isResolvingFlag ? "Recommend keeping it" : "Recommend approval"}
        </button>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => handleDecision("fix")}
            disabled={isSubmitting !== null}
            className={`${secondaryClass} text-amber-700 hover:bg-amber-50 hover:border-amber-200`}
          >
            {isSubmitting === "fix" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wrench className="w-4 h-4" />}
            Fix it myself
          </button>
          <button
            onClick={() => handleDecision("reject")}
            disabled={isSubmitting !== null}
            className={`${secondaryClass} text-red-600 hover:bg-red-50 hover:border-red-200`}
          >
            {isSubmitting === "reject" ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsDown className="w-4 h-4" />}
            {isResolvingFlag ? "Recommend removal" : "Recommend rejection"}
          </button>
        </div>

        <p className="text-[11px] text-gray-400 leading-relaxed">
          Every option goes to <span className="font-semibold text-gray-500">VP Notes</span> for a final check —
          they publish, deny, or send it back. <span className="font-semibold text-gray-500">Fix it myself</span> keeps
          the note claimed to you for up to 3 days while you correct it, and tells the submitter it&apos;s being fixed.
        </p>
      </div>
    </div>
  );
}
