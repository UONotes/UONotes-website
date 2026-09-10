import type { DayBucket } from "@/lib/analytics";

export function TrendChart({
  title,
  description,
  buckets,
  barColor = "bg-brand-red/70",
  barHoverColor = "hover:bg-brand-red",
  total,
  comparisonText,
}: {
  title: string;
  description: string;
  buckets: DayBucket[];
  barColor?: string;
  barHoverColor?: string;
  /** Total count across the shown window, displayed as a headline number next to the title. */
  total?: number;
  /** e.g. "2.0/day this month vs 0.0/day last month" — plain-language comparison instead of a raw %. */
  comparisonText?: string;
}) {
  const maxCount = Math.max(1, ...buckets.map((b) => b.count));

  return (
    <div className="bg-white border border-black/5 rounded-2xl p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-logo text-lg font-bold text-[#23201D]">{title}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{description}</p>
        </div>
        {total !== undefined && (
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold font-logo text-[#23201D] leading-none">{total}</p>
            {comparisonText && <p className="text-[11px] text-gray-400 mt-1.5 whitespace-nowrap">{comparisonText}</p>}
          </div>
        )}
      </div>

      {/* Bars carry their own count as a label, so no hovering is needed
          to read exact values — the title attribute is kept as a
          fallback/accessible name, not the only way to see the number. */}
      <div className="h-32 flex items-end gap-[3px] mt-9">
        {buckets.map((b) => (
          <div key={b.date} className="relative flex-1 h-full flex items-end" title={`${b.label}: ${b.count}`}>
            <div
              className={`w-full ${barColor} ${barHoverColor} rounded-t-sm transition-colors min-h-[3px]`}
              style={{ height: `${(b.count / maxCount) * 100}%` }}
            >
              {b.count > 0 && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] leading-none text-gray-400 whitespace-nowrap">
                  {b.count}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-[10px] text-gray-400">
        <span>{buckets[0]?.label}</span>
        <span>{buckets[Math.floor(buckets.length / 2)]?.label}</span>
        <span>{buckets[buckets.length - 1]?.label}</span>
      </div>
    </div>
  );
}