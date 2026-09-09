"use client";

type QueueStatsProps = {
  activeFilter: string;
  onSelectFilter: (filter: "all" | "pending" | "flagged" | "changes_requested" | "locked") => void;
  totalCount: number;
  pendingCount: number;
  flaggedCount: number;
  changesRequestedCount: number;
  lockedCount: number;
};

export function QueueStats({
  activeFilter,
  onSelectFilter,
  totalCount,
  pendingCount,
  flaggedCount,
  changesRequestedCount,
  lockedCount,
}: QueueStatsProps) {
  const segments: {
    key: "all" | "pending" | "flagged" | "changes_requested" | "locked";
    label: string;
    count: number;
    dot: string;
    active: string;
  }[] = [
    { key: "all", label: "All", count: totalCount, dot: "bg-gray-400", active: "text-gray-900 border-gray-900" },
    { key: "pending", label: "Pending", count: pendingCount, dot: "bg-blue-500", active: "text-blue-700 border-blue-600" },
    { key: "changes_requested", label: "Awaiting fixes", count: changesRequestedCount, dot: "bg-orange-500", active: "text-orange-700 border-orange-600" },
    { key: "flagged", label: "Flagged", count: flaggedCount, dot: "bg-purple-500", active: "text-purple-700 border-purple-600" },
    { key: "locked", label: "Claimed", count: lockedCount, dot: "bg-amber-500", active: "text-amber-700 border-amber-600" },
  ];

  return (
    <div className="flex items-stretch gap-1 bg-white border border-black/5 rounded-2xl p-1.5 overflow-x-auto">
      {segments.map((s) => {
        const isActive = activeFilter === s.key;
        return (
          <button
            key={s.key}
            onClick={() => onSelectFilter(s.key)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm whitespace-nowrap border-b-2 transition-colors ${
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