"use client";

import { useCallback, useRef, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

// ─── Tokens ──────────────────────────────────────────────────────────
export const INK = "#23201D";
export const RED = "#8F0018";
export const MUTED = "#B9B1A8"; // previous-period / comparison series
export const GRID = "rgba(35,32,29,0.07)";

// Status colours, validated as a set with the dataviz palette checker.
// Always shipped with a text label.
export const STATUS = {
  approved: "#059669",
  pending: "#2a78d6",
  changes: "#eda100",
  flagged: "#7c3aed",
  rejected: "#e11d48",
} as const;

export type Label = { label: string; tooltip: string };

// ─── Formatting ──────────────────────────────────────────────────────
export function fmt(value: number | null | undefined, digits = 0) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  if (Math.abs(value) >= 10000) return `${(value / 1000).toFixed(1)}k`;
  return value.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: 0 });
}

export function fmtDuration(hours: number | null | undefined) {
  if (hours === null || hours === undefined) return "—";
  if (hours === 0) return "0";
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))}m`;
  if (hours < 48) return `${hours.toFixed(hours < 10 ? 1 : 0)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}

/** Rounds up to a 1/2/2.5/5 × 10ⁿ step so gridlines land on readable numbers. */
function niceMax(value: number) {
  if (value <= 0) return 1;
  const mag = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * mag >= value) ?? 10;
  return step * mag;
}

/** Measures an element's width on mount (so charts draw immediately) and on every resize. */
function useWidth<T extends HTMLElement>() {
  const [width, setWidth] = useState(0);
  const observer = useRef<ResizeObserver | null>(null);
  const ref = useCallback((el: T | null) => {
    observer.current?.disconnect();
    if (!el) return;
    setWidth(el.getBoundingClientRect().width);
    observer.current = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.current.observe(el);
  }, []);
  return [ref, width] as const;
}

// ─── Delta ───────────────────────────────────────────────────────────
/**
 * Change vs the previous period. `goodWhen` sets which direction is green,
 * so "review time went up" shows as bad.
 */
export function Delta({
  current,
  previous,
  goodWhen = "up",
  suffix = "%",
  mode = "percent",
}: {
  current: number | null;
  previous: number | null;
  goodWhen?: "up" | "down";
  suffix?: string;
  mode?: "percent" | "points";
}) {
  if (current === null || previous === null) return null;
  let text: string;
  let dir: "up" | "down" | "flat";
  if (mode === "points") {
    const diff = Math.round(current - previous);
    dir = diff > 0 ? "up" : diff < 0 ? "down" : "flat";
    text = `${Math.abs(diff)} pts`;
  } else if (previous === 0) {
    if (current === 0) return <DeltaChip dir="flat" good={null} text="No change" />;
    return <DeltaChip dir="up" good={goodWhen === "up"} text="New" />;
  } else {
    const change = Math.round(((current - previous) / previous) * 100);
    dir = change > 0 ? "up" : change < 0 ? "down" : "flat";
    text = `${Math.abs(change)}${suffix}`;
  }
  const good = dir === "flat" ? null : (dir === "up") === (goodWhen === "up");
  return <DeltaChip dir={dir} good={good} text={text} />;
}

function DeltaChip({ dir, good, text }: { dir: "up" | "down" | "flat"; good: boolean | null; text: string }) {
  const Icon = dir === "up" ? ArrowUpRight : dir === "down" ? ArrowDownRight : Minus;
  const color = good === null ? "text-gray-500 bg-gray-100" : good ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50";
  return (
    <span className={`inline-flex items-center gap-0.5 pl-1 pr-1.5 py-0.5 rounded-md text-[11px] font-semibold tabular-nums shrink-0 ${color}`}>
      <Icon className="w-3.5 h-3.5" aria-hidden="true" />
      <span className="sr-only">{dir === "up" ? "up" : dir === "down" ? "down" : ""}</span>
      {text}
    </span>
  );
}

// ─── Tooltip ─────────────────────────────────────────────────────────
function Tooltip({ x, width, title, rows }: { x: number; width: number; title: string; rows: { color: string; label: string; value: string }[] }) {
  // Flip to the left of the cursor near the right edge
  const flip = x > width * 0.6;
  return (
    <div
      className="absolute top-0 z-20 pointer-events-none bg-[#23201D] text-white rounded-xl px-3 py-2 shadow-xl min-w-[9rem]"
      style={{ left: x, transform: `translateX(${flip ? "calc(-100% - 12px)" : "12px"})` }}
    >
      <p className="text-[11px] text-white/60 mb-1">{title}</p>
      {rows.map((r) => (
        <p key={r.label} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: r.color }} />
          <span className="text-white/80 flex-1">{r.label}</span>
          <span className="font-semibold tabular-nums">{r.value}</span>
        </p>
      ))}
    </div>
  );
}

// ─── Line / area chart ───────────────────────────────────────────────
export type LineSeries = { label: string; color: string; values: (number | null)[]; area?: boolean };

export function LineChart({
  series,
  labels,
  height = 240,
  format = (v: number) => fmt(v, 1),
  ariaLabel,
}: {
  series: LineSeries[];
  labels: Label[];
  height?: number;
  format?: (v: number) => string;
  ariaLabel: string;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const pad = { l: 40, r: 12, t: 12, b: 28 };
  const n = labels.length;
  const values = series.flatMap((s) => s.values.filter((v): v is number => v !== null));
  const max = niceMax(Math.max(0, ...values));
  const innerW = Math.max(0, width - pad.l - pad.r);
  const innerH = height - pad.t - pad.b;
  const x = (i: number) => pad.l + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const y = (v: number) => pad.t + innerH - (v / max) * innerH;

  // Gaps (null) are bridged so sparse series still read as a trend; points get markers instead
  const pathFor = (vals: (number | null)[]) =>
    vals
      .map((v, i) => (v === null ? null : `${x(i).toFixed(1)},${y(v).toFixed(1)}`))
      .filter(Boolean)
      .map((pt, k) => `${k ? "L" : "M"}${pt}`)
      .join("");
  const sparse = (vals: (number | null)[]) => vals.some((v) => v === null);

  const onMove = (e: React.PointerEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const i = Math.round(((px - pad.l) / Math.max(1, innerW)) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, i)));
  };

  const ticks = [0, 0.5, 1];
  const xTicks = n > 1 ? [0, Math.floor((n - 1) / 2), n - 1] : [0];

  return (
    <div ref={ref} className="relative w-full select-none touch-pan-y" style={{ height }}>
      {width > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={ariaLabel}
          onPointerMove={onMove}
          onPointerDown={onMove}
          onPointerLeave={() => setHover(null)}
          className="block overflow-visible"
        >
          {ticks.map((f) => (
            <g key={f}>
              <line x1={pad.l} x2={width - pad.r} y1={y(max * f)} y2={y(max * f)} stroke={f === 0 ? "rgba(35,32,29,0.18)" : GRID} />
              <text x={pad.l - 8} y={y(max * f)} dy="0.32em" textAnchor="end" className="fill-gray-400 text-[10px] tabular-nums">
                {format(max * f)}
              </text>
            </g>
          ))}
          {xTicks.map((i, k) => (
            <text
              key={i}
              x={x(i)}
              y={height - 8}
              textAnchor={k === 0 ? "start" : k === xTicks.length - 1 ? "end" : "middle"}
              className="fill-gray-400 text-[10px]"
            >
              {labels[i]?.label}
            </text>
          ))}

          {/* Draw back-to-front so the first (primary) series sits on top */}
          {[...series].reverse().map((s) => (
            <g key={s.label}>
              {s.area && !sparse(s.values) && (
                <path
                  d={`${pathFor(s.values)} L${x(n - 1)},${y(0)} L${x(0)},${y(0)} Z`}
                  fill={s.color}
                  opacity={0.08}
                />
              )}
              <path d={pathFor(s.values)} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              {sparse(s.values) &&
                s.values.map((v, i) =>
                  v === null ? null : <circle key={i} cx={x(i)} cy={y(v)} r={3} fill={s.color} stroke="#fff" strokeWidth={1.5} />
                )}
            </g>
          ))}

          {hover !== null && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + innerH} stroke="rgba(35,32,29,0.25)" />
              {series.map((s) =>
                s.values[hover] === null ? null : (
                  <circle key={s.label} cx={x(hover)} cy={y(s.values[hover] as number)} r={4.5} fill={s.color} stroke="#fff" strokeWidth={2} />
                )
              )}
            </g>
          )}
        </svg>
      )}
      {hover !== null && width > 0 && (
        <Tooltip
          x={x(hover)}
          width={width}
          title={labels[hover]?.tooltip ?? ""}
          rows={series.map((s) => ({ color: s.color, label: s.label, value: s.values[hover] === null ? "—" : format(s.values[hover] as number) }))}
        />
      )}
    </div>
  );
}

// ─── Column chart (single or stacked) ────────────────────────────────
export type ColumnSeries = { label: string; color: string; values: number[] };

export function ColumnChart({
  series,
  labels,
  height = 220,
  unit,
  ariaLabel,
}: {
  series: ColumnSeries[];
  labels: Label[];
  height?: number;
  unit?: string;
  ariaLabel: string;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const n = labels.length;
  const totals = labels.map((_, i) => series.reduce((s, se) => s + (se.values[i] || 0), 0));
  const max = niceMax(Math.max(0, ...totals));
  const xTicks = n > 1 ? [0, Math.floor((n - 1) / 2), n - 1] : [0];
  const plotH = height - 28;

  return (
    <div ref={ref} className="relative w-full select-none" style={{ height }} role="img" aria-label={ariaLabel}>
      {/* Gridlines */}
      {[0, 0.5, 1].map((f) => (
        <div key={f} className="absolute left-10 right-0" style={{ top: plotH - f * (plotH - 12) }}>
          <div className="border-t" style={{ borderColor: f === 0 ? "rgba(35,32,29,0.18)" : GRID }} />
          <span className="absolute -left-10 w-8 -translate-y-1/2 text-right text-[10px] text-gray-400 tabular-nums">{fmt(max * f, 1)}</span>
        </div>
      ))}

      <div className="absolute left-10 right-0 top-3 flex items-end gap-[2px]" style={{ height: plotH - 12 }} onPointerLeave={() => setHover(null)}>
        {labels.map((l, i) => (
          <div
            key={l.tooltip + i}
            className="relative flex-1 h-full flex flex-col-reverse gap-[2px] cursor-default"
            onPointerEnter={() => setHover(i)}
            onPointerDown={() => setHover(i)}
          >
            {series.map((s) =>
              s.values[i] > 0 ? (
                <div
                  key={s.label}
                  className="w-full first:rounded-b-none last:rounded-t-[4px] transition-opacity"
                  style={{
                    height: `calc(${(s.values[i] / max) * 100}% - 2px)`,
                    minHeight: 2,
                    backgroundColor: s.color,
                    opacity: hover === null || hover === i ? 1 : 0.45,
                  }}
                />
              ) : null
            )}
            {totals[i] === 0 && <div className="w-full h-[2px] bg-gray-200 rounded-full" />}
          </div>
        ))}
      </div>

      {xTicks.map((i, k) => (
        <span
          key={i}
          className="absolute bottom-0 text-[10px] text-gray-400 whitespace-nowrap"
          style={{
            left: `calc(2.5rem + ${n <= 1 ? 50 : ((i + 0.5) / n) * 100}% * ${width ? (width - 40) / width : 1})`,
            transform: k === 0 ? "none" : k === xTicks.length - 1 ? "translateX(-100%)" : "translateX(-50%)",
          }}
        >
          {labels[i]?.label}
        </span>
      ))}

      {hover !== null && width > 0 && (
        <Tooltip
          x={40 + ((hover + 0.5) / n) * (width - 40)}
          width={width}
          title={labels[hover].tooltip}
          rows={[
            ...series.map((s) => ({ color: s.color, label: s.label, value: fmt(s.values[hover], 1) })),
            ...(series.length > 1 ? [{ color: "transparent", label: `Total${unit ? ` ${unit}` : ""}`, value: fmt(totals[hover], 1) }] : []),
          ]}
        />
      )}
    </div>
  );
}

// ─── Sparkline (hoverable) ───────────────────────────────────────────
export function Sparkline({
  values,
  labels,
  color = RED,
  format = (v: number) => fmt(v, 1),
}: {
  values: number[];
  labels: Label[];
  color?: string;
  format?: (v: number) => string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  if (values.length < 2) return <div className="h-12" />;
  const max = Math.max(1, ...values);
  const px = (i: number) => (i / (values.length - 1)) * 100;
  const py = (v: number) => 44 - (v / max) * 40;
  const line = values.map((v, i) => `${i ? "L" : "M"}${px(i).toFixed(2)},${py(v).toFixed(2)}`).join(" ");

  return (
    <div className="relative h-12" onPointerLeave={() => setHover(null)}>
      <svg viewBox="0 0 100 48" preserveAspectRatio="none" className="absolute inset-0 w-full h-full overflow-visible" aria-hidden="true">
        <path d={`${line} L100,48 L0,48 Z`} fill={color} opacity={0.08} />
        <path d={line} fill="none" stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      {/* Hit targets wider than the line */}
      <div className="absolute inset-0 flex">
        {values.map((_, i) => (
          <div key={i} className="flex-1 h-full" onPointerEnter={() => setHover(i)} onPointerDown={() => setHover(i)} />
        ))}
      </div>
      {hover !== null && (
        <>
          <span
            className="absolute w-2.5 h-2.5 rounded-full border-2 border-white -translate-x-1/2 -translate-y-1/2 pointer-events-none shadow-sm"
            style={{ left: `${px(hover)}%`, top: `${(py(values[hover]) / 48) * 100}%`, backgroundColor: color }}
          />
          <span
            className="absolute -top-7 z-10 -translate-x-1/2 whitespace-nowrap bg-[#23201D] text-white text-[10px] rounded-md px-2 py-1 pointer-events-none"
            style={{ left: `${Math.min(85, Math.max(15, px(hover)))}%` }}
          >
            {labels[hover]?.tooltip}: <b className="font-semibold">{format(values[hover])}</b>
          </span>
        </>
      )}
    </div>
  );
}

// ─── Part-to-whole bar ───────────────────────────────────────────────
export function StackedBar({ segments, height = "h-3" }: { segments: { label: string; value: number; color: string }[]; height?: string }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  return (
    <div className={`flex ${height} gap-[2px] rounded-full overflow-hidden bg-gray-100`}>
      {segments
        .filter((s) => s.value > 0)
        .map((s) => (
          <div key={s.label} title={`${s.label}: ${s.value}`} style={{ width: `${(s.value / Math.max(1, total)) * 100}%`, backgroundColor: s.color }} />
        ))}
    </div>
  );
}

// ─── Ranked bars ─────────────────────────────────────────────────────
export function RankedBars({
  rows,
  limit = 8,
  color = RED,
  emptyText = "Nothing here yet.",
  format = (v: number) => fmt(v),
  total,
}: {
  rows: { label: string; value: number }[];
  limit?: number;
  color?: string;
  emptyText?: string;
  format?: (v: number) => string;
  /** When given, each row also shows its share of this total. */
  total?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  if (rows.length === 0) return <p className="text-sm text-gray-400 py-8 text-center">{emptyText}</p>;
  const shown = expanded ? rows : rows.slice(0, limit);
  const max = Math.max(1, ...rows.map((r) => r.value));

  return (
    <div>
      <ul className="space-y-1">
        {shown.map((r, i) => (
          <li key={r.label} className="group relative flex items-center gap-3 h-8 px-2 -mx-2 rounded-lg hover:bg-gray-50">
            <span className="w-4 text-[11px] text-gray-300 tabular-nums text-right">{i + 1}</span>
            <span className="relative flex-1 h-full flex items-center min-w-0">
              <span
                className="absolute left-0 top-1.5 bottom-1.5 rounded-[4px] transition-all"
                style={{ width: `${Math.max(2, (r.value / max) * 100)}%`, backgroundColor: color, opacity: 0.14 }}
              />
              <span className="relative pl-2 text-[13px] font-medium text-gray-800 truncate">{r.label}</span>
            </span>
            <span className="text-[13px] font-semibold text-gray-900 tabular-nums">{format(r.value)}</span>
            {total !== undefined && (
              <span className="w-10 text-right text-[11px] text-gray-400 tabular-nums">{total > 0 ? Math.round((r.value / total) * 100) : 0}%</span>
            )}
          </li>
        ))}
      </ul>
      {rows.length > limit && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-3 text-xs font-semibold text-brand-red hover:text-brand-red-hover cursor-pointer"
        >
          {expanded ? "Show less" : `Show all ${rows.length}`}
        </button>
      )}
    </div>
  );
}

// ─── Funnel ──────────────────────────────────────────────────────────
export function Funnel({ steps, color = RED }: { steps: { label: string; value: number }[]; color?: string }) {
  const top = Math.max(1, steps[0]?.value ?? 1);
  return (
    <ol className="space-y-3">
      {steps.map((s, i) => {
        const prev = i > 0 ? steps[i - 1].value : null;
        const conv = prev ? Math.round((s.value / prev) * 100) : null;
        return (
          <li key={s.label}>
            <div className="flex items-baseline justify-between text-sm mb-1.5">
              <span className="text-gray-600">{s.label}</span>
              <span className="flex items-baseline gap-2">
                {conv !== null && <span className="text-[11px] text-gray-400 tabular-nums">{conv}% of previous</span>}
                <span className="font-semibold text-gray-900 tabular-nums">{fmt(s.value)}</span>
              </span>
            </div>
            <div className="h-7 bg-gray-50 rounded-lg overflow-hidden">
              <div
                className="h-full rounded-lg transition-all"
                style={{ width: `${Math.max(1, (s.value / top) * 100)}%`, backgroundColor: color, opacity: 1 - i * (0.55 / Math.max(1, steps.length - 1)) }}
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// ─── Heatmap ─────────────────────────────────────────────────────────
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const BLOCKS = ["12a", "3a", "6a", "9a", "12p", "3p", "6p", "9p"];
const BLOCK_RANGES = ["12–3 AM", "3–6 AM", "6–9 AM", "9 AM–12 PM", "12–3 PM", "3–6 PM", "6–9 PM", "9 PM–12 AM"];
// Single-hue sequential ramp, light → dark. Step 0 = nothing.
const RAMP = ["#F4EFE9", "#F3D4D8", "#E5A3AC", "#CC6573", "#AE2E41", RED];

export function Heatmap({ grid, unit }: { grid: number[][]; unit: string }) {
  const [active, setActive] = useState<{ d: number; b: number } | null>(null);
  const max = Math.max(0, ...grid.flat());
  const step = (v: number) => (v === 0 || max === 0 ? 0 : Math.max(1, Math.ceil((v / max) * (RAMP.length - 1))));
  let peak = { d: 0, b: 0, v: 0 };
  grid.forEach((row, d) => row.forEach((v, b) => v > peak.v && (peak = { d, b, v })));
  const dayTotals = grid.map((r) => r.reduce((s, v) => s + v, 0));
  const shown = active ?? (peak.v > 0 ? peak : null);

  return (
    <div className="grid lg:grid-cols-[1fr_13rem] gap-6">
      <div className="grid grid-cols-[2rem_repeat(8,minmax(0,1fr))] gap-[3px]" onPointerLeave={() => setActive(null)}>
        <span />
        {BLOCKS.map((l) => (
          <span key={l} className="text-[10px] text-gray-400 text-center pb-1">{l}</span>
        ))}
        {grid.map((row, d) => (
          <div key={d} className="contents">
            <span className="text-[11px] text-gray-500 self-center">{DAYS[d]}</span>
            {row.map((v, b) => (
              <button
                key={b}
                type="button"
                aria-label={`${DAY_NAMES[d]} ${BLOCK_RANGES[b]}: ${v} ${unit}`}
                onPointerEnter={() => setActive({ d, b })}
                onFocus={() => setActive({ d, b })}
                onClick={() => setActive({ d, b })}
                className={`h-8 sm:h-9 rounded-[5px] transition-transform hover:scale-110 focus-visible:outline-none ${
                  shown && shown.d === d && shown.b === b ? "ring-2 ring-[#23201D] ring-offset-2 ring-offset-white" : ""
                }`}
                style={{ backgroundColor: RAMP[step(v)] }}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="flex lg:flex-col justify-between gap-4 lg:border-l lg:border-black/5 lg:pl-6">
        <div aria-live="polite">
          <p className="text-[11px] text-gray-400">{active ? "Selected" : "Busiest time"}</p>
          {shown ? (
            <>
              <p className="font-semibold text-gray-900 mt-0.5">{DAY_NAMES[shown.d]}</p>
              <p className="text-sm text-gray-600">{BLOCK_RANGES[shown.b]}</p>
              <p className="font-logo text-3xl font-bold text-[#23201D] mt-2 tabular-nums">{grid[shown.d][shown.b]}</p>
              <p className="text-[11px] text-gray-400">{unit}</p>
            </>
          ) : (
            <p className="text-sm text-gray-400 mt-1">No activity yet</p>
          )}
        </div>
        <div>
          <p className="text-[11px] text-gray-400 mb-2">By day</p>
          <div className="flex items-end gap-1 h-12">
            {dayTotals.map((v, d) => (
              <div key={d} className="flex-1 flex flex-col items-center gap-1 h-full justify-end" title={`${DAY_NAMES[d]}: ${v}`}>
                <div className="w-full rounded-t-[3px]" style={{ height: `${(v / Math.max(1, ...dayTotals)) * 100}%`, minHeight: 2, backgroundColor: v === Math.max(...dayTotals) && v > 0 ? RED : "#D9D2CA" }} />
              </div>
            ))}
          </div>
          <div className="flex gap-1 mt-1">
            {DAYS.map((d) => (
              <span key={d} className="flex-1 text-center text-[9px] text-gray-400">{d[0]}</span>
            ))}
          </div>
          <div className="flex items-center gap-1 mt-4 text-[10px] text-gray-400">
            Less
            {RAMP.map((c) => (
              <span key={c} className="w-3 h-3 rounded-[3px]" style={{ backgroundColor: c }} />
            ))}
            More
          </div>
        </div>
      </div>
    </div>
  );
}
