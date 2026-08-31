"use client";

import { useState } from "react";
import { QueueHeader } from "@/components/admin/QueueHeader";
import { QueueStats } from "@/components/admin/QueueStats";
import { Loader2 } from "lucide-react";

export default function AdminQueuePage() {
  const [filter, setFilter] = useState<"all" | "pending" | "flagged" | "locked">("all");
  
  // Replace with your actual data fetching hook or state source
  const [loading, setLoading] = useState(false);
  const [counts] = useState({
    total: 0,
    pending: 0,
    flagged: 0,
    locked: 0,
  });

  return (
    <div className="relative min-h-screen p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      
      {/* Background Decorative Accent */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Queue Header Controls */}
      <QueueHeader 
        activeFilter={filter} 
        onClearFilter={() => setFilter("all")} 
      />
      
      {/* Queue Statistics Bar with Mapped Props */}
      <QueueStats 
        activeFilter={filter} 
        onSelectFilter={setFilter} 
        totalCount={counts.total}
        pendingCount={counts.pending}
        flaggedCount={counts.flagged}
        lockedCount={counts.locked}
      />

      {/* Queue Table Container */}
      <div className="shadow-sm rounded-3xl overflow-hidden border border-gray-100 bg-white relative min-h-[400px]">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 backdrop-blur-xs">
            <Loader2 className="w-8 h-8 text-brand-red animate-spin" />
          </div>
        )}
        
        {/* Insert your QueueTable component here */}
        <div className="p-8 text-center text-gray-400 text-sm font-medium">
          Queue records table view component.
        </div>
      </div>
      
    </div>
  );
}