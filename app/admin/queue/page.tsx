"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { QueueTable } from "@/components/admin/QueueTable";
import { Layers, ShieldAlert, FileCheck, CheckCircle2, Zap, Filter, Loader2 } from "lucide-react";

type QueueItem = {
  id: string;
  title: string;
  courseCode: string;
  status: string;
  submittedAt: string;
  uploaderEmail: string;
  claimedBy: string | null;
  flagReason?: string | null;
};

export default function AdminQueuePage() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "flagged" | "locked">("all");
  
  const supabase = createClient();

  useEffect(() => {
    async function fetchQueue() {
      try {
        setLoading(true);
        const { data: notes, error } = await supabase
          .from("notes")
          .select(`
            id,
            title,
            course_code,
            status,
            created_at,
            flag_reason,
            uploader_id,
            reviewed_by
          `)
          .in("status", ["pending", "flagged"])
          .order("created_at", { ascending: true });

        if (error) {
          console.error("Failed to load queue:", error);
          return;
        }

        const formatted = await Promise.all(
          (notes || []).map(async (note: any) => {
            let uploaderEmail = "Unknown User";
            if (note.uploader_id) {
              const { data: upProfile } = await supabase
                .from("profiles")
                .select("email")
                .eq("id", note.uploader_id)
                .single();
              if (upProfile?.email) uploaderEmail = upProfile.email;
            }

            // RELEASED & NULL CHECK: Explicitly require a non-null, non-empty reviewed_by UUID
            let claimedByEmail = null;
            if (
              note.reviewed_by !== null &&
              note.reviewed_by !== undefined &&
              typeof note.reviewed_by === "string" &&
              note.reviewed_by.trim() !== ""
            ) {
              const { data: revProfile } = await supabase
                .from("profiles")
                .select("email")
                .eq("id", note.reviewed_by)
                .single();
              
              // Only assign if a valid profile email is found; otherwise treat as released/null
              if (revProfile?.email) {
                claimedByEmail = revProfile.email;
              }
            }

            return {
              id: note.id,
              title: note.title,
              courseCode: note.course_code || "N/A",
              status: note.status,
              submittedAt: note.created_at || new Date().toISOString(),
              uploaderEmail,
              claimedBy: claimedByEmail, // Will be strictly null if unassigned or released
              flagReason: note.flag_reason || null,
            };
          })
        );

        setQueue(formatted);
      } catch (err) {
        console.error("Queue fetch exception:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchQueue();
  }, [supabase]);

  // STRICT LOCK EVALUATION: An item is only locked if claimedBy is an active email string
  const isItemLocked = (item: QueueItem) => {
    return Boolean(item.claimedBy !== null && item.claimedBy !== undefined && item.claimedBy.trim() !== "");
  };

  const totalCount = queue.length;
  const pendingCount = queue.filter(n => n.status === "pending" && !isItemLocked(n)).length;
  const flaggedCount = queue.filter(n => n.status === "flagged" && !isItemLocked(n)).length;
  const lockedCount = queue.filter(n => isItemLocked(n)).length;

  const filteredQueue = queue.filter(item => {
    const locked = isItemLocked(item);
    
    if (filter === "pending") return item.status === "pending" && !locked;
    if (filter === "flagged") return item.status === "flagged" && !locked;
    if (filter === "locked") return locked;
    return true; // "all"
  });

  return (
    <div className="w-full max-w-7xl mx-auto py-10 px-4 sm:px-6 space-y-8 animate-in fade-in duration-500 relative">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100/80 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-600 text-[10px] font-mono font-bold uppercase tracking-wider border border-red-100 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
              Moderation Gateway
            </span>
            <span className="text-gray-300">•</span>
            <span className="text-xs font-mono text-gray-400">Live Backlog Stream</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Review Queue</h1>
          <p className="text-xs text-gray-500 max-w-xl">
            Evaluate, triage, and enforce academic compliance on submitted student documentation with cryptographic audit logging.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {filter !== "all" && (
            <button 
              onClick={() => setFilter("all")}
              className="px-3.5 py-2 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Filter className="w-3.5 h-3.5" /> Clear Filter ({filter})
            </button>
          )}
          <div className="px-4 py-2 rounded-2xl bg-gray-50 border border-gray-100 text-xs font-mono font-medium text-gray-600 flex items-center gap-2 shadow-2xs">
            <Zap className="w-3.5 h-3.5 text-amber-500" /> System Active
          </div>
        </div>
      </div>

      {/* TELEMETRY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => setFilter("all")}
          className={`bg-white p-5 rounded-3xl border transition-all cursor-pointer group shadow-2xs ${
            filter === "all" ? "border-gray-900 ring-2 ring-gray-900/10 shadow-md" : "border-gray-100 hover:border-gray-300 hover:shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">Total Backlog</p>
              <p className="text-3xl font-black text-gray-900 tracking-tight">{totalCount}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-600 transition-transform group-hover:scale-105">
              <Layers className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div 
          onClick={() => setFilter("pending")}
          className={`bg-white p-5 rounded-3xl border transition-all cursor-pointer group shadow-2xs ${
            filter === "pending" ? "border-blue-600 ring-2 ring-blue-600/10 shadow-md" : "border-gray-100 hover:border-blue-200 hover:shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                <p className="text-[10px] font-mono font-bold text-blue-600 uppercase tracking-wider">Pending Review</p>
              </div>
              <p className="text-3xl font-black text-gray-900 tracking-tight">{pendingCount}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100/60 flex items-center justify-center text-blue-600 transition-transform group-hover:scale-105">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div 
          onClick={() => setFilter("flagged")}
          className={`bg-white p-5 rounded-3xl border transition-all cursor-pointer group shadow-2xs ${
            filter === "flagged" ? "border-purple-600 ring-2 ring-purple-600/10 shadow-md" : "border-gray-100 hover:border-purple-200 hover:shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse" />
                <p className="text-[10px] font-mono font-bold text-purple-600 uppercase tracking-wider">Flagged Risk</p>
              </div>
              <p className="text-3xl font-black text-gray-900 tracking-tight">{flaggedCount}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100/60 flex items-center justify-center text-purple-600 transition-transform group-hover:scale-105">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div 
          onClick={() => setFilter("locked")}
          className={`bg-white p-5 rounded-3xl border transition-all cursor-pointer group shadow-2xs ${
            filter === "locked" ? "border-amber-500 ring-2 ring-amber-500/10 shadow-md" : "border-gray-100 hover:border-amber-200 hover:shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <p className="text-[10px] font-mono font-bold text-amber-600 uppercase tracking-wider">Claimed / Locked</p>
              </div>
              <p className="text-3xl font-black text-gray-900 tracking-tight">{lockedCount}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100/60 flex items-center justify-center text-amber-600 transition-transform group-hover:scale-105">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* TABLE CONTAINER */}
      <div className="shadow-sm rounded-3xl overflow-hidden border border-gray-100 bg-white relative min-h-[320px]">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : null}
        <QueueTable initialNotes={filteredQueue} />
      </div>
    </div>
  );
}