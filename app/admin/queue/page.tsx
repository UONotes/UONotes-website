"use client";

import { useState } from "react";
import { useAdminQueue } from "@/app/hooks/useAdminQueue";
import { QueueHeader } from "../../../components/admin/QueueHeader";
import { QueueStats } from "../../../components/admin/QueueStats";
import { QueueTable } from "../../../components/admin/QueueTable";
import { Loader2 } from "lucide-react";

export default function AdminQueuePage() {
  const { queue, loading } = useAdminQueue();
  const [filter, setFilter] = useState<"all" | "pending" | "flagged" | "locked">("all");

  const isLocked = (item: any) => Boolean(item.claimedBy?.trim());

  const counts = {
    total: queue.length,
    pending: queue.filter(n => n.status === "pending" && !isLocked(n)).length,
    flagged: queue.filter(n => n.status === "flagged" && !isLocked(n)).length,
    locked: queue.filter(isLocked).length,
  };

  const filteredQueue = queue.filter(item => {
    const locked = isLocked(item);
    if (filter === "pending") return item.status === "pending" && !locked;
    if (filter === "flagged") return item.status === "flagged" && !locked;
    if (filter === "locked") return locked;
    return true;
  });

  return (
    <div className="w-full max-w-7xl mx-auto py-10 px-4 sm:px-6 space-y-8 animate-in fade-in duration-500 relative">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <QueueHeader activeFilter={filter} onClearFilter={() => setFilter("all")} />
      <QueueStats activeFilter={filter} onSelectFilter={setFilter} {...counts} />
      <div className="shadow-sm rounded-3xl overflow-hidden border border-gray-100 bg-white relative min-h-[320px]">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        )}
        <QueueTable initialNotes={filteredQueue} />
      </div>
    </div>
  );
}