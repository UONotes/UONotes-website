"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { QueueHeader } from "@/components/admin/QueueHeader";
import { QueueStats } from "@/components/admin/QueueStats";
import { Loader2, FileText, AlertTriangle, Lock, RotateCcw, ArrowRight, Wrench, ShieldCheck, CornerUpLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatShortDate } from "@/lib/dateFormat";
import { isClaimActive } from "@/lib/review";
import type { QueueFilter } from "./filters";

type QueueNote = {
  id: string;
  title: string;
  course_code: string;
  status: string;
  created_at: string;
  reviewed_by: string | null;
  claimed_at: string | null;
  author_email: string;
  flag_reason: string | null;
  checked_by: string | null;
  recommendation: "approve" | "reject" | null;
  corrected_file_key: string | null;
  returned_at: string | null;
  return_note: string | null;
};


// Each note's status tab. Notes being fixed stay under Being fixed whether
// or not the fixer's claim is still active; for everything else an active
// claim moves the note out of its status tab, and a lapsed claim puts it
// back up for grabs. The Claimed tab is separate (see inTab).
function bucketOf(note: QueueNote): Exclude<QueueFilter, "all"> {
  if (note.status === "in_revision") return "in_revision";
  if (isClaimActive(note)) return "locked";
  if (note.status === "fix_review") return "fix_review";
  return note.status === "flagged" ? "flagged" : "pending";
}

// Claimed shows everything someone is actively holding right now, across
// statuses — including notes being fixed and notes in final check.
function inTab(note: QueueNote, filter: QueueFilter) {
  if (filter === "all") return true;
  if (filter === "locked") return isClaimActive(note);
  return bucketOf(note) === filter;
}

export function QueueView({ initialFilter }: { initialFilter: QueueFilter }) {
  const [filter, setFilterState] = useState<QueueFilter>(initialFilter);
  // Keep ?filter= in the URL so filtered views can be linked to and survive a reload
  const setFilter = (next: QueueFilter) => {
    setFilterState(next);
    const url = new URL(window.location.href);
    if (next === "all") url.searchParams.delete("filter");
    else url.searchParams.set("filter", next);
    window.history.replaceState(window.history.state, "", url);
  };
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
          claimed_at,
          author_email,
          flag_reason,
          checked_by,
          recommendation,
          corrected_file_key,
          returned_at,
          return_note
        `)
        .in("status", ["pending", "flagged", "in_revision", "fix_review"])
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Failed to fetch queue data:", error.message);
        setLoading(false);
        return;
      }

      setNotes(data || []);

      const reviewerIds = Array.from(
        new Set((data || []).flatMap((note) => [note.reviewed_by, note.checked_by]).filter((id): id is string => Boolean(id)))
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
    const c = { total: notes.length, pending: 0, flagged: 0, in_revision: 0, fix_review: 0, locked: 0 };
    notes.forEach((note) => {
      const bucket = bucketOf(note);
      if (bucket !== "locked") c[bucket]++;
      if (isClaimActive(note)) c.locked++;
    });
    return c;
  }, [notes]);

  const filteredNotes = useMemo(() => {
    return notes.filter((note) => inTab(note, filter));
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
        beingFixedCount={counts.in_revision}
        finalCheckCount={counts.fix_review}
        lockedCount={counts.locked}
      />

      <div className="bg-white rounded-lg border border-brand-border-light overflow-hidden relative min-h-[300px]">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-20">
            <Loader2 className="w-6 h-6 text-brand-red animate-spin" />
          </div>
        )}
        
        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm text-left">
            <thead className="border-b border-brand-border-light text-xs text-gray-400">
              <tr>
                <th className="px-5 py-3.5 font-medium">Document</th>
                <th className="px-5 py-3.5 font-medium">Submitter</th>
                <th className="px-5 py-3.5 font-medium">Status</th>
                <th className="px-5 py-3.5 font-medium">Submitted</th>
                <th className="px-5 py-3.5 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border-light">
              {filteredNotes.length === 0 && !loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center text-gray-400 text-sm">
                    Nothing here right now.
                  </td>
                </tr>
              ) : (
                filteredNotes.map((note) => {
                  const isBeingFixed = note.status === "in_revision";
                  const isLocked = !isBeingFixed && isClaimActive(note);
                  const fixLapsed = isBeingFixed && !isClaimActive(note);
                  const isFlagged = note.status === "flagged";
                  const isFinalCheck = !isLocked && note.status === "fix_review";
                  const wasSentBack = Boolean(note.returned_at);
                  const hasEarlierFeedback = !wasSentBack && note.status === "pending" && Boolean(note.flag_reason);
                  const checkerEmail = (note.checked_by && reviewerEmails[note.checked_by]) || "a director";
                  const recommendationText = note.corrected_file_key
                    ? "fixed it"
                    : note.recommendation === "reject" ? "recommends rejecting" : "recommends approving";

                  const adminEmail = (note.reviewed_by && reviewerEmails[note.reviewed_by]) || "Director";
                  const adminName = adminEmail.split('@')[0];
                  
                  return (
                    <tr key={note.id} className="hover:bg-gray-50/60 transition-colors group">
                      <td className="px-5 py-3.5 min-w-[240px]">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isBeingFixed ? 'bg-amber-50 text-amber-600' :
                            isLocked ? 'bg-gray-100 text-gray-600' :
                            isFinalCheck ? 'bg-stone-100 text-stone-700' :
                            isFlagged ? 'bg-brand-pink text-brand-red' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {isBeingFixed ? <Wrench className="w-3.5 h-3.5" /> :
                             isLocked ? <Lock className="w-3.5 h-3.5" /> : 
                             isFinalCheck ? <ShieldCheck className="w-3.5 h-3.5" /> :
                             isFlagged ? <AlertTriangle className="w-3.5 h-3.5" /> :
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
                          {isBeingFixed ? (
                            <span
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[11px] font-semibold"
                              title={fixLapsed ? `${adminEmail} went inactive — anyone can take this over` : `Being fixed by ${adminEmail}`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              {fixLapsed ? "Fix stalled" : `Fixing · ${adminName}`}
                            </span>
                          ) : isLocked ? (
                            <span 
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-[11px] font-semibold"
                              title={`Locked by ${adminEmail}`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-500" /> {adminName}
                            </span>
                          ) : isFinalCheck ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 text-stone-800 text-[11px] font-semibold"
                              title={`Sent to final check by ${checkerEmail}, who ${recommendationText}`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-stone-600" /> Final check · {checkerEmail.split("@")[0]}
                            </span>
                          ) : isFlagged ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-pink text-brand-red text-[11px] font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-brand-red" /> Flagged
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" /> Pending
                            </span>
                          )}
                          {wasSentBack && (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-semibold"
                              title={`Sent back by VP Notes: ${note.return_note ?? ""}`}
                            >
                              <CornerUpLeft className="w-3 h-3" /> Sent back
                            </span>
                          )}
                          {hasEarlierFeedback && (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold"
                              title="Has feedback from an earlier review round"
                            >
                              <RotateCcw className="w-3 h-3" /> Re-review
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="text-xs text-gray-400">
                          {formatShortDate(note.created_at)}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <Link
                          href={`/admin/review/${note.id}`}
                          prefetch={false}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-white text-xs font-semibold transition-colors ${
                            isBeingFixed ? "bg-amber-600 hover:bg-amber-700" : "bg-brand-red hover:bg-brand-red-hover"
                          }`}
                        >
                          {isBeingFixed ? (fixLapsed ? "Take over" : "View") : isFinalCheck ? "Check" : "Review"} <ArrowRight className="w-3 h-3" />
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