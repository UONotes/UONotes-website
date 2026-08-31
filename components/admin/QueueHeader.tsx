"use client";

import { Filter, Zap } from "lucide-react";

type QueueHeaderProps = {
  activeFilter: string;
  onClearFilter: () => void;
};

export function QueueHeader({ activeFilter, onClearFilter }: QueueHeaderProps) {
  return (
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
        {activeFilter !== "all" && (
          <button 
            onClick={onClearFilter}
            className="px-3.5 py-2 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Filter className="w-3.5 h-3.5" /> Clear Filter ({activeFilter})
          </button>
        )}
        <div className="px-4 py-2 rounded-2xl bg-gray-50 border border-gray-100 text-xs font-mono font-medium text-gray-600 flex items-center gap-2 shadow-2xs">
          <Zap className="w-3.5 h-3.5 text-amber-500" /> System Active
        </div>
      </div>
    </div>
  );
}