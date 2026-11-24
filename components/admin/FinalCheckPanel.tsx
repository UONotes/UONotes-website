"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { finalApproveAction, finalRejectAction, sendBackToPendingAction } from "@/app/admin/queue/actions";
import { Check, CornerUpLeft, Loader2, ThumbsDown, ThumbsUp, Wrench, XCircle } from "lucide-react";
import { formatDateTime } from "@/lib/dateFormat";

type Action = "approve" | "sendBack" | "deny";

// VP Notes' final check. Shows who reviewed the note and what they
// recommend; for fixes, the viewer beside this panel shows the original
// and the fixed version side by side. Only here can a note be published
// or denied.
export function FinalCheckPanel({
  noteId,
  checkerName,
  checkedAt,
  recommendation,
  recommendationNote,
  isFix,
  wasPublished,
  recommendedHours,
}: {
  noteId: string;
  checkerName: string;
  checkedAt: string | null;
  recommendation: "approve" | "reject" | null;
  recommendationNote: string | null;
  isFix: boolean;
  // True when the note came from a report: it keeps the hours it
  // already earned, so there's nothing to enter.
  wasPublished: boolean;
  recommendedHours: number | null;
}) {
  const router = useRouter();
  // For a fix, the fixer's description is what the submitter is told.
  const [message, setMessage] = useState(isFix ? recommendationNote ?? "" : "");
  const [hoursInput, setHoursInput] = useState(String(recommendedHours ?? 1));
  const [reason, setReason] = useState(recommendation === "reject" ? recommendationNote ?? "" : "");
  const [isSubmitting, setIsSubmitting] = useState<Action | null>(null);
  const [error, setError] = useState("");

  const run = async (action: Action) => {
    setError("");
    if (action === "approve") {
      if (isFix && message.trim().length < 10) return setError("Tell the submitter what was fixed (10+ characters).");
      if (!wasPublished && (parseInt(hoursInput, 10) || 0) < 1) {
        return setError("Enter how many volunteer hours to award (1 or more).");
      }
    } else if (reason.trim().length < 10) {
      return setError(
        action === "sendBack"
          ? "Explain what still needs work (10+ characters)."
          : "Add a brief explanation (10+ characters) for denying it."
      );
    }

    setIsSubmitting(action);
    try {
      if (action === "approve") {
        await finalApproveAction(noteId, message.trim(), parseInt(hoursInput, 10) || 1);
      } else if (action === "sendBack") {
        await sendBackToPendingAction(noteId, reason.trim());
      } else {
        await finalRejectAction(noteId, reason.trim());
      }
      router.push("/admin/queue");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setIsSubmitting(null);
    }
  };

  const recommendationLabel = isFix
    ? { text: "Fixed it — recommends approving the fixed version", icon: Wrench, className: "text-stone-900" }
    : recommendation === "reject"
      ? { text: wasPublished ? "Recommends removing it" : "Recommends rejecting it", icon: ThumbsDown, className: "text-rose-700" }
      : { text: wasPublished ? "Recommends keeping it published" : "Recommends approving it", icon: ThumbsUp, className: "text-emerald-700" };
  const RecIcon = recommendationLabel.icon;

  const textareaClass =
    "w-full h-24 p-3.5 bg-gray-50 border border-gray-200 rounded-lg text-base sm:text-sm focus:outline-none focus:border-gray-400 focus:bg-white transition-all resize-none placeholder:text-gray-400";

  return (
    <div className="border-t border-brand-border-light p-5 sm:p-6 flex flex-col gap-5 shrink-0 bg-white">
      <div className="p-4 bg-stone-100 border border-stone-300 rounded-lg text-xs text-stone-900 leading-relaxed space-y-2">
        <p className="font-semibold uppercase tracking-wide text-[10px] text-stone-800">Final check</p>
        <p>
          Sent to final check by <span className="font-semibold">{checkerName}</span>
          {checkedAt && <span className="text-stone-900/70"> · {formatDateTime(checkedAt)}</span>}
        </p>
        <p className={`flex items-center gap-1.5 font-semibold ${recommendationLabel.className}`}>
          <RecIcon className="w-3.5 h-3.5" /> {recommendationLabel.text}
        </p>
        {recommendationNote && (
          <p className="p-2.5 rounded-lg bg-white/70 border border-stone-200 text-gray-800 whitespace-pre-wrap">
            {recommendationNote}
          </p>
        )}
      </div>

      {isFix && (
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-gray-500">What was fixed (sent to the submitter)</label>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} className={textareaClass} />
        </div>
      )}

      {!isFix && !wasPublished && (
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-gray-500">Message to the submitter (optional)</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Sent with the acceptance email…"
            className={textareaClass}
          />
        </div>
      )}

      {!wasPublished && (
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-gray-500">Volunteer hours to award</label>
          <input
            type="number"
            min={1}
            value={hoursInput}
            onChange={(e) => setHoursInput(e.target.value)}
            className="w-full sm:w-28 p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-base sm:text-sm focus:outline-none focus:border-gray-400 focus:bg-white transition-all font-medium"
          />
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-xs font-medium rounded-lg border border-red-200">{error}</div>
      )}

      <button
        onClick={() => run("approve")}
        disabled={isSubmitting !== null}
        className="w-full py-3.5 bg-brand-red text-white text-sm font-semibold rounded-lg hover:bg-brand-red-hover transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {isSubmitting === "approve" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        {isFix ? "Approve & publish fixed version" : wasPublished ? "Keep published" : "Approve & publish"}
      </button>

      <div className="flex flex-col gap-2 pt-4 border-t border-brand-border-light">
        <label className="text-xs font-semibold text-gray-500">Not ready, or shouldn&apos;t be published?</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="What still needs work (sent to the director), or why it's being denied (sent to the submitter)…"
          className={textareaClass}
        />
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => run("sendBack")}
            disabled={isSubmitting !== null}
            className="w-full py-3 bg-white border border-gray-200 text-amber-700 text-xs font-semibold rounded-lg hover:bg-amber-50 hover:border-amber-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting === "sendBack" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CornerUpLeft className="w-4 h-4" />}
            Send back to pending
          </button>
          <button
            onClick={() => run("deny")}
            disabled={isSubmitting !== null}
            className="w-full py-3 bg-white border border-gray-200 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-50 hover:border-red-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting === "deny" ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
            {wasPublished ? "Remove" : "Deny"}
          </button>
        </div>
        <p className="text-[11px] text-gray-400 leading-relaxed">
          <span className="font-semibold text-gray-500">Send back to pending</span> returns it to the queue, marked as
          sent back, for any director to review or fix again. Any fix that was made is dropped.
        </p>
      </div>
    </div>
  );
}
