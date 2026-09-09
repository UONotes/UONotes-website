"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { reviewNoteAction } from "@/app/admin/queue/actions";
import { Check, AlertCircle, Trash2, Loader2, Paperclip, X } from "lucide-react";
import { ALLOWED_FILE_EXTENSIONS, isAllowedFileType, isAllowedFileSize } from "@/lib/fileValidation";

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
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const [error, setError] = useState("");

  const isResolvingFlag = currentStatus === "flagged";

  const handleDecision = async (status: "approved" | "rejected" | "changes_requested") => {
    if ((status === "rejected" || status === "changes_requested") && feedback.trim().length < 10) {
      setError("Add a brief explanation (10+ characters) for this decision.");
      return;
    }

    if (attachment && status !== "changes_requested") {
      setError("The attached file only applies to Request Fixes — remove it or choose that option.");
      return;
    }

    if (attachment) {
      if (!isAllowedFileType(attachment.type || "application/pdf")) {
        setError("Unsupported attachment format. Attach a PDF, DOCX, PPTX, PNG, or JPG.");
        return;
      }
      if (!isAllowedFileSize(attachment.size)) {
        setError("Attachment exceeds the 25MB limit.");
        return;
      }
    }

    const hours = parseInt(hoursInput, 10) || 0;

    if (status === "approved" && hours < 1) {
      setError("Enter how many volunteer hours to award (1 or more).");
      return;
    }

    setError("");
    setIsSubmitting(status);

    try {
      let attachmentKey: string | undefined;

      if (attachment && status === "changes_requested") {
        const presignRes = await fetch("/api/admin/feedback-attachment-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: attachment.name,
            fileType: attachment.type || "application/pdf",
            fileSize: attachment.size,
          }),
        });

        const presignData = await presignRes.json();
        if (!presignRes.ok) {
          throw new Error(presignData.error || "Failed to authorize attachment upload.");
        }

        const uploadRes = await fetch(presignData.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": attachment.type || "application/pdf" },
          body: attachment,
        });

        if (!uploadRes.ok) {
          throw new Error("Attachment upload to storage failed. Please check your connection.");
        }

        attachmentKey = presignData.fileKey;
      }

      await reviewNoteAction(
        noteId,
        status,
        feedback.trim(),
        status === "approved" ? hours : undefined,
        attachmentKey
      );
      router.push("/admin/queue");
      router.refresh(); 
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong saving this decision.";
      setError(message);
      setIsSubmitting(null);
    }
  };

  if (isResolvingFlag) {
    return (
      <div className="border-t border-black/5 p-6 flex flex-col gap-4 shrink-0 bg-white">
        
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
          This document was already published with <strong>{currentHoursAwarded ?? 0} hours</strong> awarded
          before it was reported. Dismissing the report restores it exactly as it was — no hours are lost.
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-gray-500">
            Notes if removing this document
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Required only if you're confirming the report and removing the document…"
            className="w-full h-24 p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400 focus:bg-white transition-all resize-none placeholder:text-gray-400"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs font-medium rounded-xl border border-red-200">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            onClick={() => handleDecision("approved")}
            disabled={isSubmitting !== null}
            className="w-full py-3 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting === "approved" && <Loader2 className="w-4 h-4 animate-spin" />}
            Dismiss report & restore
          </button>

          <button
            onClick={() => handleDecision("rejected")}
            disabled={isSubmitting !== null}
            className="w-full py-3 bg-white border border-red-200 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting === "rejected" && <Loader2 className="w-4 h-4 animate-spin" />}
            Confirm report & remove
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-black/5 p-6 flex flex-col gap-5 shrink-0 bg-white">
      
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-gray-500">
          Volunteer hours to award (if approving)
        </label>
        <input
          type="number"
          min={1}
          value={hoursInput}
          onChange={(e) => setHoursInput(e.target.value)}
          onBlur={() => {
            if (hoursInput.trim() === "") setHoursInput("0");
          }}
          className="w-full sm:w-28 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400 focus:bg-white transition-all font-medium"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-gray-500">
          Feedback for the submitter
        </label>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Required if rejecting or requesting changes. Sent directly to the submitter…"
          className="w-full h-24 p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400 focus:bg-white transition-all resize-none placeholder:text-gray-400"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-gray-500">
          Attach a document (optional, sent only with Request Fixes)
        </label>
        {attachment ? (
          <div className="flex items-center justify-between gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs">
            <span className="truncate font-medium text-gray-700">{attachment.name}</span>
            <button
              type="button"
              onClick={() => setAttachment(null)}
              className="p-1 rounded-full bg-gray-200/60 text-gray-500 hover:bg-red-100 hover:text-red-600 transition-colors cursor-pointer shrink-0"
              aria-label="Remove attachment"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <label className="flex items-center gap-2 p-3 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-xs text-gray-500 hover:bg-gray-100 hover:border-gray-400 transition-colors cursor-pointer">
            <Paperclip className="w-3.5 h-3.5 text-gray-400" />
            Choose a file…
            <input
              type="file"
              accept={ALLOWED_FILE_EXTENSIONS}
              onChange={(e) => setAttachment(e.target.files?.[0] ?? null)}
              className="hidden"
            />
          </label>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-xs font-medium rounded-xl border border-red-200">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-2.5 pt-1">
        <button
          onClick={() => handleDecision("approved")}
          disabled={isSubmitting !== null}
          className="w-full py-3.5 bg-[#23201D] text-white text-sm font-semibold rounded-xl hover:bg-black transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSubmitting === "approved" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Approve & publish
        </button>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => handleDecision("changes_requested")}
            disabled={isSubmitting !== null}
            className="w-full py-3 bg-white border border-gray-200 text-orange-700 text-xs font-semibold rounded-xl hover:bg-orange-50 hover:border-orange-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting === "changes_requested" ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4" />}
            Request fixes
          </button>

          <button
            onClick={() => handleDecision("rejected")}
            disabled={isSubmitting !== null}
            className="w-full py-3 bg-white border border-gray-200 text-red-600 text-xs font-semibold rounded-xl hover:bg-red-50 hover:border-red-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting === "rejected" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Reject file
          </button>
        </div>
      </div>
    </div>
  );
}