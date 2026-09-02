"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FileUp, Clock, CheckCircle2, XCircle, Search, MessageSquareText, X } from "lucide-react";

const notebookStyle = {
  backgroundImage: `
    linear-gradient(90deg, transparent 64px, rgba(168, 49, 66, 0.15) 64px, rgba(168, 49, 66, 0.15) 66px, transparent 66px),
    linear-gradient(transparent 31px, #e5e7eb 32px)
  `,
  backgroundSize: "100% 100%, 100% 32px",
};

interface DatabaseSubmission {
  id: string;
  title: string;
  status: string;
  hours_awarded: number | null;
  flag_reason: string | null;
}

interface SubmissionItem {
  id: string;
  title: string;
  hours: number;
  status: "Pending" | "Accepted" | "Rejected";
  feedback?: string;
}

function mapStatus(status: string): SubmissionItem["status"] {
  if (status === "approved") return "Accepted";
  if (status === "rejected") return "Rejected";
  // pending, flagged, and changes_requested all read as "Pending" to the student
  return "Pending";
}

export function DashboardView({ submissions: rawSubmissions }: { submissions: DatabaseSubmission[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionItem | null>(null);

  const submissions: SubmissionItem[] = useMemo(
    () =>
      rawSubmissions.map((note) => ({
        id: note.id,
        title: note.title,
        hours: note.hours_awarded ?? 0,
        status: mapStatus(note.status),
        feedback: note.flag_reason || undefined,
      })),
    [rawSubmissions]
  );

  const filteredSubmissions = submissions.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = useMemo(() => {
    const totalSubmissions = submissions.length;
    const hoursEarned = submissions
      .filter((s) => s.status === "Accepted")
      .reduce((sum, s) => sum + s.hours, 0);
    const pendingSubmissions = submissions.filter((s) => s.status === "Pending").length;
    return { totalSubmissions, hoursEarned, pendingSubmissions };
  }, [submissions]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="w-full min-h-[calc(100vh-80px)] py-12 px-6 lg:px-12 flex flex-col items-center"
    >
      <div className="w-full max-w-7xl mx-auto flex flex-col gap-10">
        
        {/* Notebook Container - Larger and Spaced for Desktops */}
        <div 
          className="w-full bg-white p-8 sm:p-14 lg:p-16 rounded-3xl shadow-xl border border-brand-red/15 relative overflow-hidden"
          style={notebookStyle}
        >
          {/* Red Margin Line */}
          <div className="absolute top-0 bottom-0 left-16 sm:left-20 w-[2px] bg-[#a83142]/25 pointer-events-none z-0" />
          
          {/* Notebook Spine Shadow */}
          <div className="absolute top-0 left-0 bottom-0 w-10 sm:w-16 bg-gradient-to-r from-black/[0.04] to-transparent pointer-events-none z-10" />

          {/* Content Wrapper */}
          <div className="relative z-20 pl-8 sm:pl-12">

            {/* Header */}
            <div className="mb-10 border-b border-gray-200/80 pb-6">
              <span className="text-xs font-mono uppercase tracking-[0.3em] text-brand-red font-bold">
                uOttawa // Student Portal
              </span>
              <h1 className="text-4xl font-black tracking-tight font-sans text-gray-900 mt-1">
                Dashboard
              </h1>
            </div>

            {/* Statistics Cards */}
            <div className="mb-12">
              <div className="flex items-center gap-2 mb-5">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-red animate-pulse" />
                <h2 className="text-xl font-bold font-logo text-brand-red tracking-wide">Statistics Overview</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white/90 backdrop-blur-xs border border-brand-red/20 rounded-2xl p-6 text-center shadow-xs">
                  <p className="text-4xl font-black text-gray-900 mb-1 font-sans">{stats.totalSubmissions}</p>
                  <p className="text-xs font-mono uppercase tracking-wider text-gray-500 font-bold">Total Submissions</p>
                </div>
                <div className="bg-white/90 backdrop-blur-xs border border-brand-red/20 rounded-2xl p-6 text-center shadow-xs">
                  <p className="text-4xl font-black text-gray-900 mb-1 font-sans">{stats.hoursEarned}</p>
                  <p className="text-xs font-mono uppercase tracking-wider text-gray-500 font-bold">Hours Earned</p>
                </div>
                <div className="bg-white/90 backdrop-blur-xs border border-brand-red/20 rounded-2xl p-6 text-center shadow-xs">
                  <p className="text-4xl font-black text-gray-900 mb-1 font-sans">{stats.pendingSubmissions}</p>
                  <p className="text-xs font-mono uppercase tracking-wider text-gray-500 font-bold">Pending Submissions</p>
                </div>
              </div>

              {/* Submit Notes Action Button */}
              <div className="mt-8 flex justify-center">
                <Link
                  href="/submit"
                  className="inline-flex items-center gap-2.5 px-8 py-4 bg-brand-red text-white text-xs font-mono font-bold uppercase tracking-widest rounded-xl hover:bg-brand-red-hover transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <FileUp className="w-4 h-4" />
                  Submit New Notes
                </Link>
              </div>
            </div>

            {/* My Submissions Section */}
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-red animate-pulse" />
                  <h2 className="text-xl font-bold font-logo text-brand-red tracking-wide">My Submissions</h2>
                </div>

                {/* Search Bar */}
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search note titles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-sans focus:outline-none focus:border-brand-red/50 transition-colors shadow-xs"
                  />
                </div>
              </div>

              {/* Submissions Table */}
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50/80 text-[11px] font-mono font-bold uppercase tracking-wider text-gray-500">
                        <th className="py-4 px-6">Note Title</th>
                        <th className="py-4 px-6 text-center">Hours</th>
                        <th className="py-4 px-6 text-center">Status</th>
                        <th className="py-4 px-6 text-right">Feedback</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm font-sans text-gray-700">
                      {filteredSubmissions.length > 0 ? (
                        filteredSubmissions.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                            <td className="py-4 px-6 font-semibold text-gray-900">{item.title}</td>
                            <td className="py-4 px-6 text-center font-mono text-xs">{item.hours} hrs</td>
                            <td className="py-4 px-6 text-center">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider ${
                                item.status === "Accepted" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                                item.status === "Pending" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                                "bg-rose-50 text-rose-700 border border-rose-200"
                              }`}>
                                {item.status === "Accepted" && <CheckCircle2 className="w-3.5 h-3.5" />}
                                {item.status === "Pending" && <Clock className="w-3.5 h-3.5" />}
                                {item.status === "Rejected" && <XCircle className="w-3.5 h-3.5" />}
                                {item.status}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right">
                              {item.feedback ? (
                                <button
                                  onClick={() => setSelectedSubmission(item)}
                                  className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-brand-red bg-brand-red/10 hover:bg-brand-red hover:text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                                >
                                  <MessageSquareText className="w-3.5 h-3.5" />
                                  View Feedback
                                </button>
                              ) : (
                                <span className="text-gray-400 font-mono text-xs">N/A</span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-12 text-center text-gray-500 font-light">
                            {rawSubmissions.length === 0
                              ? "You haven't submitted any notes yet."
                              : "No submissions found matching your search."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>

      {/* Upgraded Reviewer Feedback Modal */}
      <AnimatePresence>
        {selectedSubmission && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-white p-8 rounded-3xl shadow-2xl max-w-lg w-full border border-brand-red/15 relative overflow-hidden"
            >
              <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-brand-red font-bold">Review Notes</span>
                  <h3 className="text-xl font-bold font-logo text-gray-900 mt-0.5">{selectedSubmission.title}</h3>
                </div>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-brand-red hover:text-white transition-colors cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-xs font-mono uppercase tracking-wider text-gray-400 font-bold mb-2">Reviewer Feedback Comment:</p>
                <div className="bg-[#FFF0F0]/60 border border-brand-red/20 p-5 rounded-2xl text-sm text-gray-800 leading-relaxed font-sans">
                  {selectedSubmission.feedback}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="px-6 py-2.5 bg-brand-red text-white text-xs font-mono font-bold uppercase tracking-wider rounded-xl hover:bg-brand-red-hover transition-all cursor-pointer shadow-sm"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}