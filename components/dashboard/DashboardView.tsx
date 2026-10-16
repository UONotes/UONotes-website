"use client";

import { useEffect, useMemo, useState, type DragEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Bookmark, CheckCircle2, Download, FolderOpen, Loader2, Paperclip, Search, Trash2, UploadCloud, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { resubmitNoteAction, getFeedbackAttachmentUrlAction } from "@/app/(main)/notes/actions";
import { ALLOWED_FILE_EXTENSIONS, isAllowedFileType, isAllowedFileSize } from "@/lib/fileValidation";
import { PdfThumbnail } from "@/components/notes/PdfThumbnail";
import { formatShortDate } from "@/lib/dateFormat";

// ─── "Rubber stamp" styles (same as the navbar) ──────────────────────────────
const STAMP_TEXT = "font-mono font-bold uppercase tracking-[0.16em]";
const STAMP_INK = "bg-brand-red shadow-[inset_0_0_0_2px_rgba(255,240,240,0.35)]";
const LABEL = `text-[11px] sm:text-xs text-brand-red ${STAMP_TEXT} tracking-[0.2em]`;
const CARD_SHADOW = "shadow-[0_14px_24px_-18px_rgba(0,0,0,0.45)]";

// ─── Settings ────────────────────────────────────────────────────────────────
// The hours bar fills toward the next multiple of this (5 hrs → "5 hrs to your next milestone" at 10).
// Set to null to hide the milestone part of the bar.
const MILESTONE_STEP: number | null = 10;
// How many notes are listed under "Where your hours came from" before "+ N more"
const HOURS_LIST_LIMIT = 6;
// Shades of the brand red used for each note's slice of the hours bar
const BAR_SHADES = ["#8F0018", "#a8434b", "#c66d74"];
// ─────────────────────────────────────────────────────────────────────────────

type Status = "approved" | "pending" | "changes_requested" | "rejected" | "flagged";

// How each status is stamped, and what the last step of its progress track says
const STATUS: Record<Status, { label: string; stamp: string; finalStep: string }> = {
  changes_requested: { label: "Fix needed !", stamp: "border-2 border-brand-red bg-[#fbecee] text-brand-red", finalStep: "Fix needed" },
  pending: { label: "In review", stamp: "border-[1.5px] border-dashed border-brand-red text-brand-red", finalStep: "Published" },
  approved: { label: "Published ✓", stamp: `${STAMP_INK} text-white`, finalStep: "Published" },
  flagged: { label: "Flagged", stamp: "border-[1.5px] border-[#c9bfc1] text-[#6b5a5d]", finalStep: "Flagged" },
  rejected: { label: "Not accepted", stamp: "border-[1.5px] border-[#c9bfc1] text-[#6b5a5d]", finalStep: "Not accepted" },
};
// Notes that need you come first in the list
const STATUS_ORDER: Status[] = ["changes_requested", "pending", "approved", "flagged", "rejected"];

function toStatus(status: string): Status {
  return (STATUS_ORDER as string[]).includes(status) ? (status as Status) : "pending";
}

function hoursLabel(h: number) {
  return `${h} ${h === 1 ? "hr" : "hrs"}`;
}

interface DatabaseSubmission {
  id: string;
  title: string;
  course_code?: string | null;
  status: string;
  hours_awarded: number | null;
  flag_reason: string | null;
  feedback_attachment_key: string | null;
  created_at?: string | null;
  reviewed_at?: string | null;
  fileUrl?: string | null;
}

interface Submission {
  id: string;
  title: string;
  code: string;
  status: Status;
  hours: number;
  feedback?: string;
  hasAttachment: boolean;
  sentAt?: string | null;
  reviewedAt?: string | null;
  fileUrl?: string | null;
}

interface SavedNote {
  id: string;
  title: string;
  course_code: string;
  author_name?: string | null;
  created_at?: string | null;
  fileUrl?: string | null;
}

interface DatabaseSavedNote {
  id: string;
  note_id: string;
  notes: SavedNote | SavedNote[] | null;
}

function StatusStamp({ status, className = "" }: { status: Status; className?: string }) {
  return (
    <span
      className={`inline-block whitespace-nowrap px-2 py-1 text-[10px] sm:text-[11px] ${STAMP_TEXT} ${STATUS[status].stamp} ${className}`}
    >
      {STATUS[status].label}
      {status === "rejected" && <X aria-hidden="true" className="-mt-0.5 ml-1 inline h-3 w-3" strokeWidth={3} />}
    </span>
  );
}

// A plain sheet with grey "text" lines, shown when there's no PDF preview
function PaperFallback() {
  return (
    <div aria-hidden="true" className="h-full w-full bg-white px-3.5 pt-4">
      <div className="mb-2 h-2.5 w-3/5 bg-gray-800/80" />
      <div className="mb-4 h-1.5 w-2/5 bg-gray-400/70" />
      {[88, 80, 92, 70, 85, 62, 90, 76, 84, 66].map((w, i) => (
        <div key={i} className="mb-2 h-1 bg-gray-200" style={{ width: `${w}%` }} />
      ))}
    </div>
  );
}

// ═══ Volunteer hours: big number + where the hours came from ═════════════════
function HoursPanel({ submissions }: { submissions: Submission[] }) {
  const earned = submissions.filter((s) => s.status === "approved" && s.hours > 0);
  const total = earned.reduce((sum, s) => sum + s.hours, 0);
  const milestone = MILESTONE_STEP ? Math.floor(total / MILESTONE_STEP) * MILESTONE_STEP + MILESTONE_STEP : null;
  const toGo = milestone ? milestone - total : 0;
  const shown = earned.slice(0, HOURS_LIST_LIMIT);
  const inReview = submissions.filter((s) => s.status === "pending");

  return (
    <section
      aria-label="Volunteer hours"
      className={`grid border-t-4 border-brand-red bg-white ${CARD_SHADOW} md:grid-cols-[250px_minmax(0,1fr)] lg:grid-cols-[290px_minmax(0,1fr)]`}
    >
      {/* The big number */}
      <div className="flex items-end gap-4 border-b border-dashed border-brand-red/30 bg-[#fbecee] px-5 py-5 md:block md:border-b-0 md:border-r md:px-7 md:py-6">
        <p
          className={`text-[64px] font-black leading-[0.85] tracking-[-0.05em] md:text-[112px] ${total > 0 ? "text-brand-red" : "text-[#e3c3c7]"}`}
        >
          {total}
        </p>
        <div>
          <p className={`text-[10px] leading-relaxed text-[#6b5a5d] md:mt-3 md:text-[11px] ${STAMP_TEXT}`}>
            Volunteer hours
            <br />
            earned
          </p>
          {earned.length > 0 && (
            <span className={`mt-2 inline-block px-2 py-1 text-[9px] text-white md:mt-3 md:text-[10px] ${STAMP_TEXT} ${STAMP_INK}`}>
              From {earned.length} published {earned.length === 1 ? "note" : "notes"}
            </span>
          )}
        </div>
      </div>

      {/* Breakdown */}
      <div className="min-w-0 px-5 py-5 md:px-7 md:py-6">
        <p className={LABEL}>{total > 0 ? "Where your hours came from" : "Where your hours will come from"}</p>

        {total > 0 ? (
          <>
            {/* One slice per note, sized by its hours */}
            <div className="mt-3 flex h-[34px] gap-[3px]" role="img" aria-label={`${total} hours from ${earned.length} notes`}>
              {earned.map((s, i) => (
                <div
                  key={s.id}
                  title={`${s.code} · ${hoursLabel(s.hours)}`}
                  className={`flex min-w-0 items-center overflow-hidden whitespace-nowrap px-2.5 text-[9px] text-white sm:text-[10px] ${STAMP_TEXT}`}
                  style={{ flex: s.hours, backgroundColor: BAR_SHADES[i % BAR_SHADES.length] }}
                >
                  <span className="sm:hidden">{s.hours}h</span>
                  <span className="hidden truncate sm:inline">
                    {s.code} &middot; {s.hours}h
                  </span>
                </div>
              ))}
              {milestone && toGo > 0 && (
                <div
                  className={`hidden min-w-0 items-center overflow-hidden whitespace-nowrap border-[1.5px] border-dashed border-[#dcc7ca] bg-[#fffafa] px-2.5 text-[9px] text-[#b9a3a6] sm:flex sm:text-[10px] ${STAMP_TEXT}`}
                  style={{ flex: toGo }}
                >
                  {hoursLabel(toGo)} to {milestone}
                </div>
              )}
            </div>
            {milestone && toGo > 0 && (
              <p className={`mt-2 text-[9px] text-[#b9a3a6] sm:hidden ${STAMP_TEXT}`}>
                {hoursLabel(toGo)} to your next milestone ({milestone})
              </p>
            )}

            <ul className="mt-4 grid gap-x-5 gap-y-3 sm:grid-cols-2 xl:grid-cols-3">
              {shown.map((s) => (
                <li key={s.id} className="min-w-0 border-l-[3px] border-brand-red pl-2.5">
                  <p className={`text-[9px] text-brand-red sm:text-[10px] ${STAMP_TEXT}`}>
                    +{hoursLabel(s.hours)} &middot; {s.code}
                  </p>
                  <p className="truncate text-sm font-bold text-gray-900">{s.title}</p>
                  {(s.reviewedAt || s.sentAt) && (
                    <p className="text-xs text-gray-500">Published {formatShortDate(s.reviewedAt || s.sentAt)}</p>
                  )}
                </li>
              ))}
            </ul>
            {earned.length > shown.length && (
              <p className={`mt-3 text-[10px] text-gray-500 ${STAMP_TEXT}`}>+ {earned.length - shown.length} more</p>
            )}
          </>
        ) : (
          <>
            {/* Nothing earned yet: a placeholder bar showing where the slices will go */}
            <div className="mt-3 flex h-[34px] gap-[3px]" aria-hidden="true">
              <div
                className={`flex min-w-0 items-center overflow-hidden whitespace-nowrap border-2 border-dashed border-brand-red bg-[#fbecee] px-2.5 text-[9px] text-brand-red sm:text-[10px] ${STAMP_TEXT}`}
                style={{ flex: 2 }}
              >
                <span className="truncate">
                  {inReview[0] ? (
                    `${inReview[0].code || "Your note"} \u00b7 in review`
                  ) : (
                    <>
                      <span className="sm:hidden">First note</span>
                      <span className="hidden sm:inline">Your first note &middot; +hrs</span>
                    </>
                  )}
                </span>
              </div>
              <div
                className={`flex min-w-0 items-center overflow-hidden whitespace-nowrap border-[1.5px] border-dashed border-[#dcc7ca] bg-[#fffafa] px-2.5 text-[9px] text-[#b9a3a6] sm:text-[10px] ${STAMP_TEXT}`}
                style={{ flex: 2 }}
              >
                <span className="truncate">Next note</span>
              </div>
              <div
                className={`flex min-w-0 items-center overflow-hidden whitespace-nowrap border-[1.5px] border-dashed border-[#dcc7ca] bg-[#fffafa] px-2.5 text-[9px] text-[#b9a3a6] sm:text-[10px] ${STAMP_TEXT}`}
                style={{ flex: 3 }}
              >
                &hellip;
              </div>
            </div>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-gray-600">
              {inReview.length > 0
                ? `You have ${inReview.length} ${inReview.length === 1 ? "note" : "notes"} in review. Your hours show up here as soon as one is published.`
                : "Every note you share that gets published adds a slice here."}
            </p>
          </>
        )}
      </div>
    </section>
  );
}

// ═══ Progress track: Sent → Reviewed → Published / Fix needed / … ═════════════
function ProgressTrack({ status }: { status: Status }) {
  const reviewed = status !== "pending";
  const finalState = status === "approved" ? "done" : status === "changes_requested" ? "now" : status === "pending" ? "todo" : "stopped";
  const box = (state: "done" | "now" | "todo" | "stopped") =>
    state === "done"
      ? "border-brand-red bg-brand-red"
      : state === "now"
        ? "border-brand-red bg-[#fbecee]"
        : state === "stopped"
          ? "border-[#c9bfc1] bg-[#c9bfc1]"
          : "border-gray-300 bg-white";
  const text = (state: "done" | "now" | "todo" | "stopped") =>
    state === "done" ? "text-[#1f2a44]" : state === "now" ? "text-brand-red" : "text-gray-400";

  const steps: { label: string; state: "done" | "now" | "todo" | "stopped" }[] = [
    { label: "Sent", state: "done" },
    { label: reviewed ? "Reviewed" : "In review", state: reviewed ? "done" : "now" },
    { label: STATUS[status].finalStep, state: finalState },
  ];

  return (
    <ol className={`flex flex-wrap items-center gap-y-2 text-[10px] sm:text-[11px] ${STAMP_TEXT}`}>
      {steps.map((step, i) => (
        <li key={step.label} className="flex items-center">
          {i > 0 && (
            <span aria-hidden="true" className={`mx-2 h-0.5 w-6 sm:w-8 ${step.state === "todo" ? "bg-gray-200" : "bg-brand-red"}`} />
          )}
          <span className={`flex items-center gap-2 ${text(step.state)}`}>
            {status === "rejected" && step.state === "stopped" ? (
              // Not accepted: the last box is crossed out
              <span aria-hidden="true" className="flex h-3.5 w-3.5 items-center justify-center bg-[#9a9092] text-white">
                <X className="h-3 w-3" strokeWidth={3} />
              </span>
            ) : (
              <span aria-hidden="true" className={`h-3.5 w-3.5 border-2 ${box(step.state)}`} />
            )}
            {step.label}
          </span>
        </li>
      ))}
    </ol>
  );
}

// ═══ The right-hand pane: one submission in detail ═══════════════════════════
function SubmissionDetail({ submission, onClose }: { submission: Submission; onClose: () => void }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResubmitting, setIsResubmitting] = useState(false);
  const [resubmitError, setResubmitError] = useState("");
  const [resubmitSuccess, setResubmitSuccess] = useState(false);
  const [isFetchingAttachment, setIsFetchingAttachment] = useState(false);
  const [attachmentError, setAttachmentError] = useState("");

  const needsFix = submission.status === "changes_requested";

  async function handleViewAttachment() {
    setAttachmentError("");
    setIsFetchingAttachment(true);
    try {
      const url = await getFeedbackAttachmentUrlAction(submission.id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err: unknown) {
      setAttachmentError(err instanceof Error ? err.message : "Couldn't load the attachment.");
    } finally {
      setIsFetchingAttachment(false);
    }
  }

  function pickFile(picked: File | null) {
    setResubmitError("");
    setFile(picked);
  }

  function handleDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setIsDragging(false);
    pickFile(e.dataTransfer.files?.[0] ?? null);
  }

  async function handleResubmit() {
    if (!file) return;
    const fileType = file.type || "application/pdf";

    if (!isAllowedFileType(fileType)) {
      setResubmitError("Unsupported file format. Please upload a PDF, DOCX, PPTX, PNG, or JPG.");
      return;
    }
    if (!isAllowedFileSize(file.size)) {
      setResubmitError("File exceeds the 25MB limit.");
      return;
    }

    setResubmitError("");
    setIsResubmitting(true);

    try {
      const presignRes = await fetch("/api/notes/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, fileType, fileSize: file.size }),
      });
      const presignData = await presignRes.json();
      if (!presignRes.ok) throw new Error(presignData.error || "Failed to generate storage authorization.");

      const { uploadUrl, fileKey } = presignData;
      const uploadRes = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": fileType }, body: file });
      if (!uploadRes.ok) throw new Error("Direct file upload to storage failed. Please check your connection.");

      await resubmitNoteAction(submission.id, fileKey, file.size, fileType);

      setResubmitSuccess(true);
      setFile(null);
      router.refresh();
    } catch (err: unknown) {
      setResubmitError(err instanceof Error ? err.message : "Something went wrong resubmitting your file.");
    } finally {
      setIsResubmitting(false);
    }
  }

  return (
    <div className="p-4 sm:p-7 lg:p-9">
      {/* Phones/tablets: back to the list */}
      <button
        type="button"
        onClick={onClose}
        className={`mb-5 inline-flex items-center gap-1.5 text-[10px] text-gray-500 hover:text-brand-red lg:hidden ${STAMP_TEXT}`}
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All submissions
      </button>

      <div className="flex flex-col gap-6 sm:flex-row sm:gap-7 lg:flex-col xl:flex-row">
        {/* First page of the file */}
        <div className="mx-auto h-[220px] w-[170px] shrink-0 overflow-hidden border border-black/[0.08] bg-white shadow-[0_14px_24px_-16px_rgba(0,0,0,0.4)] sm:mx-0 sm:h-[300px] sm:w-[230px] lg:h-[230px] lg:w-[180px] xl:h-[300px] xl:w-[230px]">
          {submission.fileUrl ? (
            <PdfThumbnail fileUrl={submission.fileUrl} className="h-full w-full" fallback={<PaperFallback />} />
          ) : (
            <PaperFallback />
          )}
        </div>

        <div className="min-w-0 flex-1">
          {submission.code && <p className={LABEL}>{submission.code}</p>}
          <h2 className="mt-1.5 text-2xl font-black leading-[1.1] tracking-[-0.03em] text-gray-900 sm:text-[34px]">{submission.title}</h2>
          <p className="mt-2 text-xs text-gray-500">
            {submission.sentAt && <>Sent {formatShortDate(submission.sentAt)}</>}
            {submission.status === "approved" && submission.hours > 0 && (
              <span className="font-semibold text-brand-red"> &middot; +{hoursLabel(submission.hours)}</span>
            )}
          </p>

          <div className="mt-4">
            <ProgressTrack status={submission.status} />
          </div>

          {/* Feedback */}
          {submission.feedback ? (
            <div className="mt-5 border-l-4 border-brand-red bg-[#fbecee] px-4 py-3.5">
              <p className={`mb-1.5 text-[9px] text-brand-red sm:text-[10px] ${STAMP_TEXT}`}>
                {needsFix ? "What needs fixing" : "Reviewer feedback"}
              </p>
              <p className="whitespace-pre-line text-[15px] leading-relaxed text-[#4a2e32]">{submission.feedback}</p>
            </div>
          ) : (
            <p className="mt-5 text-sm leading-relaxed text-gray-600">
              {submission.status === "pending"
                ? "Our team is reviewing it. You'll see the result here once it's done."
                : submission.status === "approved"
                  ? "It's live in the library for every uOttawa student."
                  : "No comment was left on this one."}
            </p>
          )}

          {submission.hasAttachment && (
            <div className="mt-3">
              <button
                type="button"
                onClick={handleViewAttachment}
                disabled={isFetchingAttachment}
                className={`inline-flex items-center gap-1.5 text-[10px] text-brand-red hover:underline disabled:opacity-50 ${STAMP_TEXT}`}
              >
                {isFetchingAttachment ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Paperclip className="h-3.5 w-3.5" />}
                {isFetchingAttachment ? "Loading..." : "View reviewer's attachment"}
              </button>
              {attachmentError && <p className="mt-2 text-xs text-brand-red">{attachmentError}</p>}
            </div>
          )}

          {submission.status === "approved" && (
            <Link
              href={`/notes/view/${submission.id}`}
              className={`mt-5 inline-block px-4 py-3 text-[11px] text-white transition-colors hover:bg-brand-red-hover ${STAMP_TEXT} ${STAMP_INK}`}
            >
              Open note &rarr;
            </Link>
          )}
        </div>
      </div>

      {/* Fix needed: upload the corrected file right here */}
      {needsFix &&
        (resubmitSuccess ? (
          <div className="mt-7 flex items-center gap-2.5 border-2 border-brand-red bg-[#fbecee] px-4 py-3.5 text-sm font-semibold text-gray-900">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-red" />
            Fixed file uploaded. It&apos;s back in the review queue.
          </div>
        ) : (
          <div className="mt-7">
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`flex cursor-pointer flex-col items-center border-2 border-dashed px-5 py-7 text-center transition-colors ${
                isDragging ? "border-brand-red bg-[#fbecee]" : "border-brand-red/45 hover:border-brand-red hover:bg-[#fffafa]"
              }`}
            >
              <UploadCloud className="h-6 w-6 text-brand-red" />
              <span className="mt-2 text-base font-bold text-gray-900">{file ? file.name : "Upload your fixed file"}</span>
              <span className="mt-1 text-[13px] text-gray-500">
                {file ? "Click to pick a different file" : "Drop it here or click to browse. PDF, DOCX, PPTX, PNG or JPG, up to 25 MB."}
              </span>
              <input
                type="file"
                accept={ALLOWED_FILE_EXTENSIONS}
                onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                className="sr-only"
              />
            </label>

            {resubmitError && (
              <p className="mt-3 border-l-4 border-brand-red bg-[#fbecee] px-3 py-2 text-xs text-brand-red">{resubmitError}</p>
            )}

            <button
              type="button"
              onClick={handleResubmit}
              disabled={!file || isResubmitting}
              className={`mt-3 flex w-full items-center justify-center gap-2 py-3.5 text-[11px] text-white transition-colors hover:bg-brand-red-hover disabled:cursor-not-allowed disabled:opacity-40 ${STAMP_TEXT} ${STAMP_INK}`}
            >
              {isResubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
              {isResubmitting ? "Uploading..." : "Resubmit fixed file"}
            </button>
          </div>
        ))}
    </div>
  );
}

// ═══ The right-hand pane: one saved note ════════════════════════════════════
function SavedNoteDetail({ note, onClose, onUnsave }: { note: SavedNote; onClose: () => void; onUnsave: () => void }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  // Same as the note viewer: fetch the file and save it with a readable name
  async function handleDownload() {
    if (!note.fileUrl || isDownloading) return;
    setDownloadError("");
    setIsDownloading(true);
    try {
      const response = await fetch(note.fileUrl);
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `${note.course_code}_${note.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch {
      setDownloadError("Couldn't download the file. Try opening it in the note viewer instead.");
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="p-4 sm:p-7 lg:p-9">
      {/* Phones/tablets: back to the list */}
      <button
        type="button"
        onClick={onClose}
        className={`mb-5 inline-flex items-center gap-1.5 text-[10px] text-gray-500 hover:text-brand-red lg:hidden ${STAMP_TEXT}`}
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Saved notes
      </button>

      <div className="flex flex-col gap-6 sm:flex-row sm:gap-7 lg:flex-col xl:flex-row">
        {/* First page — click it to open the note */}
        <Link
          href={`/notes/view/${note.id}`}
          aria-label={`Open ${note.title}`}
          className="mx-auto block h-[220px] w-[170px] shrink-0 overflow-hidden border border-black/[0.08] bg-white shadow-[0_14px_24px_-16px_rgba(0,0,0,0.4)] transition-transform hover:-translate-y-1 sm:mx-0 sm:h-[300px] sm:w-[230px] lg:h-[230px] lg:w-[180px] xl:h-[300px] xl:w-[230px]"
        >
          {note.fileUrl ? (
            <PdfThumbnail fileUrl={note.fileUrl} className="h-full w-full" fallback={<PaperFallback />} />
          ) : (
            <PaperFallback />
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <p className={LABEL}>{note.course_code}</p>
          <h2 className="mt-1.5 text-2xl font-black leading-[1.1] tracking-[-0.03em] text-gray-900 sm:text-[34px]">{note.title}</h2>
          {(note.author_name || note.created_at) && (
            <p className="mt-2 text-xs text-gray-500">
              {note.author_name && <>by {note.author_name}</>}
              {note.author_name && note.created_at && " \u00b7 "}
              {note.created_at && <>added {formatShortDate(note.created_at)}</>}
            </p>
          )}

          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
            <Link
              href={`/notes/view/${note.id}`}
              className={`flex items-center justify-center gap-2 px-5 py-3.5 text-[11px] text-white transition-colors hover:bg-brand-red-hover ${STAMP_TEXT} ${STAMP_INK}`}
            >
              Open in note viewer &rarr;
            </Link>
            {note.fileUrl && (
              <button
                type="button"
                onClick={handleDownload}
                disabled={isDownloading}
                className={`flex items-center justify-center gap-2 border-2 border-dashed border-brand-red px-5 py-3 text-[11px] text-brand-red transition-colors hover:border-solid disabled:opacity-60 ${STAMP_TEXT}`}
              >
                {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {isDownloading ? "Preparing..." : "Download"}
              </button>
            )}
          </div>
          {downloadError && <p className="mt-3 text-xs text-brand-red">{downloadError}</p>}

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-dashed border-brand-red/25 pt-4">
            <Link
              href={`/notes/${note.course_code}`}
              className={`inline-flex items-center gap-1.5 text-[10px] text-brand-red hover:underline ${STAMP_TEXT}`}
            >
              <FolderOpen className="h-3.5 w-3.5" /> More {note.course_code} notes
            </Link>
            <button
              type="button"
              onClick={onUnsave}
              className={`inline-flex items-center gap-1.5 text-[10px] text-gray-500 transition-colors hover:text-brand-red ${STAMP_TEXT}`}
            >
              <Trash2 className="h-3.5 w-3.5" /> Remove from saved
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══ The dashboard ════════════════════════════════════════════════════════════
export function DashboardView({
  submissions: rawSubmissions,
  savedNotes: rawSavedNotes,
  firstName,
}: {
  submissions: DatabaseSubmission[];
  savedNotes: DatabaseSavedNote[];
  firstName?: string | null;
}) {
  const [tab, setTab] = useState<"submissions" | "saved">("submissions");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Phones/tablets show the details as their own screen
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [savedNotes, setSavedNotes] = useState(rawSavedNotes);
  const [selectedSavedId, setSelectedSavedId] = useState<string | null>(null);

  // Saved rows with their note (rows whose note no longer exists are skipped)
  const savedItems = useMemo(
    () =>
      savedNotes.flatMap((row) => {
        const note = Array.isArray(row.notes) ? row.notes[0] : row.notes;
        return note ? [{ rowId: row.id, note }] : [];
      }),
    [savedNotes],
  );
  const selectedSaved = savedItems.find((item) => item.rowId === selectedSavedId) ?? savedItems[0] ?? null;

  const submissions: Submission[] = useMemo(
    () =>
      rawSubmissions
        .map((note) => ({
          id: note.id,
          title: note.title,
          code: note.course_code ?? "",
          status: toStatus(note.status),
          hours: note.hours_awarded ?? 0,
          feedback: note.flag_reason || undefined,
          hasAttachment: Boolean(note.feedback_attachment_key),
          sentAt: note.created_at,
          reviewedAt: note.reviewed_at,
          fileUrl: note.fileUrl,
        }))
        // Needs-a-fix first, then in review, then the rest (newest first within each)
        .sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)),
    [rawSubmissions],
  );

  // Brand-new contributor: every part of the dashboard shows where things will go
  const isNew = submissions.length === 0;

  const query = searchQuery.trim().toLowerCase();
  const filteredSubmissions = query
    ? submissions.filter((s) => s.title.toLowerCase().includes(query) || s.code.toLowerCase().includes(query.replace(/\s+/g, "")))
    : submissions;

  const selected = submissions.find((s) => s.id === selectedId) ?? filteredSubmissions[0] ?? null;

  function switchTab(next: "submissions" | "saved") {
    setTab(next);
    setIsDetailOpen(false);
  }

  function openSaved(rowId: string) {
    setSelectedSavedId(rowId);
    setIsDetailOpen(true);
  }

  function openSubmission(id: string) {
    setSelectedId(id);
    setIsDetailOpen(true);
  }

  // While the phone detail screen is open: no page scroll behind it, and Escape closes it
  useEffect(() => {
    if (!isDetailOpen) return;
    const mq = window.matchMedia("(max-width: 1023px)");
    if (mq.matches) document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setIsDetailOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [isDetailOpen]);

  async function handleUnsave(savedRowId: string, noteId: string) {
    setSavedNotes((prev) => prev.filter((s) => s.id !== savedRowId));
    if (savedRowId === selectedSaved?.rowId) setIsDetailOpen(false);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("saved_notes").delete().eq("user_id", user.id).eq("note_id", noteId);
  }

  const tabClass = (isActive: boolean) =>
    `flex-1 py-3.5 text-center text-[10px] transition-colors sm:text-[11px] ${STAMP_TEXT} ${
      isActive ? "text-brand-red shadow-[inset_0_-3px_0_#8F0018]" : "text-gray-500 hover:text-brand-red"
    }`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      // Centred, with the same space on both sides; on wide screens that space also clears the binder edge and lines up with the navbar logo
      className="w-full px-5 pb-20 pt-8 sm:px-8 sm:pt-12 lg:px-12 min-[1360px]:px-[var(--content-left,4rem)]"
    >
      <div className="mx-auto w-full max-w-[1440px]">
        {/* ─── Heading ─── */}
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className={LABEL}>{"// Your dashboard"}</p>
            <h1 className="mt-3 text-[2.5rem] font-black leading-none tracking-[-0.045em] text-gray-900 sm:text-6xl lg:text-[4.5rem]">
              Hi{firstName ? `, ${firstName}` : ""}.
            </h1>
            {isNew && (
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-gray-600 sm:mt-4 sm:text-lg">
                Your dashboard fills in as you share notes. Here&apos;s where everything will go.
              </p>
            )}
          </div>
          <Link
            href="/submit"
            className={`flex items-center justify-center gap-2 px-7 py-4 text-xs text-white transition-colors hover:bg-brand-red-hover sm:text-[13px] ${STAMP_TEXT} ${STAMP_INK}`}
          >
            <UploadCloud className="h-4 w-4" />
            {isNew ? "Submit your first notes" : "Submit new notes"}
          </Link>
        </header>

        {/* ─── Volunteer hours ─── */}
        <div className="mt-8">
          <HoursPanel submissions={submissions} />
        </div>

        {/* ─── Inbox: list on the left, details on the right ─── */}
        <section
          className={`mt-8 border-t-4 border-brand-red bg-white ${CARD_SHADOW} lg:grid lg:grid-cols-[360px_minmax(0,1fr)] xl:grid-cols-[440px_minmax(0,1fr)] ${isNew ? "lg:min-h-[400px]" : "lg:min-h-[560px]"}`}
        >
          <div className="min-w-0 lg:border-r-[1.5px] lg:border-[#eedadd]">
            <div role="tablist" aria-label="Your notes" className="flex border-b-[1.5px] border-[#eedadd]">
              <button
                type="button"
                role="tab"
                aria-selected={tab === "submissions"}
                onClick={() => switchTab("submissions")}
                className={tabClass(tab === "submissions")}
              >
                Submissions {submissions.length}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === "saved"}
                onClick={() => switchTab("saved")}
                className={tabClass(tab === "saved")}
              >
                Saved {savedItems.length}
              </button>
            </div>

            {tab === "submissions" ? (
              <>
                {submissions.length > 5 && (
                  <label className="flex items-center gap-2.5 border-b border-[#f3e7e8] px-4 py-3 sm:px-5">
                    <Search className="h-4 w-4 shrink-0 text-brand-red" />
                    <span className="sr-only">Search your submissions</span>
                    <input
                      type="text"
                      inputMode="search"
                      placeholder="Search your submissions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full min-w-0 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="text-gray-400 hover:text-brand-red"
                        aria-label="Clear search"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </label>
                )}

                {isNew ? (
                  // No submissions yet: a dashed "first note" slot where the list will be
                  <div className="p-4">
                    <Link
                      href="/submit"
                      className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 border-2 border-dashed border-brand-red/45 bg-[#fffafa] px-4 py-4 transition-colors hover:border-brand-red hover:bg-[#fbecee]"
                    >
                      <span className="min-w-0">
                        <span className={`block text-[9px] text-brand-red sm:text-[10px] ${STAMP_TEXT}`}>Your course</span>
                        <span className="mt-0.5 block text-base font-bold text-gray-900">Your first note</span>
                        <span className="mt-0.5 block text-xs text-gray-400">Not started yet</span>
                      </span>
                      <span
                        className={`px-3 py-2.5 text-[10px] text-white transition-colors group-hover:bg-brand-red-hover ${STAMP_TEXT} ${STAMP_INK}`}
                      >
                        Start &uarr;
                      </span>
                    </Link>
                    <div
                      aria-hidden="true"
                      className="mt-3 h-[62px] border-[1.5px] border-[#f3e7e8] bg-[repeating-linear-gradient(135deg,#fff_0_10px,#fcf6f6_10px_20px)]"
                    />
                    <div
                      aria-hidden="true"
                      className="mt-3 h-[62px] border-[1.5px] border-[#f3e7e8] bg-[repeating-linear-gradient(135deg,#fff_0_10px,#fcf6f6_10px_20px)] opacity-60"
                    />
                  </div>
                ) : filteredSubmissions.length > 0 ? (
                  <ul>
                    {filteredSubmissions.map((s) => {
                      const isActive = selected?.id === s.id;
                      return (
                        <li key={s.id}>
                          <button
                            type="button"
                            onClick={() => openSubmission(s.id)}
                            aria-current={isActive ? "true" : undefined}
                            className={`grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 border-b border-[#f3e7e8] px-4 py-3.5 text-left transition-colors sm:px-5 ${
                              isActive ? "lg:bg-[#fbecee] lg:shadow-[inset_4px_0_0_#8F0018]" : "hover:bg-[#fffafa]"
                            }`}
                          >
                            <span className="min-w-0">
                              {s.code && <span className={`block text-[9px] text-brand-red sm:text-[10px] ${STAMP_TEXT}`}>{s.code}</span>}
                              <span className="mt-0.5 block truncate text-base font-bold text-gray-900">{s.title}</span>
                              <span className="mt-0.5 block text-xs text-gray-400">
                                {s.sentAt ? `Sent ${formatShortDate(s.sentAt)}` : "Sent"}
                                {s.status === "approved" && s.hours > 0 ? ` · ${hoursLabel(s.hours)}` : ""}
                              </span>
                            </span>
                            <StatusStamp status={s.status} />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="px-6 py-14 text-center">
                    <p className="font-bold text-gray-900">Nothing matches that.</p>
                    <p className="mt-1 text-sm text-gray-500">Try a different title or course code.</p>
                  </div>
                )}
              </>
            ) : savedItems.length > 0 ? (
              <ul>
                {savedItems.map(({ rowId, note }) => {
                  const isActive = selectedSaved?.rowId === rowId;
                  return (
                    <li
                      key={rowId}
                      className={`flex items-center border-b border-[#f3e7e8] transition-colors ${
                        isActive ? "lg:bg-[#fbecee] lg:shadow-[inset_4px_0_0_#8F0018]" : "hover:bg-[#fffafa]"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => openSaved(rowId)}
                        aria-current={isActive ? "true" : undefined}
                        className="group min-w-0 flex-1 py-3.5 pl-4 text-left sm:pl-5"
                      >
                        <span className={`block text-[9px] text-brand-red sm:text-[10px] ${STAMP_TEXT}`}>{note.course_code}</span>
                        <span className="mt-0.5 block truncate text-base font-bold text-gray-900 group-hover:text-brand-red">
                          {note.title}
                        </span>
                        {note.author_name && <span className="mt-0.5 block truncate text-xs text-gray-400">by {note.author_name}</span>}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUnsave(rowId, note.id)}
                        className="shrink-0 p-4 text-gray-300 transition-colors hover:text-brand-red sm:pr-5"
                        title="Remove from saved"
                        aria-label={`Remove ${note.title} from saved`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="flex flex-col items-center px-6 py-14 text-center">
                <Bookmark className="h-6 w-6 text-gray-300" />
                <p className="mt-2 font-bold text-gray-900">No saved notes yet.</p>
                <p className="mt-1 text-sm text-gray-500">Tap the bookmark on any note to keep it here.</p>
                <Link href="/notes" className={`mt-5 text-[11px] text-brand-red hover:underline ${STAMP_TEXT}`}>
                  Browse the library &rarr;
                </Link>
              </div>
            )}
          </div>

          {/* Details: right-hand pane on laptops, its own screen on phones */}
          <div
            className={`${
              isDetailOpen ? "fixed inset-0 z-[60] block overflow-y-auto bg-white" : "hidden"
            } min-w-0 lg:static lg:z-auto lg:block lg:overflow-visible`}
          >
            {tab === "submissions" && selected ? (
              <SubmissionDetail key={selected.id} submission={selected} onClose={() => setIsDetailOpen(false)} />
            ) : tab === "saved" && selectedSaved ? (
              <SavedNoteDetail
                key={selectedSaved.rowId}
                note={selectedSaved.note}
                onClose={() => setIsDetailOpen(false)}
                onUnsave={() => handleUnsave(selectedSaved.rowId, selectedSaved.note.id)}
              />
            ) : tab === "submissions" && isNew ? (
              // No submissions yet: a preview of what this pane will show
              <div className="hidden h-full items-center gap-8 p-9 lg:flex">
                <div
                  aria-hidden="true"
                  className="h-[260px] w-[200px] shrink-0 overflow-hidden border-2 border-dashed border-brand-red/40 opacity-60"
                >
                  <PaperFallback />
                </div>
                <div className="max-w-md">
                  <p className={LABEL}>Up next</p>
                  <h2 className="mt-2 text-[28px] font-black leading-[1.15] tracking-[-0.03em] text-gray-900">
                    Your notes will appear here
                  </h2>
                  <p className="mt-2.5 text-sm leading-relaxed text-gray-600">
                    You&apos;ll see each note&apos;s review progress, feedback from our team, and the hours it earns.
                  </p>
                  <Link
                    href="/submit"
                    className={`mt-5 inline-block px-5 py-3.5 text-[11px] text-white transition-colors hover:bg-brand-red-hover ${STAMP_TEXT} ${STAMP_INK}`}
                  >
                    Submit your first notes &uarr;
                  </Link>
                </div>
              </div>
            ) : (
              <div className="hidden h-full flex-col items-center justify-center px-10 py-16 text-center lg:flex">
                <p className="text-lg font-black tracking-tight text-gray-900">
                  {tab === "saved" ? "Your saved notes" : "Nothing selected"}
                </p>
                <p className="mt-1.5 max-w-sm text-sm text-gray-500">
                  {tab === "saved"
                    ? "Open one from the list, or find more in the library."
                    : "Pick a submission on the left to see its details."}
                </p>
                {tab === "saved" && (
                  <Link href="/notes" className={`mt-5 px-5 py-3 text-[11px] text-white ${STAMP_TEXT} ${STAMP_INK}`}>
                    Browse the library &rarr;
                  </Link>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </motion.div>
  );
}