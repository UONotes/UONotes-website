"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { QueueHeader } from "@/components/admin/QueueHeader";
import { QueueStats } from "@/components/admin/QueueStats";
import { Loader2, FileText, AlertTriangle, Lock, RotateCcw, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client"; 

type QueueNote = {
  id: string;
  title: string;
  course_code: string;
  status: string;
  created_at: string;
  reviewed_by: string | null;
  author_email: string;
  flag_reason: string | null;
};

type QueueFilter = "all" | "pending" | "flagged" | "changes_requested" | "locked";

export default function AdminQueuePage() {
  const [filter, setFilter] = useState<QueueFilter>("all");
  const [notes, setNotes] = useState<QueueNote[]>([]);
  const [reviewerEmails, setReviewerEmails] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchQueue() {
      setLoading(true);
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from("notes")
        .select(`
          id,
          title,
          course_code,
          status,
          created_at,
          reviewed_by,
          author_email,
          flag_reason
        `)
        .in("status", ["pending", "flagged", "changes_requested"])
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Failed to fetch queue data:", error.message);
        setLoading(false);
        return;
      }

      setNotes(data || []);

      const reviewerIds = Array.from(
        new Set((data || []).map((note) => note.reviewed_by).filter((id): id is string => Boolean(id)))
      );

      if (reviewerIds.length > 0) {
        const { data: reviewerProfiles, error: reviewerError } = await supabase
          .from("profiles")
          .select("id, email")
          .in("id", reviewerIds);

        if (reviewerError) {
          console.error("Failed to fetch reviewer emails:", reviewerError.message);
        } else {
          const emailMap: Record<string, string> = {};
          (reviewerProfiles || []).forEach((profile) => {
            emailMap[profile.id] = profile.email;
          });
          setReviewerEmails(emailMap);
        }
      }

      setLoading(false);
    }

    fetchQueue();
  }, []);

  const counts = useMemo(() => {
    let pending = 0;
    let flagged = 0;
    let changesRequested = 0;
    let locked = 0;

    notes.forEach((note) => {
      if (note.reviewed_by) {
        locked++;
        return;
      }
      if (note.status === "flagged") {
        flagged++;
      } else if (note.status === "changes_requested") {
        changesRequested++;
      } else {
        pending++;
      }
    });

    return { total: notes.length, pending, flagged, changesRequested, locked };
  }, [notes]);

  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      if (filter === "all") return true;
      if (filter === "locked") return note.reviewed_by !== null;
      if (filter === "flagged") return note.status === "flagged" && !note.reviewed_by;
      if (filter === "changes_requested") return note.status === "changes_requested" && !note.reviewed_by;
      if (filter === "pending") return note.status === "pending" && !note.reviewed_by;
      return true;
    });
  }, [notes, filter]);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <QueueHeader 
        activeFilter={filter} 
        onClearFilter={() => setFilter("all")} 
      />
      
      <QueueStats 
        activeFilter={filter} 
        onSelectFilter={setFilter} 
        totalCount={counts.total}
        pendingCount={counts.pending}
        flaggedCount={counts.flagged}
        changesRequestedCount={counts.changesRequested}
        lockedCount={counts.locked}
      />

      <div className="bg-white rounded-2xl border border-black/5 overflow-hidden relative min-h-[300px]">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-20">
            <Loader2 className="w-6 h-6 text-brand-red animate-spin" />
          </div>
        )}
        
        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm text-left">
            <thead className="border-b border-black/5 text-xs text-gray-400">
              <tr>
                <th className="px-5 py-3.5 font-medium">Document</th>
                <th className="px-5 py-3.5 font-medium">Submitter</th>
                <th className="px-5 py-3.5 font-medium">Status</th>
                <th className="px-5 py-3.5 font-medium">Submitted</th>
                <th className="px-5 py-3.5 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {filteredNotes.length === 0 && !loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center text-gray-400 text-sm">
                    Nothing here right now.
                  </td>
                </tr>
              ) : (
                filteredNotes.map((note) => {
                  const isLocked = Boolean(note.reviewed_by);
                  const isFlagged = note.status === "flagged";
                  const isChangesRequested = note.status === "changes_requested";
                  const wasResubmitted = note.status === "pending" && Boolean(note.flag_reason);

                  const adminEmail = (note.reviewed_by && reviewerEmails[note.reviewed_by]) || "Admin";
                  const adminName = adminEmail.split('@')[0];
                  
                  return (
                    <tr key={note.id} className="hover:bg-gray-50/60 transition-colors group">
                      <td className="px-5 py-3.5 min-w-[240px]">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isLocked ? 'bg-amber-50 text-amber-600' :
                            isFlagged ? 'bg-purple-50 text-purple-600' :
                            isChangesRequested ? 'bg-orange-50 text-orange-600' :
                            'bg-blue-50 text-blue-600'
                          }`}>
                            {isLocked ? <Lock className="w-3.5 h-3.5" /> : 
                             isFlagged ? <AlertTriangle className="w-3.5 h-3.5" /> :
                             isChangesRequested ? <RotateCcw className="w-3.5 h-3.5" /> :
                             <FileText className="w-3.5 h-3.5" />}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-gray-900 truncate max-w-[220px] sm:max-w-xs">{note.title}</span>
                            <span className="text-xs text-gray-400">{note.course_code}</span>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-5 py-3.5">
                        <span className="text-xs text-gray-500 truncate max-w-[150px] inline-block">
                          {note.author_email || "Unknown"}
                        </span>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {isLocked ? (
                            <span 
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[11px] font-semibold"
                              title={`Locked by ${adminEmail}`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> {adminName}
                            </span>
                          ) : isFlagged ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-[11px] font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> Flagged
                            </span>
                          ) : isChangesRequested ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 text-[11px] font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-500" /> Awaiting fixes
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Pending
                            </span>
                          )}
                          {wasResubmitted && (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold"
                              title="Previously sent back for fixes, just resubmitted"
                            >
                              <RotateCcw className="w-3 h-3" /> Resubmitted
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="text-xs text-gray-400">
                          {new Date(note.created_at).toLocaleDateString("en-US", {
                            month: "short", day: "numeric"
                          })}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <Link
                          href={`/admin/review/${note.id}`}
                          prefetch={false}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-white text-xs font-semibold transition-colors ${
                            isChangesRequested ? "bg-orange-600 hover:bg-orange-700" : "bg-[#23201D] hover:bg-brand-red"
                          }`}
                        >
                          {isChangesRequested ? "View" : "Review"} <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}