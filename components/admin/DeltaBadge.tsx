import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { Trend } from "@/lib/analytics";

export function DeltaBadge({ trend }: { trend: Trend }) {
  const isUp = trend.direction === "up";
  const isDown = trend.direction === "down";
  const Icon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;

  const color = isUp
    ? "text-emerald-700 bg-emerald-50"
    : isDown
      ? "text-rose-700 bg-rose-50"
      : "text-gray-500 bg-gray-100";

  const label =
    trend.pct === null ? (isUp ? "New" : "—") : `${isUp ? "+" : isDown ? "-" : ""}${trend.pct}%`;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold shrink-0 ${color}`}>
      <Icon className="w-3 h-3" /> {label}
    </span>
  );
}