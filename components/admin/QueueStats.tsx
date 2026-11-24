"use client";

type QueueStatsProps = {
  activeFilter: string;
  onSelectFilter: (filter: "all" | "pending" | "flagged" | "in_revision" | "fix_review" | "locked") => void;
  totalCount: number;
  pendingCount: number;
  flaggedCount: number;
  beingFixedCount: number;
  finalCheckCount: number;
  lockedCount: number;
};

export function QueueStats({
  activeFilter,
  onSelectFilter,
  totalCount,
  pendingCount,
  flaggedCount,
  beingFixedCount,
  finalCheckCount,
  lockedCount,
}: QueueStatsProps) {
  const segments: {
    key: "all" | "pending" | "flagged" | "in_revision" | "fix_review" | "locked";
    label: string;
    count: number;
    dot: string;
    active: string;
  }[] = [
    { key: "all", label: "All", count: totalCount, dot: "bg-gray-400", active: "text-gray-900 border-gray-900" },
    { key: "pending", label: "Pending", count: pendingCount, dot: "bg-slate-500", active: "text-slate-700 border-slate-600" },
    { key: "in_revision", label: "Being fixed", count: beingFixedCount, dot: "bg-amber-500", active: "text-amber-700 border-amber-600" },
    { key: "fix_review", label: "Final check", count: finalCheckCount, dot: "bg-stone-600", active: "text-stone-800 border-stone-700" },
    { key: "flagged", label: "Flagged", count: flaggedCount, dot: "bg-brand-red", active: "text-brand-red border-brand-red" },
    { key: "locked", label: "Claimed", count: lockedCount, dot: "bg-gray-500", active: "text-gray-800 border-gray-700" },
  ];

  return (
    <div className="flex items-stretch gap-1 bg-white border border-brand-border-light rounded-lg p-1.5 overflow-x-auto">
      {segments.map((s) => {
        const isActive = activeFilter === s.key;
        return (
          <button
            key={s.key}
            onClick={() => onSelectFilter(s.key)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm whitespace-nowrap border-b-2 transition-colors ${
              isActive ? `${s.active} bg-gray-50/80 font-semibold` : "text-gray-500 border-transparent hover:bg-gray-50 hover:text-gray-700"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            {s.label}
            <span className={`text-xs ${isActive ? "font-bold" : "text-gray-400"}`}>{s.count}</span>
          </button>
        );
      })}
    </div>
  );
}