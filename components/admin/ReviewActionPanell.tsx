"use client";

import { useState } from "react";
import { Check, X, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

const REJECTION_REASONS = [
  "Contains Plagiarism / Not original work",
  "Incorrect Course Code",
  "Illegible / Poor Scan Quality",
];

export function ReviewActionPanel({ noteId }: { noteId: string }) {
  const [isRejecting, setIsRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const router = useRouter();

  // TODO: Replace with actual Server Action call
  const handleAction = async (status: "APPROVED" | "REJECTED") => {
    console.log(`Action: ${status} on ${noteId} for reason: ${reason}`);
    router.push("/admin/queue");
  };

  if (isRejecting) {
    return (
      <div className="flex flex-col gap-3 p-5 sm:p-6 bg-white border-t border-gray-100 animate-in slide-in-from-right-4 duration-200">
        <div className="flex items-center gap-2 text-rose-600 font-bold mb-1 text-sm">
          <AlertTriangle className="w-4 h-4" /> Require Reason
        </div>
        <select 
          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-900 focus:outline-none focus:border-rose-400"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        >
          <option value="" disabled>Select audit reason...</option>
          {REJECTION_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <div className="flex gap-2 mt-2">
          <button onClick={() => setIsRejecting(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 text-[11px] font-bold uppercase rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
          <button disabled={!reason} onClick={() => handleAction("REJECTED")} className="flex-1 py-3 bg-rose-600 text-white text-[11px] font-bold uppercase rounded-lg disabled:opacity-50 transition-colors">Confirm</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-5 sm:p-6 bg-white border-t border-gray-100">
      <button onClick={() => handleAction("APPROVED")} className="w-full flex items-center justify-center gap-2 px-4 py-3.5 sm:py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] sm:text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm transition-colors active:scale-[0.98]">
        <Check className="w-4 h-4" /> Approve Document
      </button>
      <button onClick={() => setIsRejecting(true)} className="w-full flex items-center justify-center gap-2 px-4 py-3.5 sm:py-4 bg-white border-2 border-rose-100 hover:bg-rose-50 hover:border-rose-200 text-rose-600 text-[11px] sm:text-xs font-bold uppercase tracking-wider rounded-xl transition-colors active:scale-[0.98]">
        <X className="w-4 h-4" /> Reject Submission
      </button>
    </div>
  );
}