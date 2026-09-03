"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { reviewNoteAction } from "@/app/admin/queue/actions";
import { Check, AlertCircle, Trash2, Loader2, MessageSquareText, Clock } from "lucide-react";

interface ReviewActionPanelProps {
  noteId: string;
  currentHoursAwarded?: number | null;
  currentStatus?: string;
}

export function ReviewActionPanel({ noteId, currentHoursAwarded, currentStatus }: ReviewActionPanelProps) {
  const router = useRouter();
  const [feedback, setFeedback] = useState("");
  const [hoursInput, setHoursInput] = useState(
    currentHoursAwarded != null ? String(currentHoursAwarded) : "1"
  );
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const [error, setError] = useState("");

  const isResolvingFlag = currentStatus === "flagged";

  const handleDecision = async (status: "approved" | "rejected" | "changes_requested") => {
    if ((status === "rejected" || status === "changes_requested") && feedback.trim().length < 10) {
      setError("Provide at least a brief explanation (10+ characters) for this action.");
      return;
    }

    const hours = parseInt(hoursInput, 10) || 0;

    if (status === "approved" && hours < 1) {
      setError("Enter how many volunteer hours to award (1 or more).");
      return;
    }

    setError("");
    setIsSubmitting(status);

    try {
      await reviewNoteAction(noteId, status, feedback.trim(), status === "approved" ? hours : undefined);
      router.push("/admin/queue");
      router.refresh(); 
    } catch (err: any) {
      setError(err.message || "System error saving decision.");
      setIsSubmitting(null);
    }
  };

  if (isResolvingFlag) {
    return (
      <div className="bg-white/60 backdrop-blur-xl border-t border-gray-200 p-6 md:p-8 flex flex-col gap-5 shrink-0 shadow-[0_-20px_40px_rgba(0,0,0,0.02)]">
        
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
          This document was already published with <strong>{currentHoursAwarded ?? 0} hours</strong> awarded
          before it was reported. Dismissing the report restores it exactly as it was — no hours are lost.
        </div>

        <div className="flex flex-col gap-2.5">
          <label className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">
            <MessageSquareText className="w-4 h-4 text-gray-400" />
            Notes if removing this document
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Required only if you're confirming the report and removing the document..."
            className="w-full h-24 p-4 bg-white border border-gray-200/80 rounded-xl text-sm focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all resize-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] placeholder:text-gray-400 font-medium"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-[11px] font-mono font-bold uppercase tracking-wider rounded-lg border border-red-200 text-center shadow-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => handleDecision("approved")}
            disabled={isSubmitting !== null}
            className="w-full py-4 bg-emerald-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting === "approved" && <Loader2 className="w-4 h-4 animate-spin" />}
            Dismiss Report & Restore
          </button>

          <button
            onClick={() => handleDecision("rejected")}
            disabled={isSubmitting !== null}
            className="w-full py-4 bg-white border border-red-200 text-red-600 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-red-50 transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting === "rejected" && <Loader2 className="w-4 h-4 animate-spin" />}
            Confirm Report & Remove
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/60 backdrop-blur-xl border-t border-gray-200 p-6 md:p-8 flex flex-col gap-5 shrink-0 shadow-[0_-20px_40px_rgba(0,0,0,0.02)]">
      
      <div className="flex flex-col gap-2.5">
        <label className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">
          <Clock className="w-4 h-4 text-gray-400" />
          Volunteer Hours to Award (if approving)
        </label>
        <input
          type="number"
          min={1}
          value={hoursInput}
          onChange={(e) => setHoursInput(e.target.value)}
          onBlur={() => {
            if (hoursInput.trim() === "") setHoursInput("0");
          }}
          className="w-full sm:w-32 p-3 bg-white border border-gray-200/80 rounded-xl text-sm focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] font-semibold"
        />
      </div>

      <div className="flex flex-col gap-2.5">
        <label className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">
          <MessageSquareText className="w-4 h-4 text-gray-400" />
          Reviewer Audit Log & Feedback
        </label>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Required if rejecting or requesting changes. Sent directly to the submitter..."
          className="w-full h-24 p-4 bg-white border border-gray-200/80 rounded-xl text-sm focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all resize-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] placeholder:text-gray-400 font-medium"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-600 text-[11px] font-mono font-bold uppercase tracking-wider rounded-lg border border-red-200 text-center shadow-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <button
          onClick={() => handleDecision("approved")}
          disabled={isSubmitting !== null}
          className="w-full py-4 bg-gray-900 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/20 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSubmitting === "approved" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-5 h-5" />}
          Approve & Publish
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleDecision("changes_requested")}
            disabled={isSubmitting !== null}
            className="w-full py-3.5 bg-white border border-gray-200 text-amber-600 text-[11px] font-bold uppercase tracking-wider rounded-xl hover:bg-amber-50 hover:border-amber-200 transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting === "changes_requested" ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4" />}
            Request Fixes
          </button>

          <button
            onClick={() => handleDecision("rejected")}
            disabled={isSubmitting !== null}
            className="w-full py-3.5 bg-white border border-gray-200 text-red-600 text-[11px] font-bold uppercase tracking-wider rounded-xl hover:bg-red-50 hover:border-red-200 transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting === "rejected" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Reject File
          </button>
        </div>
      </div>
    </div>
  );
}