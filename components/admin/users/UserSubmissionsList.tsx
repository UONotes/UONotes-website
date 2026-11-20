"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, FileText, AlertTriangle, Wrench, ShieldCheck, Check, XCircle, Award, ArrowRight } from "lucide-react";

export type SubmissionStatus = "pending" | "approved" | "rejected" | "flagged" | "in_revision" | "fix_review";

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
  pending: { label: "Pending", icon: FileText, color: "text-slate-700", bg: "bg-slate-100", dot: "bg-slate-500" },
  approved: { label: "Approved", icon: Check, color: "text-emerald-700", bg: "bg-emerald-50", dot: "bg-emerald-500" },
  rejected: { label: "Rejected", icon: XCircle, color: "text-rose-700", bg: "bg-rose-50", dot: "bg-rose-500" },
  flagged: { label: "Flagged", icon: AlertTriangle, color: "text-brand-red", bg: "bg-brand-pink", dot: "bg-brand-red" },
  in_revision: { label: "Being fixed", icon: Wrench, color: "text-amber-700", bg: "bg-amber-50", dot: "bg-amber-500" },
  fix_review: { label: "Final check", icon: ShieldCheck, color: "text-stone-800", bg: "bg-stone-100", dot: "bg-stone-600" },
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
      in_revision: 0,
      fix_review: 0,
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
    { key: "pending", label: "Pending", dot: "bg-slate-500", active: "text-slate-700 border-slate-600" },
    { key: "approved", label: "Approved", dot: "bg-emerald-500", active: "text-emerald-700 border-emerald-600" },
    { key: "in_revision", label: "Being fixed", dot: "bg-amber-500", active: "text-amber-700 border-amber-600" },
    { key: "fix_review", label: "Final check", dot: "bg-stone-600", active: "text-stone-800 border-stone-700" },
    { key: "flagged", label: "Flagged", dot: "bg-brand-red", active: "text-brand-red border-brand-red" },
    { key: "rejected", label: "Rejected", dot: "bg-rose-500", active: "text-rose-700 border-rose-600" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-stretch gap-1 bg-white border border-brand-border-light rounded-lg p-1.5 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm whitespace-nowrap border-b-2 transition-colors ${
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

      <div className="relative bg-white p-2.5 rounded-lg border border-brand-border-light">
        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
          <Search className="w-4 h-4 text-gray-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title or course code"
          className="w-full pl-10 pr-9 py-2 bg-gray-50 hover:bg-gray-100/70 focus:bg-white border border-transparent rounded-lg text-sm text-gray-900 focus:outline-none focus:border-gray-300 transition-all placeholder:text-gray-400"
        />
      </div>

      <div className="bg-white border border-brand-border-light rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-brand-border-light">
          <p className="text-xs text-gray-400">
            {filtered.length === 0
              ? "Nothing matches those filters."
              : `Showing ${filtered.length} submission${filtered.length === 1 ? "" : "s"}.`}
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">No submissions yet.</div>
        ) : (
          <ul className="divide-y divide-brand-border-light">
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
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brand-red hover:bg-brand-red-hover text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
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