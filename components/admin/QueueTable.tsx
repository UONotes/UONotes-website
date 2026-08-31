"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, AlertTriangle, Clock, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type QueueItem = {
  id: string;
  title: string;
  courseCode: string;
  uploaderEmail: string;
  submittedAt: string;
  status: string;
  claimedBy?: string | null;
  flagReason?: string | null;
};

function TimeAgo({ dateString }: { dateString: string }) {
  const [formattedTime, setFormattedTime] = useState<string>("");

  useEffect(() => {
    const calculateTime = () => {
      const diffMinutes = Math.floor((Date.now() - new Date(dateString).getTime()) / (1000 * 60));
      if (diffMinutes < 1) return "Just now";
      if (diffMinutes === 1) return "1m ago";
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${Math.floor(diffHours / 24)}d ago`;
    };

    setFormattedTime(calculateTime());
  }, [dateString]);

  if (!formattedTime) {
    return <span className="text-gray-400">Loading...</span>;
  }

  return <span>{formattedTime}</span>;
}

export function QueueTable({ initialNotes }: { initialNotes: QueueItem[] }) {
  return (
    <div className="bg-white border border-gray-100 rounded-3xl shadow-xs overflow-hidden relative">
      <div className="overflow-x-auto min-h-[320px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50 text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">
              <th className="p-4 pl-6">Document / Course</th>
              <th className="p-4">Submitter</th>
              <th className="p-4">Status / Flags</th>
              <th className="p-4">Queue Wait Time</th>
              <th className="p-4 pr-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs">
            {initialNotes.length === 0 ? (
              <motion.tr
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <td colSpan={5} className="p-16 text-center text-gray-400 font-mono">
                  Queue is completely clear. No pending submissions found.
                </td>
              </motion.tr>
            ) : (
              <AnimatePresence mode="popLayout">
                {initialNotes.map((note) => {
                  const isFlagged = note.status === "flagged";
                  const isLocked = Boolean(note.claimedBy && note.claimedBy.trim() !== "");
                  const isSlaBreached = false;

                  return (
                    <motion.tr
                      key={note.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="hover:bg-gray-50/85 transition-colors group"
                    >
                      <td className="p-4 pl-6">
                        <div className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                          <span className="truncate max-w-xs">{note.title}</span>
                        </div>
                        <div className="text-[10px] font-mono font-semibold text-gray-500 mt-0.5">
                          {note.courseCode}
                        </div>
                      </td>

                      <td className="p-4 font-medium text-gray-600 truncate max-w-[150px]" title={note.uploaderEmail}>
                        {note.uploaderEmail}
                      </td>

                      <td className="p-4 space-y-1">
                        {isFlagged ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 text-[10px] font-mono font-bold uppercase tracking-wider border border-purple-100">
                            <AlertTriangle className="w-3 h-3 text-purple-600" /> Flagged Report
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-mono font-bold uppercase tracking-wider border border-blue-100">
                            <Clock className="w-3 h-3 text-blue-600" /> Pending Review
                          </span>
                        )}

                        {isLocked && (
                          <div className="flex items-center gap-1.5 pt-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] font-mono border border-amber-200/60 shadow-2xs">
                              <Lock className="w-2.5 h-2.5 text-amber-600" />
                              Claimed by <strong className="font-semibold text-amber-900">{note.claimedBy}</strong>
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="p-4">
                        <span className={`text-xs font-mono font-medium ${isSlaBreached ? 'text-rose-600' : 'text-gray-600'}`}>
                          <TimeAgo dateString={note.submittedAt} />
                        </span>
                      </td>

                      <td className="p-4 pr-6 text-right">
                        <Link
                          href={`/admin/review/${note.id}`}
                          className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-gray-900 hover:bg-black text-white text-[11px] font-bold uppercase tracking-wider transition-all shadow-xs active:scale-[0.98]"
                        >
                          Inspect & Review
                        </Link>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}