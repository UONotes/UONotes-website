"use client";

import { X } from "lucide-react";

type QueueHeaderProps = {
  activeFilter: string;
  onClearFilter: () => void;
};

const FILTER_LABEL: Record<string, string> = {
  pending: "Pending",
  flagged: "Flagged",
  changes_requested: "Awaiting fixes",
  locked: "Claimed",
};

export function QueueHeader({ activeFilter, onClearFilter }: QueueHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-black/5">
      <div>
        <h1 className="font-logo text-3xl font-bold text-[#23201D] tracking-tight">Review Queue</h1>
        <p className="text-sm text-gray-500 mt-1">Approve, request fixes, or remove submitted notes.</p>
      </div>

      {activeFilter !== "all" && (
        <button
          onClick={onClearFilter}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold transition-colors cursor-pointer w-fit"
        >
          {FILTER_LABEL[activeFilter] ?? activeFilter}
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}