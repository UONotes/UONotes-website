"use client";

import { Layers, CheckCircle2, ShieldAlert, FileCheck } from "lucide-react";

type QueueStatsProps = {
  activeFilter: string;
  onSelectFilter: (filter: "all" | "pending" | "flagged" | "locked") => void;
  totalCount: number;
  pendingCount: number;
  flaggedCount: number;
  lockedCount: number;
};

export function QueueStats({
  activeFilter,
  onSelectFilter,
  totalCount,
  pendingCount,
  flaggedCount,
  lockedCount,
}: QueueStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div 
        onClick={() => onSelectFilter("all")}
        className={`bg-white p-5 rounded-3xl border transition-all cursor-pointer group shadow-2xs ${
          activeFilter === "all" ? "border-gray-900 ring-2 ring-gray-900/10 shadow-md" : "border-gray-100 hover:border-gray-300 hover:shadow-sm"
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
        onClick={() => onSelectFilter("pending")}
        className={`bg-white p-5 rounded-3xl border transition-all cursor-pointer group shadow-2xs ${
          activeFilter === "pending" ? "border-blue-600 ring-2 ring-blue-600/10 shadow-md" : "border-gray-100 hover:border-blue-200 hover:shadow-sm"
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
        onClick={() => onSelectFilter("flagged")}
        className={`bg-white p-5 rounded-3xl border transition-all cursor-pointer group shadow-2xs ${
          activeFilter === "flagged" ? "border-purple-600 ring-2 ring-purple-600/10 shadow-md" : "border-gray-100 hover:border-purple-200 hover:shadow-sm"
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
        onClick={() => onSelectFilter("locked")}
        className={`bg-white p-5 rounded-3xl border transition-all cursor-pointer group shadow-2xs ${
          activeFilter === "locked" ? "border-amber-500 ring-2 ring-amber-500/10 shadow-md" : "border-gray-100 hover:border-amber-200 hover:shadow-sm"
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
  );
}