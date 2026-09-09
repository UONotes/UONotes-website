import type { DayBucket } from "@/lib/analytics";

export function TrendChart({
  title,
  description,
  buckets,
  barColor = "bg-brand-red/70",
  barHoverColor = "hover:bg-brand-red",
}: {
  title: string;
  description: string;
  buckets: DayBucket[];
  barColor?: string;
  barHoverColor?: string;
}) {
  const maxCount = Math.max(1, ...buckets.map((b) => b.count));

  return (
    <div className="bg-white border border-black/5 rounded-2xl p-6">
      <h2 className="font-logo text-lg font-bold text-[#23201D]">{title}</h2>
      <p className="text-xs text-gray-400 mt-0.5 mb-6">{description}</p>
      <div className="h-32 flex items-end gap-[3px]">
        {buckets.map((b) => (
          <div
            key={b.date}
            title={`${b.label}: ${b.count}`}
            className={`flex-1 ${barColor} ${barHoverColor} rounded-t-sm transition-colors min-h-[3px]`}
            style={{ height: `${(b.count / maxCount) * 100}%` }}
          />
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