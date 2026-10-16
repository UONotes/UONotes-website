"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { AnimatePresence, motion, MotionConfig, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { Caveat } from "next/font/google";
import { pastEvents, type EventItem } from "@/lib/events-data";
import { PhotoLightbox, type LightboxState } from "./PhotoLightbox";

// Handwriting font for captions and notes (same as the About page)
const caveat = Caveat({ subsets: ["latin"], weight: ["500", "700"] });

// "Rubber stamp" lettering, same as the navbar
const STAMP_TEXT = "font-mono font-bold uppercase tracking-[0.16em]";

// Pink highlighter stroke behind the term labels on phones
const HIGHLIGHTER = "linear-gradient(transparent 38%, rgba(250,120,140,0.5) 38%, rgba(250,120,140,0.45) 88%, transparent 88%)";

// ─── Settings ────────────────────────────────────────────────────────────────

// Events that haven't happened yet. They show on the ruler as a dashed card (until their date passes)
// and in the checklist under the heading. Once an event has happened, add it to lib/events-data.ts
// with its photos and remove it from here.
type UpcomingEvent = {
  date: string; // e.g. "2026-10-08T12:00:00"
  title?: string; // e.g. "Fall social" (leave out to just show "coming up")
  stamp?: string; // e.g. "SOLD OUT"
  note?: string; // handwritten line on the banner, e.g. "tickets went in no time!"
  link?: string; // optional sign-up / ticket link (shows a "Get tickets" button)
};
const UPCOMING: UpcomingEvent[] = [
  { date: "2026-10-08T12:00:00", stamp: "SOLD OUT", note: "tickets went in no time, more fall events soon!" },
];

// The taped photo beside the heading. Leave as null to use a photo from the most recent event.
const HERO_PHOTO: { src: string; caption: string } | null = null;

const INSTAGRAM_URL = "https://www.instagram.com/uonotes";

// ─── Data helpers ────────────────────────────────────────────────────────────

function getPhotos(event: EventItem) {
  return event.images && event.images.length > 0 ? event.images : event.image ? [event.image] : [];
}

function parseDate(date: string) {
  const d = new Date(date);
  return isNaN(d.getTime()) ? null : d;
}

// uOttawa terms: Winter (Jan–Apr), Summer (May–Aug), Fall (Sep–Dec)
const TERMS = [
  { name: "Winter", start: 0 },
  { name: "Summer", start: 4 },
  { name: "Fall", start: 8 },
] as const;
type Term = (typeof TERMS)[number];
const termOf = (d: Date) => TERMS[Math.floor(d.getMonth() / 4)];
const semesterOf = (d: Date) => `${termOf(d).name} ${d.getFullYear()}`;

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const shortDate = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
const monthYear = (d: Date) => d.toLocaleDateString("en-US", { month: "long", year: "numeric" });

// How far through the year a date is (0 → 1), month by month so each month gets equal space
function yearFraction(d: Date) {
  const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return (d.getMonth() + (d.getDate() - 0.5) / daysInMonth) / 12;
}

type DatedEvent = { event: EventItem; date: Date };

// Events with a real date, most recent first
const datedEvents: DatedEvent[] = pastEvents
  .map((event) => ({ event, date: parseDate(event.date) }))
  .filter((e): e is DatedEvent => e.date !== null)
  .sort((a, b) => b.date.getTime() - a.date.getTime());

const years = [...new Set(datedEvents.map((e) => e.date.getFullYear()))].sort((a, b) => b - a);

const upcomingEvents = UPCOMING.map((u) => ({ ...u, when: parseDate(u.date) }))
  .filter((u): u is UpcomingEvent & { when: Date } => u.when !== null)
  .sort((a, b) => a.when.getTime() - b.when.getTime());

// "Today" is read in the visitor's browser (not when the page was built), so it's always current
function useToday() {
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => setToday(new Date()), []);
  return today;
}

// ─── Small pieces ────────────────────────────────────────────────────────────

function Tape({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute -top-2.5 left-1/2 z-10 h-5 -translate-x-1/2 bg-brand-red/20 ${className}`}
    />
  );
}

function SoldOutStamp({ text, className = "" }: { text: string; className?: string }) {
  return (
    <span
      className={`inline-block border-[3px] border-double border-brand-red bg-[#fffdf8] px-2 py-0.5 text-[10px] text-brand-red ${STAMP_TEXT} ${className}`}
    >
      {text}
    </span>
  );
}

// Striped "photo still to come" placeholder for an upcoming event
const STRIPES = "repeating-linear-gradient(45deg, #fde7ea 0 8px, #f6d3d8 8px 16px)";

// ─── The ruler (tablets and up) ──────────────────────────────────────────────

const CARD_W = 156; // polaroid width
const CARD_H = 130; // 8px border + 92px photo + 30px caption strip
const UP_W = 128; // the "coming up" card
const UP_H = 124;
const CARD_GAP = 18;
const LANE_TOPS = [142, 0]; // two rows of cards so close dates don't overlap
const RULER_TOP = 336; // leaves room under the cards for the yarn to hang
const RULER_H = 70;

type PinInput = { key: string; date: Date; width: number; height: number };
type Placed<T> = T & { dateX: number; centre: number; top: number };

// Place each card above its date, bumping it to the upper row (or sideways) when it would overlap a neighbour
function layoutPins<T extends PinInput>(items: T[], width: number): Placed<T>[] {
  const laneRight = LANE_TOPS.map(() => -Infinity);
  return [...items]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((item) => {
      const dateX = yearFraction(item.date) * width;
      let centre = Math.min(Math.max(dateX, item.width / 2), width - item.width / 2);
      let lane = laneRight.findIndex((right) => centre - item.width / 2 >= right + CARD_GAP);
      if (lane === -1) {
        lane = laneRight[0] <= laneRight[1] ? 0 : 1;
        centre = laneRight[lane] + CARD_GAP + item.width / 2;
      }
      laneRight[lane] = centre + item.width / 2;
      // Lane 0 sits just above the ruler; shorter cards are pushed down to line up with it
      const top = LANE_TOPS[lane] + (CARD_H - item.height);
      return { ...item, dateX, centre, top };
    });
}

// ─── A polaroid tied to the ruler with yarn ──────────────────────────────────
// The card's lift and scale are springs, and the yarn is recomputed from them every frame:
// its top end follows the little strip of tape on the card's bottom edge, it tightens as the card
// is lifted, goes slack again when it drops, and wobbles a bit on the way (its bend lags behind).
// The yarn is drawn behind the cards, so a lifted card never ends up underneath its own string.

const YARN = "#d0808a";
const YARN_SELECTED = "#8F0018";
const YARN_FIBRE = "#f3c9ce";
const CARD_SPRING = { stiffness: 260, damping: 22 };
const YARN_SPRING = { stiffness: 90, damping: 7, mass: 0.6 }; // loose and a little bouncy

type RulerPin = Placed<{ key: string; date: Date; width: number; height: number; side: 1 | -1 }>;

function useYarn(pin: RulerPin, lift: number, scaleTo: number) {
  const reduceMotion = useReducedMotion();
  const liftTarget = useMotionValue(0);
  const scaleTarget = useMotionValue(1);
  const y = useSpring(liftTarget, CARD_SPRING);
  const scale = useSpring(scaleTarget, CARD_SPRING);

  useEffect(() => {
    liftTarget.set(lift);
    scaleTarget.set(scaleTo);
  }, [lift, scaleTo, liftTarget, scaleTarget]);

  // Where the yarn is tied: the bottom-centre of the card, after its lift and scale
  const half = pin.height / 2;
  const tieX = pin.centre;
  const tieY = useTransform([y, scale], ([yy, sc]: number[]) => pin.top + half + yy + half * sc);

  // Slack: at rest the yarn is a bit longer than the gap, so it curls; lifting pulls it tighter
  const restLength = Math.hypot(pin.centre - pin.dateX, RULER_TOP - (pin.top + pin.height)) + 26;
  const bendTarget = useTransform(tieY, (ty: number) => {
    const gap = Math.hypot(tieX - pin.dateX, RULER_TOP - ty);
    const slack = Math.max(0, restLength - gap);
    return pin.side * Math.min(30, 6 + Math.sqrt(slack) * 5);
  });
  // The bend and the upper control point lag behind the card, which gives the wobble
  const bend = useSpring(bendTarget, YARN_SPRING);
  const lagY = useSpring(tieY, YARN_SPRING);

  const path = useTransform([tieY, lagY, bend], ([ty, ly, bd]: number[]) => {
    const h = RULER_TOP - ty;
    const c1y = (reduceMotion ? ty : ly) + h * 0.45;
    return `M${tieX},${ty} C${tieX + bd},${c1y} ${pin.dateX - bd},${RULER_TOP - h * 0.5} ${pin.dateX},${RULER_TOP}`;
  });

  return { y, scale, path };
}

function YarnPin({ pin, event, selected, onSelect }: { pin: RulerPin; event: EventItem; selected: boolean; onSelect: () => void }) {
  const [hovered, setHovered] = useState(false);
  const { y, scale, path } = useYarn(pin, hovered ? -10 : selected ? -6 : 0, hovered || selected ? 1.04 : 1);
  const photo = getPhotos(event)[0];

  return (
    <>
      <svg className="pointer-events-none absolute inset-0 z-[5] h-full w-full overflow-visible" aria-hidden="true">
        <motion.path
          d={path}
          fill="none"
          stroke={selected ? YARN_SELECTED : YARN}
          strokeWidth={selected ? 3 : 2.5}
          strokeLinecap="round"
          style={{ transition: "stroke 0.3s" }}
        />
        {/* A few loose fibres make it read as yarn rather than a line */}
        <motion.path d={path} fill="none" stroke={YARN_FIBRE} strokeWidth={1} strokeDasharray="1 9" strokeLinecap="round" />
        <circle cx={pin.dateX} cy={RULER_TOP} r={selected ? 9 : 7} fill="#8F0018" stroke="#ffffff" strokeWidth={3} />
      </svg>

      <motion.button
        type="button"
        onClick={onSelect}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        aria-pressed={selected}
        aria-label={`${event.title}, ${event.date}`}
        className={`absolute block bg-white p-2 pb-[34px] text-left shadow-[0_16px_28px_-14px_rgba(0,0,0,0.45)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-red/40 ${
          selected ? "z-30 outline outline-[3px] outline-offset-[3px] outline-brand-red" : hovered ? "z-30" : "z-10"
        }`}
        style={{ left: pin.centre - pin.width / 2, top: pin.top, width: pin.width, y, scale }}
      >
        <Tape className="w-14" />
        <div className="relative h-[92px] overflow-hidden bg-gray-200">
          {photo && <Image src={photo} alt="" fill sizes="156px" className="object-cover" />}
        </div>
        <span className={`${caveat.className} absolute inset-x-2.5 bottom-1.5 truncate text-lg font-bold text-[#1f2a44]`}>
          {event.title}
        </span>
        {/* Little strip of tape holding the yarn to the card's bottom edge */}
        <span aria-hidden="true" className="absolute -bottom-2 left-1/2 h-3.5 w-7 -translate-x-1/2 bg-brand-red/30" />
      </motion.button>
    </>
  );
}

// An event that hasn't happened yet: striped "photo to come" card on dashed yarn, with a hollow dot
function UpcomingPin({ pin, up }: { pin: RulerPin; up: UpcomingEvent & { when: Date } }) {
  const tieY = pin.top + pin.height;
  const h = RULER_TOP - tieY;
  const bend = pin.side * 14;
  const d = `M${pin.centre},${tieY} C${pin.centre + bend},${tieY + h * 0.45} ${pin.dateX - bend},${RULER_TOP - h * 0.5} ${pin.dateX},${RULER_TOP}`;

  return (
    <>
      <svg className="pointer-events-none absolute inset-0 z-[5] h-full w-full overflow-visible" aria-hidden="true">
        <path d={d} fill="none" stroke={YARN} strokeWidth={2.5} strokeDasharray="6 7" strokeLinecap="round" />
        <circle cx={pin.dateX} cy={RULER_TOP} r={7} fill="#ffffff" stroke="#8F0018" strokeWidth={3} />
      </svg>
      <div
        className="absolute z-10 bg-white p-2 pb-[30px] shadow-[0_16px_28px_-14px_rgba(0,0,0,0.45)]"
        style={{ left: pin.centre - pin.width / 2, top: pin.top, width: pin.width }}
        role="img"
        aria-label={`Coming up: ${up.title ?? "event"} on ${shortDate(up.when)}${up.stamp ? `, ${up.stamp.toLowerCase()}` : ""}`}
      >
        <Tape className="w-12" />
        <div className="flex h-[86px] items-center justify-center" style={{ backgroundImage: STRIPES }}>
          {up.stamp && <SoldOutStamp text={up.stamp} />}
        </div>
        <span className={`${caveat.className} absolute inset-x-2.5 bottom-1 truncate text-lg font-bold text-[#1f2a44]`}>
          {up.title ? `${up.title} · ` : ""}
          {shortDate(up.when)} · coming up
        </span>
      </div>
    </>
  );
}

function SchoolYearRuler({
  year,
  items,
  selectedId,
  onSelect,
}: {
  year: number;
  items: DatedEvent[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const areaRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const today = useToday();

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const measure = () => setWidth(el.offsetWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Past events plus anything still coming up this year
  const pins = useMemo(() => {
    if (!width) return [];
    const inputs = [
      ...items.map((item) => ({ key: item.event.id, date: item.date, width: CARD_W, height: CARD_H, kind: "event" as const, item })),
      ...upcomingEvents
        .filter((u) => u.when.getFullYear() === year && (!today || u.when >= today))
        .map((u) => ({ key: `up-${u.date}`, date: u.when, width: UP_W, height: UP_H, kind: "upcoming" as const, up: u })),
    ];
    // Alternate which way each strand of yarn curls
    return layoutPins(inputs, width).map((pin, i) => ({ ...pin, side: (i % 2 === 0 ? -1 : 1) as 1 | -1 }));
  }, [items, width, year, today]);

  // On narrow screens the ruler scrolls sideways: keep the selected event in view
  useEffect(() => {
    const el = scrollRef.current;
    const pin = pins.find((p) => p.key === selectedId);
    if (!el || !pin || el.scrollWidth <= el.clientWidth) return;
    el.scrollTo({ left: Math.max(0, pin.centre - el.clientWidth / 2), behavior: "smooth" });
  }, [pins, selectedId]);

  const todayX = today && today.getFullYear() === year ? yearFraction(today) : null;

  return (
    <div ref={scrollRef} className="overflow-x-auto overflow-y-hidden pb-9 pt-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div ref={areaRef} className="relative min-w-[960px]" style={{ height: RULER_TOP + RULER_H }}>
        {/* Polaroids tied to their dates with yarn (and dashed yarn for what's still to come) */}
        {pins.map((pin) =>
          pin.kind === "event" ? (
            <YarnPin key={pin.key} pin={pin} event={pin.item.event} selected={pin.key === selectedId} onSelect={() => onSelect(pin.key)} />
          ) : (
            <UpcomingPin key={pin.key} pin={pin} up={pin.up} />
          ),
        )}

        {/* The ruler: white, with red ticks */}
        <div
          className="absolute inset-x-0 overflow-hidden rounded-[4px] bg-white shadow-[0_14px_24px_-16px_rgba(0,0,0,0.4)]"
          style={{ top: RULER_TOP, height: RULER_H }}
        >
          <div
            className="absolute inset-x-0 top-0 h-5"
            style={{
              backgroundImage: "linear-gradient(90deg, rgba(143,0,24,0.5) 1.5px, transparent 1.5px)",
              backgroundSize: `${100 / 48}% 100%`,
            }}
          />
          {MONTHS.map((m, i) => (
            <div key={m} className="absolute top-0" style={{ left: `${(i / 12) * 100}%`, width: `${100 / 12}%` }}>
              <span className="absolute left-0 top-0 h-9 w-0.5 bg-[#1f2a44]/60" />
              <span className="absolute left-1/2 top-[26px] -translate-x-1/2 font-mono text-[10px] font-bold text-[#1f2a44]/60">{m}</span>
            </div>
          ))}
          {TERMS.map((term) => (
            <span
              key={term.name}
              className={`absolute bottom-2.5 text-[11px] text-black/50 ${STAMP_TEXT} tracking-[0.2em]`}
              style={{ left: `calc(${(term.start / 12) * 100}% + 12px)` }}
            >
              {term.name} {year}
            </span>
          ))}
        </div>

        {/* "Today" marker */}
        {todayX !== null && (
          <div
            className="pointer-events-none absolute z-20 -translate-x-1/2 text-center"
            style={{ left: `${todayX * 100}%`, top: RULER_TOP + RULER_H - 2 }}
          >
            <span className="mx-auto block h-0 w-0 border-x-[7px] border-b-[10px] border-x-transparent border-b-brand-red" />
            <span className={`${caveat.className} block whitespace-nowrap text-lg font-bold leading-none text-brand-red`}>today</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Phone timeline: the same ruler, standing upright ────────────────────────

// One slice of the upright ruler (stacked slices make one continuous ruler)
function RulerSlice({ first, last, children }: { first?: boolean; last?: boolean; children?: ReactNode }) {
  return (
    <div
      className={`relative w-10 shrink-0 self-stretch bg-white shadow-[inset_-1px_0_0_rgba(0,0,0,0.06)] ${first ? "rounded-t-[4px]" : ""} ${last ? "rounded-b-[4px]" : ""}`}
      style={{
        backgroundImage: "linear-gradient(180deg, rgba(143,0,24,0.5) 1.5px, transparent 1.5px)",
        backgroundSize: "14px 12px",
        backgroundRepeat: "repeat-y",
      }}
    >
      {children}
    </div>
  );
}

// A soft strand of yarn from the ruler's dot across to the polaroid
function MobileYarn({ selected, dashed }: { selected?: boolean; dashed?: boolean }) {
  return (
    <svg className="w-7 shrink-0 self-stretch overflow-visible" viewBox="0 0 28 100" preserveAspectRatio="none" aria-hidden="true">
      <path
        d="M-8,50 C8,53 12,36 28,40"
        fill="none"
        stroke={selected ? YARN_SELECTED : YARN}
        strokeWidth={selected ? 3 : 2.5}
        strokeLinecap="round"
        strokeDasharray={dashed ? "5 6" : undefined}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function MobileTimeline({
  year,
  items,
  selectedId,
  onSelect,
}: {
  year: number;
  items: DatedEvent[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const today = useToday();
  const upcoming = upcomingEvents.filter((u) => u.when.getFullYear() === year && today && u.when >= today);

  // Newest term first (the same order as the list of events below the heading)
  const bands = [...TERMS]
    .reverse()
    .map((term: Term) => ({
      term,
      events: items.filter((e) => termOf(e.date) === term),
      upcoming: upcoming.filter((u) => termOf(u.when) === term),
    }))
    .filter((b) => b.events.length > 0 || b.upcoming.length > 0);

  // The last row gets the ruler's rounded bottom end
  const lastBand = bands[bands.length - 1];
  const lastKey = lastBand
    ? lastBand.events.length > 0
      ? lastBand.events[lastBand.events.length - 1].event.id
      : lastBand.upcoming.length > 0
        ? lastBand.upcoming[lastBand.upcoming.length - 1].date
        : `label-${lastBand.term.name}`
    : "";

  return (
    <div>
      {bands.map((band, bi) => (
        <div key={band.term.name}>
          <div className="flex">
            <RulerSlice first={bi === 0} last={lastKey === `label-${band.term.name}`} />
            <p className={`${caveat.className} py-2 pl-5 text-2xl font-bold text-[#1f2a44]`}>
              <span className="-mx-1 px-1" style={{ backgroundImage: HIGHLIGHTER }}>
                {band.term.name} {year}
              </span>
            </p>
          </div>

          {band.upcoming.map((u) => (
            <div key={u.date} className="flex">
              <RulerSlice last={lastKey === u.date}>
                <span className="absolute right-[-8px] top-1/2 z-10 h-4 w-4 -translate-y-1/2 rounded-full border-[3px] border-brand-red bg-white" />
              </RulerSlice>
              <MobileYarn dashed />
              <div className="flex items-center gap-3 py-2.5">
                <div className="relative w-[96px] shrink-0 bg-white p-1.5 pb-2 shadow-[0_12px_22px_-12px_rgba(0,0,0,0.45)]">
                  <Tape className="w-10" />
                  <div className="flex h-[64px] items-center justify-center" style={{ backgroundImage: STRIPES }}>
                    {u.stamp && <SoldOutStamp text={u.stamp} className="text-[9px]" />}
                  </div>
                </div>
                <div>
                  <span className={`${caveat.className} block text-[22px] font-bold leading-[1.05] text-[#1f2a44]`}>
                    {u.title ?? "Coming up!"}
                  </span>
                  <span className={`mt-1 block text-[10px] text-brand-red ${STAMP_TEXT}`}>{shortDate(u.when)}</span>
                </div>
              </div>
            </div>
          ))}

          {band.events.map((item) => {
            const photo = getPhotos(item.event)[0];
            const selected = item.event.id === selectedId;
            return (
              <div key={item.event.id} className="flex">
                <RulerSlice last={lastKey === item.event.id}>
                  <span
                    className={`absolute right-[-8px] top-1/2 z-10 -translate-y-1/2 rounded-full border-[3px] border-[#FFF0F0] bg-brand-red ${
                      selected ? "h-5 w-5" : "h-4 w-4"
                    }`}
                  />
                </RulerSlice>
                <MobileYarn selected={selected} />
                <button
                  type="button"
                  onClick={() => onSelect(item.event.id)}
                  aria-pressed={selected}
                  className="flex min-w-0 flex-1 items-center gap-3 py-2.5 text-left"
                >
                  <span
                    className={`relative block w-[96px] shrink-0 bg-white p-1.5 pb-2 shadow-[0_12px_22px_-12px_rgba(0,0,0,0.45)] ${
                      selected ? "outline outline-[3px] outline-offset-2 outline-brand-red" : ""
                    }`}
                  >
                    <Tape className="w-10" />
                    <span className="relative block h-[64px] overflow-hidden bg-gray-200">
                      {photo && <Image src={photo} alt="" fill sizes="96px" className="object-cover" />}
                    </span>
                  </span>
                  <span className="min-w-0">
                    <span className={`${caveat.className} block text-[22px] font-bold leading-[1.05] text-[#1f2a44]`}>
                      {item.event.title}
                    </span>
                    <span className={`mt-1 block text-[10px] text-brand-red ${STAMP_TEXT}`}>
                      {shortDate(item.date)}
                      {selected ? " · showing ↓" : " · tap to see"}
                    </span>
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─── Photo viewer ────────────────────────────────────────────────────────────
// One big taped photo with arrows, and a row of thumbnails underneath to jump around.
// Swipe, arrows or the keyboard move through; tapping the big photo opens it full screen.

function PhotoViewer({
  photos,
  title,
  caption,
  onOpen,
}: {
  photos: string[];
  title: string;
  caption: string;
  onOpen: (index: number) => void;
}) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const count = photos.length;
  const thumbsRef = useRef<HTMLDivElement>(null);

  const show = (i: number) => {
    const nextIndex = (i + count) % count;
    setDirection(nextIndex > index || (index === count - 1 && nextIndex === 0) ? 1 : -1);
    setIndex(nextIndex);
  };

  // Keep the current thumbnail visible (scrolls only the thumbnail row, never the page)
  useEffect(() => {
    const rowEl = thumbsRef.current;
    const thumb = rowEl?.children[index] as HTMLElement | undefined;
    if (!rowEl || !thumb) return;
    rowEl.scrollTo({ left: thumb.offsetLeft - rowEl.clientWidth / 2 + thumb.offsetWidth / 2, behavior: "smooth" });
  }, [index]);

  return (
    <div
      className="w-full min-w-0"
      role="region"
      aria-roledescription="carousel"
      aria-label={`${title} photos`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") show(index + 1);
        else if (e.key === "ArrowLeft") show(index - 1);
      }}
    >
      <div className="relative bg-white p-2.5 pb-12 shadow-[0_18px_32px_-14px_rgba(0,0,0,0.45)] sm:p-3 sm:pb-[52px]">
        <Tape className="w-24" />
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-200 sm:aspect-[16/9] lg:aspect-[2/1]">
          <AnimatePresence initial={false} custom={direction}>
            <motion.button
              key={index}
              type="button"
              custom={direction}
              variants={{
                enter: (d: number) => ({ x: `${d * 30}%`, opacity: 0 }),
                centre: { x: 0, opacity: 1 },
                exit: (d: number) => ({ x: `${d * -30}%`, opacity: 0 }),
              }}
              initial="enter"
              animate="centre"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              drag={count > 1 ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.4}
              onDragEnd={(_, info) => {
                if (info.offset.x < -60) show(index + 1);
                else if (info.offset.x > 60) show(index - 1);
              }}
              onClick={() => onOpen(index)}
              aria-label={`Open ${title} photo ${index + 1} of ${count} full screen`}
              className="absolute inset-0 cursor-zoom-in touch-pan-y focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-brand-red/50"
            >
              <Image
                src={photos[index]}
                alt={`${title} - photo ${index + 1}`}
                fill
                sizes="(max-width: 1024px) 100vw, 760px"
                className="pointer-events-none select-none object-cover"
                draggable={false}
              />
            </motion.button>
          </AnimatePresence>

          {count > 1 && (
            <>
              <ViewerArrow dir="left" onClick={() => show(index - 1)} />
              <ViewerArrow dir="right" onClick={() => show(index + 1)} />
            </>
          )}
        </div>
        <span className={`${caveat.className} absolute bottom-2.5 left-4 text-[22px] font-bold text-[#1f2a44] sm:bottom-3 sm:text-2xl`}>
          {caption} &mdash; {index + 1} of {count}
        </span>
      </div>

      {count > 1 && (
        <div
          ref={thumbsRef}
          className="relative mt-3 flex gap-2.5 overflow-x-auto px-1 pb-2 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {photos.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => show(i)}
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === index}
              className={`relative h-12 w-16 shrink-0 overflow-hidden border-[3px] shadow-[0_2px_6px_rgba(0,0,0,0.2)] transition-all sm:h-14 sm:w-[4.5rem] ${
                i === index ? "border-brand-red" : "border-white opacity-70 hover:opacity-100"
              }`}
            >
              <Image src={src} alt="" fill sizes="72px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ViewerArrow({ dir, onClick }: { dir: "left" | "right"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === "left" ? "Previous photo" : "Next photo"}
      className={`absolute top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#1f2a44] shadow-md transition-colors hover:bg-brand-red hover:text-white sm:h-12 sm:w-12 ${
        dir === "left" ? "left-3" : "right-3"
      }`}
    >
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={dir === "left" ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
      </svg>
    </button>
  );
}

// ─── Selected event: ticket, note and photos ─────────────────────────────────

function TicketStub({ event, date }: { event: EventItem; date: Date }) {
  return (
    <div className="relative flex w-full max-w-md bg-[#fde7ea] shadow-[0_12px_20px_-12px_rgba(0,0,0,0.35)]">
      <div className="min-w-0 flex-1 border-r-2 border-dashed border-brand-red/35 px-5 py-4">
        <p className={`text-[9px] text-brand-red ${STAMP_TEXT} tracking-[0.2em]`}>Admit one &middot; {semesterOf(date)}</p>
        <h3 className="mt-1.5 font-logo text-2xl font-black leading-[1.05] tracking-tight text-gray-900 sm:text-[1.7rem]">{event.title}</h3>
        {(event.location || event.time) && (
          <p className="mt-2 font-mono text-xs text-brand-body/80">{[event.location, event.time].filter(Boolean).join(" · ")}</p>
        )}
      </div>
      <div className={`${caveat.className} flex w-20 shrink-0 flex-col items-center justify-center leading-none text-brand-red sm:w-24`}>
        <span className="text-4xl font-bold sm:text-[2.6rem]">{date.getDate()}</span>
        <span className="text-lg font-bold">{date.toLocaleDateString("en-US", { month: "short" })}</span>
      </div>
      {/* Punched notches either side of the perforation */}
      <span aria-hidden="true" className="absolute -top-2 right-[4.5rem] h-4 w-4 rounded-full bg-[#FFF0F0] sm:right-[5.5rem]" />
      <span aria-hidden="true" className="absolute -bottom-2 right-[4.5rem] h-4 w-4 rounded-full bg-[#FFF0F0] sm:right-[5.5rem]" />
    </div>
  );
}

function EventDetail({ item, onOpen }: { item: DatedEvent; onOpen: (index: number) => void }) {
  const { event, date } = item;
  const photos = getPhotos(event);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="grid items-start gap-8 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-10"
    >
      <div>
        <TicketStub event={event} date={date} />
        {event.description && (
          <p className={`${caveat.className} mt-4 max-w-md text-[21px] font-medium leading-snug text-[#1f2a44] sm:text-[22px]`}>
            {event.description}
          </p>
        )}
        {photos.length > 0 && (
          <button
            type="button"
            onClick={() => onOpen(0)}
            className={`${caveat.className} mt-4 text-[22px] font-bold text-brand-red transition-transform hover:translate-x-1`}
          >
            {photos.length === 1 ? "see it up close →" : "open full screen →"}
          </button>
        )}
      </div>

      {photos.length > 0 ? (
        <PhotoViewer key={event.id} photos={photos} title={event.title} caption={shortDate(date)} onOpen={onOpen} />
      ) : (
        <p className={`${caveat.className} text-2xl text-brand-body/60`}>Photos coming soon.</p>
      )}
    </motion.div>
  );
}

// ─── Page section ────────────────────────────────────────────────────────────

export function EventsSection() {
  const [year, setYear] = useState(years[0] ?? new Date().getFullYear());
  const itemsThisYear = useMemo(() => datedEvents.filter((e) => e.date.getFullYear() === year), [year]);
  const [selectedId, setSelectedId] = useState<string | null>(itemsThisYear[0]?.event.id ?? null);
  const selected = itemsThisYear.find((e) => e.event.id === selectedId) ?? itemsThisYear[0];

  const [lightbox, setLightbox] = useState<LightboxState>(null);
  const closeLightbox = useCallback(() => setLightbox(null), []);
  const changeLightbox = useCallback((index: number) => setLightbox((prev) => (prev ? { ...prev, index } : prev)), []);

  const today = useToday();
  const nextUp = today ? upcomingEvents.find((u) => u.when >= today) : undefined;

  const latest = datedEvents[0];

  // The taped photo beside the heading
  const heroPhoto = HERO_PHOTO
    ? HERO_PHOTO
    : latest
      ? {
          src: getPhotos(latest.event)[1] ?? getPhotos(latest.event)[0],
          caption: `${latest.event.title} \u2014 ${monthYear(latest.date)}`,
        }
      : null;

  const detailRef = useRef<HTMLDivElement>(null);
  const scrollToDetail = () => setTimeout(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);

  // Phones: the details sit below the timeline, so bring them into view after picking an event
  const selectOnPhone = (id: string) => {
    setSelectedId(id);
    scrollToDetail();
  };

  const showLatest = () => {
    if (!latest) return;
    setYear(latest.date.getFullYear());
    setSelectedId(latest.event.id);
    scrollToDetail();
  };

  const chooseYear = (y: number) => {
    setYear(y);
    setSelectedId(datedEvents.find((e) => e.date.getFullYear() === y)?.event.id ?? null);
  };

  return (
    // Skip transform animations for visitors who have "reduce motion" turned on
    <MotionConfig reducedMotion="user">
      <section className="mx-auto w-full max-w-7xl px-4 pb-14 pt-4 sm:px-6 sm:pb-20 lg:px-8">
        {/* ─── Heading + taped photo (like the About page) ─── */}
        <div className="grid gap-8 lg:grid-cols-[1fr_0.85fr] lg:items-center lg:gap-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: "easeOut" }}
            className="max-w-2xl"
          >
            <p className="mb-5 font-mono text-xs font-bold uppercase tracking-[0.24em] text-brand-red">UONotes / Events</p>
            <h1 className="font-logo text-[clamp(2.75rem,5.4vw,5rem)] font-black leading-[0.86] tracking-[-0.06em] text-gray-900">
              Things{" "}
              <span className="relative ml-[0.2em] inline-block">
                we
                {/* Red pen loop drawn around "we" */}
                <svg
                  aria-hidden="true"
                  className="pointer-events-none absolute -left-[0.24em] -top-[0.14em] h-[calc(100%+0.3em)] w-[calc(100%+0.48em)] overflow-visible"
                  viewBox="0 0 200 100"
                  preserveAspectRatio="none"
                  fill="none"
                >
                  <motion.path
                    d="M104,6 C158,4 195,22 195,50 C195,80 152,95 100,95 C46,95 5,80 5,50 C5,22 44,7 96,6 C124,5 146,9 162,15"
                    stroke="#8F0018"
                    strokeWidth={3.5}
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                    // Hidden until the pen starts drawing, so the round line cap doesn't show as a dot first
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{
                      pathLength: { duration: 0.9, delay: 0.6, ease: [0.65, 0, 0.35, 1] },
                      opacity: { duration: 0.01, delay: 0.6 },
                    }}
                  />
                </svg>
              </span>
              <br />
              got up to.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-brand-body sm:text-lg">
              Talks, socials and late study nights. A year of UONotes events, photos and all.
            </p>
            {latest && (
              <button
                type="button"
                onClick={showLatest}
                className="mt-5 inline-flex items-center gap-3 border-b-2 border-brand-red pb-2 font-bold text-brand-red transition-[gap] hover:gap-5"
              >
                See the latest event
                <span aria-hidden="true">&rarr;</span>
              </button>
            )}
          </motion.div>

          {heroPhoto?.src && (
            <motion.figure
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
              className="relative hidden bg-[#fffdf8] p-3 sm:block shadow-[0_24px_40px_-20px_rgba(0,0,0,0.4)] sm:p-4"
              style={{ backgroundImage: "repeating-linear-gradient(to bottom, transparent 0 27px, #dfe6ee 27px 28px)" }}
            >
              {/* Two strips of tape */}
              <span aria-hidden="true" className="absolute -top-3 left-[8%] z-10 h-6 w-24 bg-brand-red/20 sm:w-28" />
              <span aria-hidden="true" className="absolute -top-3 right-[8%] z-10 h-6 w-24 bg-brand-red/20 sm:w-28" />
              <div className="relative aspect-[16/9] overflow-hidden border-[6px] border-white bg-[#261b1d] shadow-[0_4px_10px_rgba(0,0,0,0.2)]">
                <Image src={heroPhoto.src} alt="" fill priority sizes="(max-width: 1024px) 100vw, 55vw" className="object-cover" />
              </div>
              <figcaption className={`${caveat.className} mx-1.5 mt-2 truncate text-xl font-bold leading-7 text-[#1f2a44] sm:text-[22px]`}>
                {heroPhoto.caption}
              </figcaption>
            </motion.figure>
          )}
        </div>

        {/* ─── Coming-up banner: the next event, or a nudge to follow along ─── */}
        <section
          aria-label={nextUp ? "Coming up next" : "Next event"}
          className="mt-8 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-3 border-l-[6px] border-brand-red bg-white p-4 shadow-[0_14px_24px_-18px_rgba(0,0,0,0.45)] sm:gap-x-6 sm:px-5 sm:py-4 md:grid-cols-[auto_minmax(0,1fr)_auto] md:px-7"
        >
          {/* Date stamp (or a pen mark when nothing is scheduled yet) */}
          <div className="flex min-w-[64px] flex-col items-center border-[3px] border-brand-red px-3 py-1.5 text-brand-red sm:min-w-[70px]">
            {nextUp ? (
              <>
                <span className="font-logo text-3xl font-black leading-none sm:text-[34px]">{nextUp.when.getDate()}</span>
                <span className={`mt-1 text-[10px] sm:text-xs ${STAMP_TEXT} tracking-[0.2em]`}>
                  {nextUp.when.toLocaleDateString("en-US", { month: "short" })}
                </span>
              </>
            ) : (
              <span className={`${caveat.className} py-1 text-3xl font-bold leading-none`}>soon</span>
            )}
          </div>

          <div className="min-w-0">
            <p className={`text-[10px] text-brand-red ${STAMP_TEXT} tracking-[0.2em]`}>{nextUp ? "Coming up next" : "What's next?"}</p>
            <h2 className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 font-logo text-xl font-black leading-tight tracking-[-0.03em] text-gray-900 sm:text-[28px]">
              {nextUp ? (nextUp.title ?? "Our next event") : "More events on the way"}
              {nextUp?.stamp && <SoldOutStamp text={nextUp.stamp} />}
            </h2>
            <p className={`${caveat.className} mt-1 text-[19px] font-medium leading-snug text-[#555] sm:text-[21px]`}>
              {nextUp
                ? (nextUp.note ??
                  `${nextUp.when.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}. See you there!`)
                : "We announce every event on Instagram first."}
            </p>
          </div>

          <div className="col-span-2 flex flex-wrap items-center gap-x-4 gap-y-2 md:col-span-1 md:flex-col md:items-end">
            {nextUp?.link && !nextUp.stamp && (
              <a
                href={nextUp.link}
                target="_blank"
                rel="noopener noreferrer"
                className={`border-2 border-dashed border-brand-red px-4 py-2.5 text-[11px] text-brand-red transition-colors hover:border-solid hover:bg-brand-red hover:text-white ${STAMP_TEXT}`}
              >
                Get tickets &rarr;
              </a>
            )}
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`bg-brand-red px-4 py-3 text-[11px] text-white shadow-[inset_0_0_0_2px_rgba(255,240,240,0.35)] transition-colors hover:bg-brand-red-hover ${STAMP_TEXT}`}
            >
              Follow @uonotes &rarr;
            </a>
            <span className={`text-[10px] text-gray-400 ${STAMP_TEXT}`}>for the next one</span>
          </div>
        </section>

        {datedEvents.length === 0 ? (
          <p className="py-20 text-brand-body">No past events yet. Check back soon.</p>
        ) : (
          <>
            {/* Year switcher, only when there's more than one year */}
            {years.length > 1 && (
              <div className={`mt-7 flex gap-5 text-[11px] ${STAMP_TEXT}`} role="tablist" aria-label="School year">
                {years.map((y) => (
                  <button
                    key={y}
                    type="button"
                    role="tab"
                    aria-selected={y === year}
                    onClick={() => chooseYear(y)}
                    className={`border-b-2 pb-1 transition-colors ${y === year ? "border-brand-red text-brand-red" : "border-transparent text-gray-500 hover:text-brand-red"}`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            )}

            {/* Tablets and up: the ruler across the page */}
            <div className="mt-4 hidden md:block">
              <SchoolYearRuler year={year} items={itemsThisYear} selectedId={selected?.event.id ?? null} onSelect={setSelectedId} />
            </div>

            {/* Phones: the ruler stands upright down the page */}
            <div className="mt-10 md:hidden">
              <MobileTimeline year={year} items={itemsThisYear} selectedId={selected?.event.id ?? null} onSelect={selectOnPhone} />
            </div>

            <div ref={detailRef} className="mt-8 scroll-mt-6 md:mt-2">
              <AnimatePresence mode="wait">
                {selected && (
                  <EventDetail
                    key={selected.event.id}
                    item={selected}
                    onOpen={(index) => setLightbox({ title: selected.event.title, photos: getPhotos(selected.event), index })}
                  />
                )}
              </AnimatePresence>
            </div>
          </>
        )}

        <PhotoLightbox state={lightbox} onClose={closeLightbox} onChange={changeLightbox} />
      </section>
    </MotionConfig>
  );
}