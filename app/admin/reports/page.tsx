"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, Flag, Eye, Check, X, ShieldAlert } from "lucide-react";

type ContentReport = {
  id: string;
  noteId: string;
  noteTitle: string;
  courseCode: string;
  reportedBy: string;
  reason: string;
  details: string;
  createdAt: string;
  status: "PENDING" | "RESOLVED" | "DISMISSED";
};

const INITIAL_REPORTS: ContentReport[] = [
  {
    id: "rep_1",
    noteId: "note_1",
    noteTitle: "Midterm Formula Sheet",
    courseCode: "MAT1348",
    reportedBy: "student_alex@uottawa.ca",
    reason: "Incorrect Course Code",
    details: "This is actually for MAT1341, not 1348. It will confuse people studying discrete math.",
    createdAt: "2 hours ago",
    status: "PENDING",
  },
  {
    id: "rep_2",
    noteId: "note_2",
    noteTitle: "Lecture 1-4 Complete Notes",
    courseCode: "CSI2110",
    reportedBy: "anon_student@uottawa.ca",
    reason: "Copyright / Plagiarism",
    details: "These slides are directly copy-pasted from Professor Morin's copyrighted portal slides without permission.",
    createdAt: "1 day ago",
    status: "PENDING",
  },
];

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ContentReport[]>(INITIAL_REPORTS);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const handleResolveReport = async (reportId: string, newStatus: "RESOLVED" | "DISMISSED") => {
    setIsProcessing(reportId);
    setReports(reports.map(r => r.id === reportId ? { ...r, status: newStatus } : r));

    try {
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      alert("Failed to update report status.");
      setReports(reports.map(r => r.id === reportId ? { ...r, status: "PENDING" } : r));
    } finally {
      setIsProcessing(null);
    }
  };

  const pendingCount = reports.filter(r => r.status === "PENDING").length;

  return (
    <div className="w-full flex flex-col gap-8 animate-in fade-in duration-500">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Content Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Review flagged documents, copyright claims, and metadata errors.</p>
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-amber-50 border border-amber-100 rounded-full text-amber-700 text-xs font-mono font-bold">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          {pendingCount} Pending Action{pendingCount === 1 ? "" : "s"}
        </div>
      </div>

      {/* Modern Card Stack Instead of Heavy Table */}
      <div className="flex flex-col gap-4">
        {reports.map((report) => {
          const isPending = report.status === "PENDING";
          return (
            <div 
              key={report.id} 
              className={`bg-white border rounded-2xl p-6 transition-all shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ${
                isPending ? "border-gray-100 hover:border-gray-200" : "border-gray-100/60 bg-gray-50/40 opacity-60"
              }`}
            >
              
              {/* Left Side: Details */}
              <div className="flex items-start gap-4 flex-1">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${
                  isPending ? "bg-amber-50 text-amber-600" : "bg-gray-100 text-gray-400"
                }`}>
                  <ShieldAlert className="w-5 h-5" />
                </div>

                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-gray-900 text-base">{report.noteTitle}</h3>
                    <span className="text-[11px] font-mono font-bold text-brand-red bg-brand-red/5 px-2 py-0.5 rounded-md border border-brand-red/10">
                      {report.courseCode}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50/80 px-2 py-0.5 rounded-md border border-amber-100/60">
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                      {report.reason}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 bg-gray-50/80 p-3 rounded-xl border border-gray-100/80 max-w-2xl leading-relaxed font-medium">
                    &ldquo;{report.details}&rdquo;
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-gray-400 font-mono pt-1">
                    <span>Reported by <strong className="text-gray-700">{report.reportedBy}</strong></span>
                    <span>•</span>
                    <span>{report.createdAt}</span>
                  </div>
                </div>
              </div>

              {/* Right Side: Actions & Status */}
              <div className="flex items-center gap-3 w-full md:w-auto justify-end pt-4 md:pt-0 border-t md:border-t-0 border-gray-100 shrink-0">
                <Link 
                  href={`/admin/review/${report.noteId}`} 
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200/60 shadow-xs"
                >
                  <Eye className="w-3.5 h-3.5 text-gray-500" /> Review File
                </Link>

                {isPending ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleResolveReport(report.id, "DISMISSED")}
                      disabled={isProcessing === report.id}
                      className="px-3.5 py-2 text-xs font-semibold rounded-xl text-gray-600 bg-white hover:bg-gray-50 border border-gray-200 transition-colors disabled:opacity-50 shadow-xs"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={() => handleResolveReport(report.id, "RESOLVED")}
                      disabled={isProcessing === report.id}
                      className="px-3.5 py-2 text-xs font-semibold rounded-xl text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm shadow-rose-600/20 disabled:opacity-50"
                    >
                      Take Offline
                    </button>
                  </div>
                ) : (
                  <span className="px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider rounded-lg bg-gray-100 text-gray-500">
                    {report.status}
                  </span>
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}