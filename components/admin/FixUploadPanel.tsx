"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitFixAction, cancelFixesAction, sendToFinalCheckAction } from "@/app/admin/queue/actions";
import { Send, Download, Loader2, Paperclip, Trash2, Undo2, UploadCloud, X } from "lucide-react";
import { ALLOWED_FILE_EXTENSIONS, isAllowedFileType, isAllowedFileSize } from "@/lib/fileValidation";
import { formatDateTime } from "@/lib/dateFormat";

type Action = "submit" | "cancel" | "reject";

// Shown to the director who is fixing a note. They download the
// original, correct it in their own editor, then upload the corrected
// file here. It then goes to VP Notes for a final check, where they
// compare it with the original before it's published.
export function FixUploadPanel({
  noteId,
  originalDownloadUrl,
  wasPublished,
  currentHoursAwarded,
  lockExpiresAt,
}: {
  noteId: string;
  originalDownloadUrl: string;
  // True when the note came from a report: it keeps the hours it
  // already earned, so there's nothing to enter.
  wasPublished: boolean;
  currentHoursAwarded: number | null;
  lockExpiresAt: string | null;
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [hoursInput, setHoursInput] = useState(currentHoursAwarded != null ? String(currentHoursAwarded) : "1");
  const [isSubmitting, setIsSubmitting] = useState<Action | null>(null);
  const [error, setError] = useState("");

  const run = async (action: Action) => {
    setError("");

    if (action === "submit") {
      if (!file) return setError("Upload the corrected file first.");
      const fileType = file.type || "application/pdf";
      if (!isAllowedFileType(fileType)) return setError("Unsupported format. Upload a PDF, DOCX, PPTX, PNG, or JPG.");
      if (!isAllowedFileSize(file.size)) return setError("The corrected file exceeds the 25MB limit.");
      if (message.trim().length < 10) return setError("Describe what you fixed (10+ characters).");
      if (!wasPublished && (parseInt(hoursInput, 10) || 0) < 1) {
        return setError("Enter how many volunteer hours to award (1 or more).");
      }
    }
    if (action === "reject" && message.trim().length < 10) {
      return setError("Add a brief explanation (10+ characters) for recommending rejection.");
    }

    setIsSubmitting(action);
    try {
      if (action === "submit" && file) {
        const fileType = file.type || "application/pdf";
        const presignRes = await fetch("/api/admin/corrected-file-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: file.name, fileType, fileSize: file.size }),
        });
        const presignData = await presignRes.json();
        if (!presignRes.ok) throw new Error(presignData.error || "Failed to authorize the upload.");

        const uploadRes = await fetch(presignData.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": fileType },
          body: file,
        });
        if (!uploadRes.ok) throw new Error("Upload to storage failed. Please check your connection.");

        await submitFixAction(noteId, presignData.fileKey, message.trim(), parseInt(hoursInput, 10) || 1);
      } else if (action === "cancel") {
        await cancelFixesAction(noteId);
      } else {
        await sendToFinalCheckAction(noteId, "reject", message.trim());
      }
      router.push("/admin/queue");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setIsSubmitting(null);
    }
  };

  return (
    <div className="border-t border-brand-border-light p-5 sm:p-6 flex flex-col gap-5 shrink-0 bg-white">
      <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 leading-relaxed space-y-1.5">
        <p className="font-semibold">You&apos;re fixing this note</p>
        <ol className="list-decimal pl-4 space-y-0.5">
          <li>Download the original and correct it in your own editor.</li>
          <li>Upload the corrected file below and describe what you changed.</li>
          <li>Submit it for a final check. VP Notes compares it with the original before it&apos;s published.</li>
        </ol>
        {lockExpiresAt && (
          <p className="text-amber-800/80">
            It stays claimed to you until {formatDateTime(lockExpiresAt)}, even if you leave this page.
            After that, another director can take it over.
          </p>
        )}
      </div>

      <a
        href={originalDownloadUrl}
        className="inline-flex items-center justify-center gap-2 w-full py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
      >
        <Download className="w-3.5 h-3.5" /> Download original file
      </a>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-gray-500">Corrected file</label>
        {file ? (
          <div className="flex items-center justify-between gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs">
            <span className="flex items-center gap-2 min-w-0">
              <Paperclip className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="truncate font-medium text-gray-700">{file.name}</span>
            </span>
            <button
              type="button"
              onClick={() => setFile(null)}
              className="p-1 rounded-full bg-gray-200/60 text-gray-500 hover:bg-red-100 hover:text-red-600 transition-colors cursor-pointer shrink-0"
              aria-label="Remove file"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <label className="flex items-center gap-2 p-3 bg-gray-50 border border-dashed border-gray-300 rounded-lg text-xs text-gray-500 hover:bg-gray-100 hover:border-gray-400 transition-colors cursor-pointer">
            <UploadCloud className="w-3.5 h-3.5 text-gray-400" />
            Choose the corrected file…
            <input
              type="file"
              accept={ALLOWED_FILE_EXTENSIONS}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
          </label>
        )}
      </div>

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

      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-gray-500">What you fixed (shown to VP Notes and the submitter)</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="e.g. Fixed the formulas on page 3 and removed a duplicated section…"
          className="w-full h-24 p-3.5 bg-gray-50 border border-gray-200 rounded-lg text-base sm:text-sm focus:outline-none focus:border-gray-400 focus:bg-white transition-all resize-none placeholder:text-gray-400"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-xs font-medium rounded-lg border border-red-200">{error}</div>
      )}

      <div className="flex flex-col gap-2.5">
        <button
          onClick={() => run("submit")}
          disabled={isSubmitting !== null}
          className="w-full py-3.5 bg-brand-red text-white text-sm font-semibold rounded-lg hover:bg-brand-red-hover transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSubmitting === "submit" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {isSubmitting === "submit" ? "Uploading…" : "Submit for final check"}
        </button>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => run("cancel")}
            disabled={isSubmitting !== null}
            className="w-full py-3 bg-white border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting === "cancel" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Undo2 className="w-4 h-4" />}
            Stop fixing
          </button>
          <button
            onClick={() => run("reject")}
            disabled={isSubmitting !== null}
            className="w-full py-3 bg-white border border-gray-200 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-50 hover:border-red-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting === "reject" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Recommend rejection
          </button>
        </div>
        <p className="text-[11px] text-gray-400 leading-relaxed -mt-1">
          <span className="font-semibold text-gray-500">Stop fixing</span> puts the note back in the queue unclaimed.
        </p>
      </div>
    </div>
  );
}
