import {
  Check,
  XCircle,
  MessageSquareText,
  Paperclip,
  User,
  Calendar,
  FileDigit,
  Globe,
  Award,
  Clock3,
} from "lucide-react";

export type DecisionType = "NOTE_APPROVED" | "NOTE_REJECTED" | "NOTE_CHANGES_REQUESTED";

export type DecisionDetail = {
  actionType: DecisionType;
  decidedAt: string;
  reviewerName: string;
  reviewerEmail: string;
  reason: string | null;
  attachmentUrl: string | null;
  hoursAwarded: number | null;
  title: string;
  courseCode: string;
  language: string | null;
  noteTypes: string[];
  submitterName: string | null;
  submitterEmail: string | null;
  submittedAt: string | null;
  fileSize: number | null;
  currentStatus: string | null;
  noteExists: boolean;
};

const DECISION_META: Record<
  DecisionType,
  { label: string; icon: typeof Check; color: string; bg: string; border: string }
> = {
  NOTE_APPROVED: { label: "Approved", icon: Check, color: "text-emerald-800", bg: "bg-emerald-50", border: "border-emerald-200" },
  NOTE_REJECTED: { label: "Rejected", icon: XCircle, color: "text-rose-800", bg: "bg-rose-50", border: "border-rose-200" },
  NOTE_CHANGES_REQUESTED: { label: "Fixes requested", icon: MessageSquareText, color: "text-orange-800", bg: "bg-orange-50", border: "border-orange-200" },
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
  flagged: "Flagged",
  changes_requested: "Awaiting fixes",
};

function formatBytes(bytes: number | null) {
  if (!bytes || bytes === 0) return "—";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatDateTime(dateString: string | null) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function DecisionDetailPanel({ detail }: { detail: DecisionDetail }) {
  const meta = DECISION_META[detail.actionType];
  const Icon = meta.icon;
  const currentStatusChanged =
    detail.currentStatus && detail.currentStatus !== decisionToStatus(detail.actionType);

  return (
    <div className="flex flex-col">
      <div className="p-6 md:p-7 space-y-6">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-md bg-[#23201D] text-white text-xs font-semibold">
              {detail.courseCode}
            </span>
            {detail.language && (
              <span className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-medium">
                <Globe className="w-3 h-3 inline-block mr-1 -mt-0.5" />
                {detail.language}
              </span>
            )}
          </div>

          <h2 className="font-logo text-2xl font-bold text-[#23201D] leading-snug">{detail.title}</h2>

          {detail.noteTypes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {detail.noteTypes.map((type, i) => (
                <span key={i} className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
                  {type}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Decision */}
        <div className={`p-4 rounded-xl border ${meta.bg} ${meta.border}`}>
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className={`inline-flex items-center gap-1.5 text-sm font-bold ${meta.color}`}>
              <Icon className="w-4 h-4" /> {meta.label}
            </span>
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Clock3 className="w-3 h-3" /> {formatDateTime(detail.decidedAt)}
            </span>
          </div>

          <div className="flex items-center gap-2 mb-2.5">
            <div className="w-6 h-6 rounded-full bg-white text-[#23201D] flex items-center justify-center font-semibold text-[11px] shrink-0 shadow-sm">
              {detail.reviewerName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">{detail.reviewerName}</p>
              {detail.reviewerEmail && <p className="text-[11px] text-gray-500 truncate">{detail.reviewerEmail}</p>}
            </div>
          </div>

          {detail.reason && (
            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{detail.reason}</p>
          )}

          {detail.attachmentUrl && (
            <a
              href={detail.attachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white/70 text-gray-700 text-xs font-semibold mt-3 hover:bg-white transition-colors border border-black/5"
            >
              <Paperclip className="w-3 h-3" /> View reviewer&apos;s attachment
            </a>
          )}

          {detail.actionType === "NOTE_APPROVED" && detail.hoursAwarded != null && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/70 text-emerald-800 text-xs font-semibold mt-3 border border-black/5">
              <Award className="w-3 h-3" /> {detail.hoursAwarded} volunteer hour{detail.hoursAwarded === 1 ? "" : "s"} awarded
            </div>
          )}
        </div>

        {currentStatusChanged && detail.noteExists && (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
            This note&apos;s current status has since moved on to{" "}
            <span className="font-semibold text-slate-800">{STATUS_LABEL[detail.currentStatus!] || detail.currentStatus}</span>.
            This panel shows the decision as it was made at the time.
          </div>
        )}

        {!detail.noteExists && (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
            This note no longer exists in the system. The details below reflect what was on file at the time of the decision.
          </div>
        )}

        {/* Details */}
        <div className="space-y-2.5 text-sm border-t border-black/5 pt-5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-gray-400">
              <User className="w-3.5 h-3.5" /> Submitter
            </span>
            <span className="text-right">
              <span className="block font-medium text-gray-800 truncate max-w-[180px]">
                {detail.submitterName || detail.submitterEmail || "Unknown"}
              </span>
              {detail.submitterName && detail.submitterEmail && (
                <span className="block text-[11px] text-gray-400 truncate max-w-[180px]">{detail.submitterEmail}</span>
              )}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-gray-400">
              <FileDigit className="w-3.5 h-3.5" /> File size
            </span>
            <span className="font-medium text-gray-800">{formatBytes(detail.fileSize)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-gray-400">
              <Calendar className="w-3.5 h-3.5" /> Originally submitted
            </span>
            <span className="font-medium text-gray-800">{formatDateTime(detail.submittedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function decisionToStatus(actionType: DecisionType): string {
  if (actionType === "NOTE_APPROVED") return "approved";
  if (actionType === "NOTE_REJECTED") return "rejected";
  return "changes_requested";
}