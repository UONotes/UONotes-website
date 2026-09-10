"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, FileText, AlertTriangle, RotateCcw, Check, XCircle, Award, ArrowRight } from "lucide-react";

export type SubmissionStatus = "pending" | "approved" | "rejected" | "flagged" | "changes_requested";

export type UserSubmission = {
  id: string;
  title: string;
  courseCode: string;
  status: SubmissionStatus;
  hoursAwarded: number | null;
  createdAt: string;
  reviewedAt: string | null;
  reason: string | null;
  reviewerName: string | null;
  linkHref: string | null;
};

type StatusFilter = "all" | SubmissionStatus;

const STATUS_META: Record<
  SubmissionStatus,
  { label: string; icon: typeof Check; color: string; bg: string; dot: string }
> = {
  pending: { label: "Pending", icon: FileText, color: "text-blue-700", bg: "bg-blue-50", dot: "bg-blue-500" },
  approved: { label: "Approved", icon: Check, color: "text-emerald-700", bg: "bg-emerald-50", dot: "bg-emerald-500" },
  rejected: { label: "Rejected", icon: XCircle, color: "text-rose-700", bg: "bg-rose-50", dot: "bg-rose-500" },
  flagged: { label: "Flagged", icon: AlertTriangle, color: "text-purple-700", bg: "bg-purple-50", dot: "bg-purple-500" },
  changes_requested: { label: "Awaiting fixes", icon: RotateCcw, color: "text-orange-700", bg: "bg-orange-50", dot: "bg-orange-500" },
};

function formatDate(dateString: string | null): string {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function UserSubmissionsList({ submissions }: { submissions: UserSubmission[] }) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = {
      all: submissions.length,
      pending: 0,
      approved: 0,
      rejected: 0,
      flagged: 0,
      changes_requested: 0,
    };
    submissions.forEach((s) => c[s.status]++);
    return c;
  }, [submissions]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return submissions.filter((s) => {
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (!q) return true;
      return s.title.toLowerCase().includes(q) || s.courseCode.toLowerCase().includes(q);
    });
  }, [submissions, statusFilter, query]);

  const tabs: { key: StatusFilter; label: string; dot: string; active: string }[] = [
    { key: "all", label: "All", dot: "bg-gray-400", active: "text-gray-900 border-gray-900" },
    { key: "pending", label: "Pending", dot: "bg-blue-500", active: "text-blue-700 border-blue-600" },
    { key: "approved", label: "Approved", dot: "bg-emerald-500", active: "text-emerald-700 border-emerald-600" },
    { key: "changes_requested", label: "Awaiting fixes", dot: "bg-orange-500", active: "text-orange-700 border-orange-600" },
    { key: "flagged", label: "Flagged", dot: "bg-purple-500", active: "text-purple-700 border-purple-600" },
    { key: "rejected", label: "Rejected", dot: "bg-rose-500", active: "text-rose-700 border-rose-600" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-stretch gap-1 bg-white border border-black/5 rounded-2xl p-1.5 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
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

      <div className="relative bg-white p-2.5 rounded-2xl border border-black/5">
        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
          <Search className="w-4 h-4 text-gray-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title or course code"
          className="w-full pl-10 pr-9 py-2 bg-gray-50 hover:bg-gray-100/70 focus:bg-white border border-transparent rounded-xl text-sm text-gray-900 focus:outline-none focus:border-gray-300 transition-all placeholder:text-gray-400"
        />
      </div>

      <div className="bg-white border border-black/5 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-black/5">
          <p className="text-xs text-gray-400">
            {filtered.length === 0
              ? "Nothing matches those filters."
              : `Showing ${filtered.length} submission${filtered.length === 1 ? "" : "s"}.`}
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">No submissions yet.</div>
        ) : (
          <ul className="divide-y divide-black/5">
            {filtered.map((s) => {
              const meta = STATUS_META[s.status];
              const Icon = meta.icon;
              return (
                <li key={s.id} className="px-6 py-4 flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${meta.bg} ${meta.color}`}>
                        <Icon className="w-3 h-3" /> {meta.label}
                      </span>
                      <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-[11px] font-medium">
                        {s.courseCode}
                      </span>
                      {s.status === "approved" && s.hoursAwarded != null && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50 text-amber-700 text-[11px] font-semibold">
                          <Award className="w-3 h-3" /> {s.hoursAwarded}h
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-semibold text-gray-900 truncate">{s.title}</p>

                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-400 flex-wrap">
                      <span>Submitted {formatDate(s.createdAt)}</span>
                      {s.reviewedAt && <span>· Reviewed {formatDate(s.reviewedAt)}</span>}
                      {s.reviewerName && <span>· by {s.reviewerName}</span>}
                    </div>

                    {s.reason && (
                      <p className="text-sm text-gray-600 mt-2 leading-relaxed">{s.reason}</p>
                    )}
                  </div>

                  {s.linkHref && (
                    <Link
                      href={s.linkHref}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#23201D] hover:bg-brand-red text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
                    >
                      View <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}