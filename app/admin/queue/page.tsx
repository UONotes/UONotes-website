"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { QueueHeader } from "@/components/admin/QueueHeader";
import { QueueStats } from "@/components/admin/QueueStats";
import { Loader2, FileText, AlertTriangle, Lock, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client"; 

type QueueNote = {
  id: string;
  title: string;
  course_code: string;
  status: string;
  created_at: string;
  reviewed_by: string | null;
  author_email: string;
  reviewer: any; // Captures joined admin profile data
};

export default function AdminQueuePage() {
  const [filter, setFilter] = useState<"all" | "pending" | "flagged" | "locked">("all");
  const [notes, setNotes] = useState<QueueNote[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch queue data on mount
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
          reviewer:reviewed_by(email)
        `)
        .in("status", ["pending", "flagged", "changes_requested"])
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Failed to fetch queue data:", error.message);
      } else {
        setNotes(data || []);
      }
      
      setLoading(false);
    }

    fetchQueue();
  }, []);

  // Dynamically calculate the stats based on real data
  const counts = useMemo(() => {
    let pending = 0;
    let flagged = 0;
    let locked = 0;

    notes.forEach((note) => {
      if (note.reviewed_by) locked++;
      else if (note.status === "flagged") flagged++;
      else pending++;
    });

    return { total: notes.length, pending, flagged, locked };
  }, [notes]);

  // Apply the active filter to the table view
  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      if (filter === "all") return true;
      if (filter === "locked") return note.reviewed_by !== null;
      if (filter === "flagged") return note.status === "flagged" && !note.reviewed_by;
      if (filter === "pending") return note.status !== "flagged" && !note.reviewed_by;
      return true;
    });
  }, [notes, filter]);

  return (
    <div className="relative min-h-screen p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none -z-10" />

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
        lockedCount={counts.locked}
      />

      <div className="shadow-sm rounded-3xl overflow-hidden border border-gray-100 bg-white relative min-h-[400px]">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-20 backdrop-blur-xs">
            <Loader2 className="w-8 h-8 text-brand-red animate-spin" />
          </div>
        )}
        
        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/80 border-b border-gray-100 text-xs font-mono uppercase text-gray-500 tracking-wider">
              <tr>
                <th className="px-6 py-5 font-semibold">Document Details</th>
                <th className="px-6 py-5 font-semibold">Submitter</th>
                <th className="px-6 py-5 font-semibold">Queue Status</th>
                <th className="px-6 py-5 font-semibold">Submitted</th>
                <th className="px-6 py-5 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredNotes.length === 0 && !loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-gray-400 font-medium">
                    No documents currently match this filter. The queue is clear.
                  </td>
                </tr>
              ) : (
                filteredNotes.map((note) => {
                  const isLocked = Boolean(note.reviewed_by);
                  const isFlagged = note.status === "flagged";
                  
                  // Safely extract the admin's email and grab just the first part for the UI
                  const adminEmail = (Array.isArray(note.reviewer) ? note.reviewer[0]?.email : note.reviewer?.email) || "Admin";
                  const adminName = adminEmail.split('@')[0];
                  
                  return (
                    <tr key={note.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4 min-w-[250px]">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                            isLocked ? 'bg-amber-50 text-amber-600 border border-amber-100/50' :
                            isFlagged ? 'bg-purple-50 text-purple-600 border border-purple-100/50' : 
                            'bg-blue-50 text-blue-600 border border-blue-100/50'
                          }`}>
                            {isLocked ? <Lock className="w-4 h-4" /> : 
                             isFlagged ? <AlertTriangle className="w-4 h-4" /> : 
                             <FileText className="w-4 h-4" />}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900 truncate max-w-[200px] sm:max-w-xs">{note.title}</span>
                            <span className="text-[10px] font-mono font-bold uppercase text-gray-500 tracking-wider">{note.course_code}</span>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <span className="text-xs text-gray-600 font-medium truncate max-w-[150px] inline-block">
                          {note.author_email || "Unknown"}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {isLocked ? (
                          <span 
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 text-[10px] font-mono font-bold uppercase tracking-wider border border-amber-200/60"
                            title={`Locked by ${adminEmail}`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Locked by {adminName}
                          </span>
                        ) : isFlagged ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 text-[10px] font-mono font-bold uppercase tracking-wider border border-purple-200/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> Flagged
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-[10px] font-mono font-bold uppercase tracking-wider border border-blue-200/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Pending
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span className="text-xs text-gray-500 font-mono">
                          {new Date(note.created_at).toLocaleDateString("en-US", {
                            month: "short", day: "numeric", year: "numeric"
                          })}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <Link 
                          href={`/admin/review/${note.id}`}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-900 text-white text-[11px] font-bold uppercase tracking-wider hover:bg-brand-red transition-colors shadow-sm active:scale-95"
                        >
                          Review <ArrowRight className="w-3.5 h-3.5" />
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