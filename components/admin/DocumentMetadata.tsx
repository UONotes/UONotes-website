"use client";

import { User, FileDigit, Calendar, Globe, Flag, CornerUpLeft, ShieldCheck } from "lucide-react";
import { formatDateTime } from "@/lib/dateFormat";

export type NoteReport = {
  id: string;
  reason: string;
  reporterEmail: string | null;
  createdAt: string;
};

type NoteMeta = {
  id: string;
  title: string;
  courseCode: string;
  uploaderEmail: string;
  fileSize: number;
  flagReason?: string | null;
  createdAt: string;
  language: string;
  noteTypes: string[];
  status?: string;
};

function formatBytes(bytes: number) {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export type SentBackInfo = { note: string; by: string; at: string | null };

export type FinalCheckInfo = {
  checkerName: string;
  checkedAt: string | null;
  recommendation: "approve" | "reject" | null;
  isFix: boolean;
};

export function DocumentMetadata({
  note,
  reports = [],
  sentBack = null,
  finalCheck = null,
}: {
  note: NoteMeta;
  reports?: NoteReport[];
  // VP Notes sent this note back to pending; stays until it's decided.
  sentBack?: SentBackInfo | null;
  // Who sent the note to final check, for anyone viewing it there.
  finalCheck?: FinalCheckInfo | null;
}) {
  // flag_reason on an undecided note is feedback left by an earlier
  // review round (e.g. from the old "request fixes" flow).
  const hasEarlierFeedback = Boolean(note.flagReason) && note.status === "pending";
  // Reports made before note_reports existed only left their reason here.
  const legacyReport = reports.length === 0 && note.status === "flagged" ? note.flagReason : null;
  const formattedDate = formatDateTime(note.createdAt);

  return (
    <div className="flex flex-col">
      <div className="p-5 sm:p-6 space-y-5">

        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-brand-red text-white text-xs font-semibold">
              {note.courseCode}
            </span>
            <span className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-medium">
              <Globe className="w-3 h-3 inline-block mr-1 -mt-0.5" />
              {note.language}
            </span>
          </div>

          <h2 className="font-logo text-2xl font-bold text-brand-dark leading-snug">
            {note.title}
          </h2>

          {note.noteTypes && note.noteTypes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {note.noteTypes.map((type, i) => (
                <span key={i} className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                  {type}
                </span>
              ))}
            </div>
          )}
        </div>

        {finalCheck && (
          <div className="p-4 rounded-lg border bg-stone-100 border-stone-300 text-xs text-stone-900 leading-relaxed">
            <p className="font-semibold flex items-center gap-1.5 mb-1">
              <ShieldCheck className="w-3.5 h-3.5" /> In final check
            </p>
            <p>
              Sent by <span className="font-semibold">{finalCheck.checkerName}</span>
              {finalCheck.checkedAt && <> · {formatDateTime(finalCheck.checkedAt)}</>}
              {" — "}
              {finalCheck.isFix
                ? "fixed it and recommends the fixed version."
                : finalCheck.recommendation === "reject"
                  ? "recommends rejecting it."
                  : "recommends approving it."}
            </p>
          </div>
        )}

        {sentBack && (
          <div className="p-4 rounded-lg border bg-amber-50 border-amber-200">
            <p className="text-xs font-semibold mb-1.5 text-amber-800 flex items-center gap-1.5">
              <CornerUpLeft className="w-3.5 h-3.5" /> Sent back by {sentBack.by}
              {sentBack.at && <span className="font-normal text-amber-700/70">· {formatDateTime(sentBack.at)}</span>}
            </p>
            <p className="text-sm leading-relaxed text-amber-950 whitespace-pre-wrap">{sentBack.note}</p>
          </div>
        )}

        {/* Community reports — one entry per reporter */}
        {reports.length > 0 && (
          <div className="p-4 rounded-lg border bg-red-50 border-red-200 space-y-3">
            <p className="text-xs font-semibold text-red-800 flex items-center gap-1.5">
              <Flag className="w-3.5 h-3.5" />
              {reports.length === 1 ? "1 community report" : `${reports.length} community reports`}
            </p>
            <ul className="space-y-2.5">
              {reports.map((report) => (
                <li key={report.id} className="p-3 rounded-lg bg-white/70 border border-red-100">
                  <p className="text-sm text-red-950 leading-relaxed whitespace-pre-wrap">{report.reason}</p>
                  <p className="text-[11px] text-red-800/70 mt-1.5 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {report.reporterEmail || "Unknown user"} · {formatDateTime(report.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {legacyReport && (
          <div className="p-4 rounded-lg border bg-red-50 border-red-200">
            <p className="text-xs font-semibold mb-1.5 text-red-800">Community report</p>
            <p className="text-sm leading-relaxed text-red-950 whitespace-pre-wrap">{legacyReport}</p>
          </div>
        )}

        {hasEarlierFeedback && (
          <div className="p-4 rounded-lg border bg-slate-50 border-slate-200">
            <p className="text-xs font-semibold mb-1.5 text-slate-700">Feedback from an earlier review</p>
            <p className="text-sm leading-relaxed text-slate-800 whitespace-pre-wrap">{note.flagReason}</p>
          </div>
        )}

        {/* Details */}
        <div className="space-y-2.5 text-sm border-t border-brand-border-light pt-5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-gray-400"><User className="w-3.5 h-3.5" /> Submitter</span>
            <span className="font-medium text-gray-800 truncate max-w-[180px]" title={note.uploaderEmail}>{note.uploaderEmail}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-gray-400"><FileDigit className="w-3.5 h-3.5" /> File size</span>
            <span className="font-medium text-gray-800">{formatBytes(note.fileSize)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-gray-400"><Calendar className="w-3.5 h-3.5" /> Uploaded</span>
            <span className="font-medium text-gray-800">{formattedDate}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
