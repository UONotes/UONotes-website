"use client";

import { User, FileDigit, Calendar, Globe, Paperclip } from "lucide-react";

type NoteMeta = { 
  id: string;
  title: string; 
  courseCode: string; 
  uploaderEmail: string; 
  fileSize: number; 
  flagReason?: string | null;
  reporterEmail?: string | null;
  feedbackAttachmentUrl?: string | null;
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

export function DocumentMetadata({ note }: { note: NoteMeta }) {
  const hasFlag = Boolean(note.flagReason);
  const isChangesRequested = note.status === "changes_requested";
  const isResubmissionHistory = hasFlag && note.status === "pending";
  const formattedDate = new Date(note.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
  });

  return (
    <div className="flex flex-col">
      <div className="p-6 md:p-7 space-y-6">

        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-[#23201D] text-white text-xs font-semibold">
              {note.courseCode}
            </span>
            <span className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-medium">
              <Globe className="w-3 h-3 inline-block mr-1 -mt-0.5" />
              {note.language}
            </span>
          </div>

          <h2 className="font-logo text-2xl font-bold text-[#23201D] leading-snug">
            {note.title}
          </h2>

          {note.noteTypes && note.noteTypes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {note.noteTypes.map((type, i) => (
                <span key={i} className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
                  {type}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Flag / feedback box */}
        {hasFlag && (
          <div className={`p-4 rounded-xl border ${
            isChangesRequested ? "bg-orange-50 border-orange-200" :
            isResubmissionHistory ? "bg-slate-50 border-slate-200" :
            "bg-red-50 border-red-200"
          }`}>
            <p className={`text-xs font-semibold mb-1.5 ${
              isChangesRequested ? "text-orange-800" :
              isResubmissionHistory ? "text-slate-700" :
              "text-red-800"
            }`}>
              {isChangesRequested ? "Fixes requested by reviewer" :
               isResubmissionHistory ? "Previously requested — resubmitted" :
               "Community report"}
            </p>
            <p className={`text-sm leading-relaxed ${
              isChangesRequested ? "text-orange-950" :
              isResubmissionHistory ? "text-slate-800" :
              "text-red-950"
            }`}>
              {note.flagReason}
            </p>
            {isResubmissionHistory && (
              <p className="text-xs text-slate-500 mt-2">
                The student has already resubmitted a corrected file — this is the feedback from the last review.
              </p>
            )}
            {note.feedbackAttachmentUrl && ( <a>
              
                href={note.feedbackAttachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold mt-3 ${
                  isChangesRequested
                    ? "bg-orange-100 text-orange-800 hover:bg-orange-200"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              
                <Paperclip className="w-3 h-3" /> View reviewer&apos;s attachment
              </a>
            )}
            {!isChangesRequested && !isResubmissionHistory && note.reporterEmail && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-100 text-red-800 text-xs font-medium mt-2">
                <User className="w-3 h-3" /> Reported by {note.reporterEmail}
              </div>
            )}
          </div>
        )}

        {/* Details */}
        <div className="space-y-2.5 text-sm border-t border-black/5 pt-5">
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