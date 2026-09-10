"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Check, XCircle, MessageSquareText, Paperclip, User, ArrowRight, FileX } from "lucide-react";

export type DecisionType = "NOTE_APPROVED" | "NOTE_REJECTED" | "NOTE_CHANGES_REQUESTED";

export type DecisionEntry = {
  id: string;
  noteId: string | null;
  noteExists: boolean;
  actionType: DecisionType;
  createdAt: string;
  title: string;
  courseCode: string;
  reason: string | null;
  attachmentUrl: string | null;
  submitterName: string | null;
  submitterEmail: string | null;
  reviewerId: string;
  reviewerName: string;
  reviewerEmail: string;
};

type DecisionFilter = "all" | DecisionType;

const DECISION_META: Record<
  DecisionType,
  { label: string; icon: typeof Check; color: string; bg: string; dot: string }
> = {
  NOTE_APPROVED: { label: "Approved", icon: Check, color: "text-emerald-700", bg: "bg-emerald-50", dot: "bg-emerald-500" },
  NOTE_REJECTED: { label: "Rejected", icon: XCircle, color: "text-rose-700", bg: "bg-rose-50", dot: "bg-rose-500" },
  NOTE_CHANGES_REQUESTED: { label: "Fixes requested", icon: MessageSquareText, color: "text-orange-700", bg: "bg-orange-50", dot: "bg-orange-500" },
};

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function DecisionHistoryExplorer({
  entries,
  reviewers,
}: {
  entries: DecisionEntry[];
  reviewers: { id: string; name: string }[];
}) {
  const [decisionFilter, setDecisionFilter] = useState<DecisionFilter>("all");
  const [reviewerFilter, setReviewerFilter] = useState<string>("all");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    const c: Record<DecisionFilter, number> = {
      all: entries.length,
      NOTE_APPROVED: 0,
      NOTE_REJECTED: 0,
      NOTE_CHANGES_REQUESTED: 0,
    };
    entries.forEach((e) => {
      c[e.actionType]++;
    });
    return c;
  }, [entries]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((e) => {
      if (decisionFilter !== "all" && e.actionType !== decisionFilter) return false;
      if (reviewerFilter !== "all" && e.reviewerId !== reviewerFilter) return false;
      if (!q) return true;
      return (
        e.title.toLowerCase().includes(q) ||
        e.courseCode.toLowerCase().includes(q) ||
        e.reviewerName.toLowerCase().includes(q) ||
        e.reviewerEmail.toLowerCase().includes(q) ||
        (e.submitterName?.toLowerCase().includes(q) ?? false) ||
        (e.submitterEmail?.toLowerCase().includes(q) ?? false) ||
        (e.reason?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [entries, decisionFilter, reviewerFilter, query]);

  const tabs: { key: DecisionFilter; label: string; dot: string; active: string }[] = [
    { key: "all", label: "All", dot: "bg-gray-400", active: "text-gray-900 border-gray-900" },
    { key: "NOTE_APPROVED", label: "Approved", dot: "bg-emerald-500", active: "text-emerald-700 border-emerald-600" },
    { key: "NOTE_REJECTED", label: "Rejected", dot: "bg-rose-500", active: "text-rose-700 border-rose-600" },
    { key: "NOTE_CHANGES_REQUESTED", label: "Fixes requested", dot: "bg-orange-500", active: "text-orange-700 border-orange-600" },
  ];

  return (
    <div className="space-y-4">
      {/* Decision tabs */}
      <div className="flex items-stretch gap-1 bg-white border border-black/5 rounded-2xl p-1.5 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = decisionFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setDecisionFilter(tab.key)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm whitespace-nowrap border-b-2 transition-colors ${
                isActive ? `${tab.active} bg-gray-50/80 font-semibold` : "text-gray-500 border-transparent hover:bg-gray-50 hover:text-gray-700"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${tab.dot}`} />
              {tab.label}
              <span className={`text-xs ${isActive ? "font-bold" : "text-gray-400"}`}>{counts[tab.key]}</span>
            </button>
          );
        })}
      </div>

      {/* Search + reviewer filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-2.5 rounded-2xl border border-black/5">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, course, reviewer, or reason"
            className="w-full pl-10 pr-9 py-2 bg-gray-50 hover:bg-gray-100/70 focus:bg-white border border-transparent rounded-xl text-sm text-gray-900 focus:outline-none focus:border-gray-300 transition-all placeholder:text-gray-400"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute inset-y-0 right-3.5 flex items-center text-gray-400 hover:text-gray-600 text-xs font-medium"
            >
              Clear
            </button>
          )}
        </div>

        <select
          value={reviewerFilter}
          onChange={(e) => setReviewerFilter(e.target.value)}
          className="px-3.5 py-2.5 bg-gray-50 hover:bg-gray-100/70 border border-transparent rounded-xl text-sm text-gray-700 focus:outline-none focus:border-gray-300 transition-all sm:w-56 shrink-0"
        >
          <option value="all">All reviewers</option>
          {reviewers.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      {/* List */}
      <div className="bg-white border border-black/5 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-black/5">
          <p className="text-xs text-gray-400">
            {filtered.length === 0
              ? "Nothing matches those filters."
              : `Showing ${filtered.length} decision${filtered.length === 1 ? "" : "s"}.`}
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">Nothing to show yet.</div>
        ) : (
          <ul className="divide-y divide-black/5">
            {filtered.map((entry) => {
              const meta = DECISION_META[entry.actionType];
              const Icon = meta.icon;
              return (
                <li key={entry.id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${meta.bg} ${meta.color}`}>
                          <Icon className="w-3 h-3" /> {meta.label}
                        </span>
                        <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-[11px] font-medium">
                          {entry.courseCode}
                        </span>
                      </div>

                      <p className="text-sm font-semibold text-gray-900 truncate flex items-center gap-1.5">
                        <span className="truncate">{entry.title}</span>
                        {!entry.noteExists && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-400 shrink-0">
                            <FileX className="w-3 h-3" /> file removed
                          </span>
                        )}
                      </p>

                      <div className="flex flex-col gap-1 mt-1.5 text-xs text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-4 rounded-full bg-red-50 text-brand-red flex items-center justify-center font-semibold text-[9px] shrink-0">
                            {entry.reviewerName.charAt(0).toUpperCase()}
                          </div>
                          <span className="truncate">
                            Reviewed by <span className="font-medium text-gray-700">{entry.reviewerName}</span>
                            {entry.reviewerEmail && <span className="text-gray-400"> · {entry.reviewerEmail}</span>}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-4 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center shrink-0">
                            <User className="w-2.5 h-2.5" />
                          </div>
                          <span className="truncate">
                            Submitted by{" "}
                            <span className="font-medium text-gray-700">
                              {entry.submitterName || entry.submitterEmail || "Unknown submitter"}
                            </span>
                            {entry.submitterName && entry.submitterEmail && (
                              <span className="text-gray-400"> · {entry.submitterEmail}</span>
                            )}
                          </span>
                        </div>
                      </div>

                      {entry.reason && (
                        <p className="text-sm text-gray-600 mt-2 leading-relaxed">{entry.reason}</p>
                      )}

                      {entry.attachmentUrl && (
                        <a
                          href={entry.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-orange-50 text-orange-700 text-xs font-semibold mt-2 hover:bg-orange-100 transition-colors"
                        >
                          <Paperclip className="w-3 h-3" /> View attachment
                        </a>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <Link
                        href={`/admin/history/${entry.id}`}
                        title={`View "${entry.title}" (${entry.courseCode})`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#23201D] hover:bg-brand-red text-white text-xs font-semibold transition-colors whitespace-nowrap"
                      >
                        View <ArrowRight className="w-3 h-3" />
                      </Link>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {formatDateTime(entry.createdAt)}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}