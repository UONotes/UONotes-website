"use client";

import { useState } from "react";
import { Check, X, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { reviewNoteAction } from "@/app/admin/queue/actions";

const REJECTION_REASONS = [
  "Contains Plagiarism / Not original student work",
  "Incorrect Course Code or Curriculum Mapping",
  "Illegible Scan Quality / Missing Pages",
  "Inappropriate Content / Policy Violation",
  "Other (Specify Custom Feedback Below)",
];

export function ReviewActionPanel({ noteId }: { noteId: string }) {
  const [isRejecting, setIsRejecting] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [customText, setCustomText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const isOther = selectedReason.startsWith("Other");
  const finalReason = isOther ? customText.trim() : selectedReason;

  const handleAction = async (status: "approved" | "rejected") => {
    if (status === "rejected" && !finalReason) return;
    
    setIsSubmitting(true);
    try {
      await reviewNoteAction(
        noteId, 
        status, 
        status === "approved" ? "Passed automated compliance and quality review." : finalReason
      );
      router.push("/admin/queue");
    } catch (err) {
      console.error(err);
      alert("Failed to submit moderation decision. Check console.");
      setIsSubmitting(false);
    }
  };

  if (isRejecting) {
    return (
      <div className="flex flex-col gap-4 p-6 bg-white border-t border-gray-100 animate-in fade-in slide-in-from-bottom-3 duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-600 font-bold text-xs uppercase tracking-wider font-mono">
            <AlertTriangle className="w-4 h-4" /> Rejection & Student Feedback
          </div>
          <span className="text-[10px] font-mono text-gray-400">Audited Action</span>
        </div>

        <div className="space-y-2">
          {REJECTION_REASONS.map((r) => {
            const isSelected = selectedReason === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => setSelectedReason(r)}
                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-medium transition-all flex items-center justify-between border ${
                  isSelected 
                    ? "bg-rose-50/60 border-rose-200 text-rose-900 shadow-2xs" 
                    : "bg-gray-50/60 border-gray-100 text-gray-700 hover:bg-gray-100/60"
                }`}
              >
                <span>{r}</span>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? "border-rose-600 bg-rose-600 text-white" : "border-gray-300 bg-white"}`}>
                  {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>

        {isOther && (
          <div className="space-y-1.5 animate-in fade-in duration-200">
            <label className="block text-[11px] font-mono font-bold text-gray-400 uppercase tracking-wider">
              Custom Student Feedback <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Explain clearly why this document is being rejected so the student can correct it and resubmit..."
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              className="w-full p-3.5 bg-gray-50/80 border border-gray-200 rounded-2xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-rose-500 focus:bg-white transition-all resize-none shadow-2xs"
            />
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button 
            onClick={() => { setIsRejecting(false); setSelectedReason(""); setCustomText(""); }} 
            className="flex-1 py-3 bg-gray-100 hover:bg-gray-200/80 text-gray-700 text-xs font-bold uppercase tracking-wider rounded-2xl transition-colors"
          >
            Cancel
          </button>
          <button 
            disabled={!selectedReason || (isOther && !customText.trim()) || isSubmitting} 
            onClick={() => handleAction("rejected")} 
            className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider rounded-2xl disabled:opacity-40 transition-all shadow-md shadow-rose-600/20 flex items-center justify-center gap-2"
          >
            {isSubmitting ? "Logging..." : "Confirm Rejection"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3.5 p-6 bg-white border-t border-gray-100">
      <button 
        disabled={isSubmitting}
        onClick={() => handleAction("approved")} 
        className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-2xl shadow-md shadow-emerald-600/20 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
      >
        <Check className="w-4 h-4 stroke-[3]" /> {isSubmitting ? "Processing..." : "Approve & Publish Submission"}
      </button>
      <button 
        disabled={isSubmitting}
        onClick={() => setIsRejecting(true)} 
        className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-white border border-rose-200/80 hover:bg-rose-50/50 text-rose-600 text-xs font-bold uppercase tracking-wider rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-2xs"
      >
        <X className="w-4 h-4 stroke-[3]" /> Reject Document
      </button>
    </div>
  );
}