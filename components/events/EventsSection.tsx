"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { AnimatePresence, motion, MotionConfig, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { Caveat } from "next/font/google";
import { pastEvents, type EventItem } from "@/lib/events-data";
import { PhotoLightbox, type LightboxState } from "./PhotoLightbox";

// Handwriting font for captions and notes
const caveat = Caveat({ subsets: ["latin"], weight: ["500", "700"] });

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
  { name: "Winter", start: 0, colour: "rgba(170,200,245,0.55)", ticket: "#e4eefc", note: "#e4eefc", noteEdge: "#c5d7f2", marker: "rgba(150,185,240,0.85)", yarn: "#93acd4", yarnDark: "#4f6fa3", yarnFibre: "#c3d3ec" },
  { name: "Summer", start: 4, colour: "rgba(250,190,200,0.55)", ticket: "#fde7ea", note: "#fde7ea", noteEdge: "#f3c9cf", marker: "rgba(248,170,185,0.85)", yarn: "#dc9aa6", yarnDark: "#a8465a", yarnFibre: "#f1c9d0" },
  { name: "Fall", start: 8, colour: "rgba(190,230,200,0.6)", ticket: "#e3f4e6", note: "#dff0e1", noteEdge: "#bcdcc2", marker: "rgba(165,215,178,0.9)", yarn: "#8fb99a", yarnDark: "#4a8058", yarnFibre: "#c3dfca" },
] as const;
const termOf = (d: Date) => TERMS[Math.floor(d.getMonth() / 4)];
const semesterOf = (d: Date) => `${termOf(d).name} ${d.getFullYear()}`;

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

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

// ─── Layout constants ────────────────────────────────────────────────────────

const CARD_W = 176; // polaroid width on the ruler (px)
const CARD_H = 162; // its height: 8px border + 120px photo + 34px caption strip
const CARD_GAP = 18;
const LANE_TOPS = [176, 0]; // two rows of polaroids so close dates don't overlap
const RULER_TOP = 364;
const RULER_H = 84;
const DOT_Y = RULER_TOP + 50;
const TILTS = [-4, 3, -2, 4, -3, 2];

// Place each polaroid above its date, bumping it to the upper row (or sideways) when it would overlap a neighbour
function layoutPins(items: DatedEvent[], width: number) {
  const laneRight = LANE_TOPS.map(() => -Infinity);
  return [...items]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((item, i) => {
      const dateX = yearFraction(item.date) * width;
      let centre = Math.min(Math.max(dateX, CARD_W / 2), width - CARD_W / 2);
      let lane = laneRight.findIndex((right) => centre - CARD_W / 2 >= right + CARD_GAP);
      if (lane === -1) {
        lane = laneRight[0] <= laneRight[1] ? 0 : 1;
        centre = laneRight[lane] + CARD_GAP + CARD_W / 2;
      }
      laneRight[lane] = centre + CARD_W / 2;
      return { ...item, dateX, centre, top: LANE_TOPS[lane], tilt: TILTS[i % TILTS.length] };
    });
}

// ─── Small pieces ────────────────────────────────────────────────────────────

function Tape({ tilt, className = "" }: { tilt: number; className?: string }) {
  return (
    <span
      className={`pointer-events-none absolute -top-3 left-1/2 z-10 h-6 bg-brand-red/20 shadow-sm ${className}`}
      style={{ transform: `translateX(-50%) rotate(${tilt}deg)` }}
      aria-hidden="true"
    />
  );
}

function TicketStub({ event, date }: { event: EventItem; date: Date }) {
  const term = termOf(date);
  return (
    <div className="relative flex w-full max-w-md -rotate-[1.5deg] shadow-[0_10px_18px_-10px_rgba(0,0,0,0.3)]" style={{ backgroundColor: term.ticket }}>
      <div className="flex-1 border-r-2 border-dashed border-brand-red/30 px-5 py-4">
        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-brand-red">Admit one &middot; {semesterOf(date)}</p>
        <h3 className="mt-1.5 font-logo text-2xl font-black leading-[1.05] tracking-tight text-gray-900 sm:text-[1.7rem]">{event.title}</h3>
        {(event.location || event.time) && (
          <p className="mt-2 font-mono text-xs text-brand-body/80">{[event.location, event.time].filter(Boolean).join(" · ")}</p>
        )}
      </div>
      <div className={`${caveat.className} flex w-20 shrink-0 flex-col items-center justify-center leading-none text-brand-red sm:w-24`}>
        <span className="text-4xl font-bold sm:text-[2.6rem]">{date.getDate()}</span>
        <span className="text-lg font-bold uppercase">{date.toLocaleDateString("en-US", { month: "short" })}</span>
      </div>
      {/* Punched notches either side of the perforation */}
      <span aria-hidden="true" className="absolute -top-2 right-[4.5rem] h-4 w-4 rounded-full bg-[#fbf1f1] sm:right-[5.5rem]" />
      <span aria-hidden="true" className="absolute -bottom-2 right-[4.5rem] h-4 w-4 rounded-full bg-[#fbf1f1] sm:right-[5.5rem]" />
    </div>
  );
}

// ─── A polaroid tied to the ruler with yarn ──────────────────────────────────
// The card's lift / tilt / scale are springs, and the yarn is recomputed from them every frame:
// its top end follows the little tape strip on the card's bottom edge, it tightens as the card
// is lifted, goes slack again when it drops, and wobbles a bit on the way (its bends lag behind).
// The yarn is drawn *behind* the cards, so a hovered card never ends up underneath its own string.

type Pin = ReturnType<typeof layoutPins>[number];

const CARD_SPRING = { stiffness: 260, damping: 22 };
const YARN_SPRING = { stiffness: 90, damping: 7, mass: 0.6 }; // loose and a little bouncy

function YarnPin({ pin, selected, onSelect }: { pin: Pin; selected: boolean; onSelect: () => void }) {
  const photos = getPhotos(pin.event);
  const reduceMotion = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const lifted = hovered || selected;

  // Card pose (targets → springs)
  const liftTarget = useMotionValue(0);
  const tiltTarget = useMotionValue(pin.tilt);
  const scaleTarget = useMotionValue(1);
  const y = useSpring(liftTarget, CARD_SPRING);
  const rotate = useSpring(tiltTarget, CARD_SPRING);
  const scale = useSpring(scaleTarget, CARD_SPRING);

  useEffect(() => {
    liftTarget.set(hovered ? -10 : selected ? -6 : 0);
    tiltTarget.set(lifted ? 0 : pin.tilt);
    scaleTarget.set(lifted ? 1.05 : 1);
  }, [hovered, selected, lifted, pin.tilt, liftTarget, tiltTarget, scaleTarget]);

  // Where the yarn is tied: bottom-centre of the card, after its rotation, scale and lift
  const half = CARD_H / 2;
  const cardCentreY = pin.top + half;
  const tieX = useTransform([rotate, scale], ([r, sc]: number[]) => pin.centre - Math.sin((r * Math.PI) / 180) * half * sc);
  const tieY = useTransform([y, rotate, scale], ([yy, r, sc]: number[]) => cardCentreY + yy + Math.cos((r * Math.PI) / 180) * half * sc);

  // Slack: at rest the yarn is a bit longer than the gap, so it curls; lifting pulls it tighter
  const restLength = Math.hypot(pin.centre - pin.dateX, DOT_Y - (pin.top + CARD_H)) + 26;
  const side = pin.tilt > 0 ? 1 : -1;
  const bendTarget = useTransform([tieX, tieY], ([tx, ty]: number[]) => {
    const gap = Math.hypot(tx - pin.dateX, DOT_Y - ty);
    const slack = Math.max(0, restLength - gap);
    return side * Math.min(34, 6 + Math.sqrt(slack) * 5);
  });
  // The bend and the upper control point lag behind the card, which gives the wobble
  const bend = useSpring(bendTarget, YARN_SPRING);
  const lagX = useSpring(tieX, YARN_SPRING);
  const lagY = useSpring(tieY, YARN_SPRING);

  const path = useTransform([tieX, tieY, lagX, lagY, bend], ([tx, ty, lx, ly, bd]: number[]) => {
    const h = DOT_Y - ty;
    const c1x = (reduceMotion ? tx : lx) + bd;
    const c1y = (reduceMotion ? ty : ly) + h * 0.45;
    const c2x = pin.dateX - bd;
    const c2y = DOT_Y - h * 0.5;
    return `M${tx},${ty} C${c1x},${c1y} ${c2x},${c2y} ${pin.dateX},${DOT_Y}`;
  });

  return (
    <>
      {/* The yarn sits below every card but above the ruler */}
      <svg className="pointer-events-none absolute inset-0 z-[5] h-full w-full overflow-visible" aria-hidden="true">
        <motion.path
          d={path}
          fill="none"
          stroke={selected ? termOf(pin.date).yarnDark : termOf(pin.date).yarn}
          strokeWidth={selected ? 3 : 2.5}
          strokeLinecap="round"
          style={{ transition: "stroke 0.3s" }}
        />
        {/* A few loose fibres near the ends make it read as yarn rather than a line */}
        <motion.path d={path} fill="none" stroke={termOf(pin.date).yarnFibre} strokeWidth={1} strokeDasharray="1 9" strokeLinecap="round" />
        <circle cx={pin.dateX} cy={DOT_Y} r={selected ? 9 : 7} fill="#8a1c24" stroke="#fbf1f1" strokeWidth={4} />
      </svg>

      <motion.button
        type="button"
        onClick={onSelect}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        aria-pressed={selected}
        aria-label={`${pin.event.title}, ${pin.event.date}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`absolute block bg-white p-2 pb-[34px] text-left shadow-[0_16px_28px_-14px_rgba(0,0,0,0.45)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-red/40 ${
          lifted ? "z-30" : "z-10"
        } ${selected ? "ring-2 ring-brand-red/60" : ""}`}
        style={{ left: pin.centre - CARD_W / 2, top: pin.top, width: CARD_W, y, rotate, scale }}
      >
        <Tape tilt={-pin.tilt * 1.5} className="w-14" />
        <div className="relative h-[120px] overflow-hidden bg-gray-200">
          {photos[0] && <Image src={photos[0]} alt="" fill sizes="176px" className="object-cover" />}
        </div>
        <span className={`${caveat.className} absolute inset-x-2.5 bottom-1.5 truncate text-lg font-bold text-[#1f2a44]`}>{pin.event.title}</span>
        {/* Little strip of tape holding the yarn to the card's bottom edge */}
        <span aria-hidden="true" className="absolute -bottom-2 left-1/2 h-3.5 w-7 -translate-x-1/2 rotate-[-4deg] bg-brand-red/30 shadow-sm" />
      </motion.button>
    </>
  );
}

// ─── To-do sticky note for a term with no past events yet ─────────────────────
// The note takes the colour of the part of the ruler it sits on. Edit UPCOMING_NOTES to change
// what it says. A note can also carry a small "coming up" polaroid (e.g. a sold-out event), which
// is tied with dashed yarn to its date on the ruler — once the event happens and is added to the
// events data, it shows up as a real polaroid instead.

type TodoItem = { text: string; done: boolean };
type ComingUp = { date: string; caption: string; stamp?: string };
type UpcomingNote = { items: TodoItem[]; comingUp?: ComingUp };

const UPCOMING_NOTES: Record<string, UpcomingNote> = {
  "Fall 2026": {
    items: [
      { text: "plan fall events", done: true },
      { text: "announce on Instagram", done: true },
      { text: "more coming soon…", done: false },
    ],
    comingUp: { date: "2026-10-08T12:00:00", caption: "Oct 8 ♡", stamp: "SOLD OUT" },
  },
};

// Used for any upcoming term that has no entry above
const DEFAULT_NOTE: UpcomingNote = {
  items: [
    { text: "plan new events", done: true },
    { text: "announce on Instagram", done: false },
    { text: "see you there!", done: false },
  ],
};

const NOTE_W = 240;
const NOTE_TOP = 18;
const MINI_W = 112; // the little "coming up" polaroid
const MINI_H = 108;
const MINI_GAP = 18;

// The note itself (used by both the desktop ruler and the phone timeline)
function TodoNoteCard({ term, label, note }: { term: (typeof TERMS)[number]; label: string; note: UpcomingNote }) {
  return (
    <>
          <div
            className="relative px-[18px] pb-5 pt-4 [clip-path:polygon(0_0,100%_0,100%_calc(100%-30px),calc(100%-30px)_100%,0_100%)]"
            style={{ backgroundColor: term.note, backgroundImage: "linear-gradient(rgba(0,0,0,0.035), transparent 24px)" }}
          >
            <p className={`${caveat.className} border-b-2 pb-1.5 text-[28px] font-bold leading-none text-[#1f2a44]`} style={{ borderColor: term.noteEdge }}>
              {label} to-do
            </p>
            <ul className="mt-2 space-y-1.5">
              {note.items.map((item) => (
                <li key={item.text} className={`${caveat.className} flex items-center gap-2 text-[21px] leading-tight text-[#2e3650]`}>
                  <span aria-hidden="true" className="relative h-[15px] w-[15px] flex-none border-2 border-[#555]">
                    {item.done && <span className="absolute -left-px -top-[13px] text-[24px] font-bold leading-none text-brand-red">&#10003;</span>}
                  </span>
                  <span className={item.done ? "font-medium text-[#2e3650]/60 line-through decoration-brand-red/50" : "font-medium"}>
                    <span className="sr-only">{item.done ? "Done: " : "To do: "}</span>
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>
            <a
              href="https://www.instagram.com/uonotes"
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-4 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-brand-red px-3.5 py-2 text-[13px] font-bold text-white shadow-[0_6px_12px_-6px_rgba(138,28,36,0.6)] transition-all hover:-translate-y-0.5 hover:bg-brand-red-hover"
            >
              Follow @uonotes
              <span className="transition-transform group-hover:translate-x-0.5">&rarr;</span>
            </a>
          </div>
          {/* Curled corner */}
          <span
            aria-hidden="true"
            className="absolute bottom-0 right-0 h-[30px] w-[30px] [clip-path:polygon(0_0,100%_0,0_100%)]"
            style={{ backgroundImage: `linear-gradient(135deg, ${term.note}, #ffffff 45%, ${term.noteEdge})` }}
          />
    </>
  );
}

// Little "coming up" polaroid: photo still blank, stamped
function MiniComingUp({ term, comingUp }: { term: (typeof TERMS)[number]; comingUp: ComingUp }) {
  return (
    <>
      <Tape tilt={-6} className="w-10" />
      <div
        className="flex h-[74px] items-center justify-center"
        style={{ backgroundImage: `repeating-linear-gradient(45deg, ${term.note} 0 8px, ${term.noteEdge}66 8px 16px)` }}
      >
        {comingUp.stamp && (
          <span className="-rotate-[10deg] border-[3px] border-double border-brand-red/85 bg-[#fffdf8]/85 px-1.5 py-px font-mono text-[9px] font-bold tracking-[0.16em] text-brand-red">
            {comingUp.stamp}
          </span>
        )}
      </div>
      <span className={`${caveat.className} absolute bottom-1 left-2 text-[17px] font-bold text-[#1f2a44]`}>{comingUp.caption}</span>
    </>
  );
}

function ComingSoonNote({ term, year, width }: { term: (typeof TERMS)[number]; year: number; width: number }) {
  const label = `${term.name} ${year}`;
  const note = UPCOMING_NOTES[label] ?? DEFAULT_NOTE;
  const upcomingDate = note.comingUp ? parseDate(note.comingUp.date) : null;
  const showMini = !!(note.comingUp && upcomingDate && upcomingDate.getFullYear() === year);

  // Centre the note (plus its little polaroid) over the term, keeping it inside the ruler
  const groupW = NOTE_W + (showMini ? MINI_GAP + MINI_W : 0);
  const groupLeft = Math.min(Math.max(((term.start + 2) / 12) * width - groupW / 2, 8), width - groupW - 8);
  const miniLeft = groupLeft + NOTE_W + MINI_GAP;
  const miniTop = NOTE_TOP + 112;
  const dateX = showMini && upcomingDate ? yearFraction(upcomingDate) * width : 0;
  const tieX = miniLeft + MINI_W / 2;
  const tieY = miniTop + MINI_H - 4;

  return (
    <>
      {/* Dashed yarn from the little polaroid to its date, with a hollow dot (it hasn't happened yet) */}
      {showMini && (
        <svg className="pointer-events-none absolute inset-0 z-[5] h-full w-full overflow-visible" aria-hidden="true">
          <motion.path
            d={`M${tieX},${tieY} C${tieX + 10},${tieY + 60} ${dateX + 40},${DOT_Y - 70} ${dateX},${DOT_Y}`}
            fill="none"
            stroke={term.yarn}
            strokeWidth={2.5}
            strokeDasharray="6 7"
            strokeLinecap="round"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.9, ease: "easeOut" }}
          />
          <circle cx={dateX} cy={DOT_Y} r={7} fill="#fbf1f1" stroke="#8a1c24" strokeWidth={3} />
        </svg>
      )}

      {/* The sticky note */}
      <motion.div
        initial={{ opacity: 0, y: -12, rotate: -2.5 }}
        animate={{ opacity: 1, y: 0, rotate: -2.5 }}
        transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
        className="absolute z-[6] drop-shadow-[0_14px_14px_rgba(0,0,0,0.18)]"
        style={{ left: groupLeft, top: NOTE_TOP, width: NOTE_W }}
      >
        <TodoNoteCard term={term} label={label} note={note} />
      </motion.div>

      {/* Little "coming up" polaroid: photo still blank, stamped */}
      {showMini && note.comingUp && (
        <motion.div
          initial={{ opacity: 0, y: -20, rotate: 14 }}
          animate={{ opacity: 1, y: 0, rotate: 6 }}
          transition={{ type: "spring", stiffness: 180, damping: 14, delay: 0.6 }}
          className="absolute z-[7] bg-white p-1.5 pb-[26px] shadow-[0_10px_18px_-10px_rgba(0,0,0,0.45)]"
          style={{ left: miniLeft, top: miniTop, width: MINI_W }}
          aria-label={`${note.comingUp.caption.replace("♡", "").trim()}${note.comingUp.stamp ? `, ${note.comingUp.stamp.toLowerCase()}` : ""}`}
          role="img"
        >
          <MiniComingUp term={term} comingUp={note.comingUp} />
        </motion.div>
      )}
    </>
  );
}

// "Today" is read in the visitor's browser (not when the page was built), so it's always current
function useToday() {
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => setToday(new Date()), []);
  return today;
}

// Terms of this year that haven't finished yet and have no events: they get a to-do note
function upcomingTerms(year: number, items: DatedEvent[], today: Date | null) {
  if (!today) return [];
  return TERMS.filter((term) => {
    const termEnd = new Date(year, term.start + 4, 0);
    return termEnd >= today && !items.some((e) => termOf(e.date) === term);
  });
}

// ─── The ruler ───────────────────────────────────────────────────────────────

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
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const measure = () => setWidth(el.offsetWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const pins = useMemo(() => (width ? layoutPins(items, width) : []), [items, width]);

  // On narrow screens the ruler scrolls sideways: keep the selected event in view
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    const pin = pins.find((p) => p.event.id === selectedId);
    if (!el || !pin || el.scrollWidth <= el.clientWidth) return;
    el.scrollTo({ left: Math.max(0, pin.centre - el.clientWidth / 2), behavior: "smooth" });
  }, [pins, selectedId]);

  const today = useToday();
  const upcoming = upcomingTerms(year, items, today);
  const todayX = today && today.getFullYear() === year ? yearFraction(today) : null;

  return (
    // Sideways scroll on small screens so the ruler keeps its proportions
    <div ref={scrollRef} className="-mx-4 overflow-x-auto overflow-y-hidden px-4 pb-4 pt-8 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
      <div ref={areaRef} className="relative min-w-[960px]" style={{ height: RULER_TOP + RULER_H + 12 }}>
        {/* To-do sticky notes over upcoming terms that don't have past events yet */}
        {width > 0 &&
          upcoming.map((term) => <ComingSoonNote key={term.name} term={term} year={year} width={width} />)}

        {/* Pinned polaroids, each tied to its date with a strand of yarn */}
        {pins.map((pin) => (
          <YarnPin key={pin.event.id} pin={pin} selected={pin.event.id === selectedId} onSelect={() => onSelect(pin.event.id)} />
        ))}

        {/* The ruler itself */}
        <div
          className="absolute inset-x-0 overflow-hidden rounded-md bg-[#f6e4b8] shadow-[0_12px_20px_-12px_rgba(0,0,0,0.35),inset_0_-3px_0_rgba(0,0,0,0.08)]"
          style={{ top: RULER_TOP, height: RULER_H }}
        >
          {/* Term bands */}
          {TERMS.map((term) => (
            <div
              key={term.name}
              className="absolute inset-y-0 flex items-end px-3 pb-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-black/55"
              style={{ left: `${(term.start / 12) * 100}%`, width: `${(4 / 12) * 100}%`, backgroundColor: term.colour }}
            >
              {term.name} {year}
            </div>
          ))}
          {/* Small ticks (4 per month) */}
          <div
            className="absolute inset-x-0 top-0 h-6"
            style={{ backgroundImage: "linear-gradient(90deg, rgba(0,0,0,0.4) 1.5px, transparent 1.5px)", backgroundSize: `${100 / 48}% 100%` }}
          />
          {/* Month ticks and labels */}
          {MONTHS.map((m, i) => (
            <div key={m} className="absolute top-0" style={{ left: `${(i / 12) * 100}%`, width: `${100 / 12}%` }}>
              <span className="absolute left-0 top-0 h-10 w-0.5 bg-black/55" />
              <span className="absolute left-1/2 top-[30px] -translate-x-1/2 font-mono text-[10px] font-bold text-black/60">{m}</span>
            </div>
          ))}
        </div>

        {/* "Today" marker */}
        {todayX !== null && (
          <div className="pointer-events-none absolute z-20 -translate-x-1/2 text-center" style={{ left: `${todayX * 100}%`, top: RULER_TOP + RULER_H - 4 }}>
            <span className="mx-auto block h-0 w-0 border-x-[7px] border-b-[10px] border-x-transparent border-b-brand-red" />
            <span className={`${caveat.className} block whitespace-nowrap text-lg font-bold leading-none text-brand-red`}>today</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Phone timeline: the same ruler, standing upright ────────────────────────
// On small screens the ruler runs down the left edge, split into its Winter / Summer / Fall bands.
// Each event's polaroid is tied to its dot on the ruler with a short strand of season-coloured yarn,
// and a term that hasn't happened yet shows its to-do note and "coming up" polaroid instead.

const M_RULER_W = 46; // width of the upright ruler (px)
const M_YARN_W = 30; // gap the yarn crosses between the ruler and the polaroid

// One horizontal slice of the upright ruler; stacked slices make one continuous ruler
function RulerSlice({ term, first, last, children }: { term: (typeof TERMS)[number]; first?: boolean; last?: boolean; children?: ReactNode }) {
  return (
    <div
      className={`relative shrink-0 self-stretch bg-[#f6e4b8] shadow-[inset_-3px_0_0_rgba(0,0,0,0.08)] ${first ? "rounded-t-md" : ""} ${last ? "rounded-b-md" : ""}`}
      style={{ width: M_RULER_W }}
    >
      <div className="absolute inset-0" style={{ backgroundColor: term.colour }} />
      {/* tick marks */}
      <div
        className="absolute inset-y-0 left-0 w-3.5"
        style={{ backgroundImage: "linear-gradient(180deg, rgba(0,0,0,0.4) 1.5px, transparent 1.5px)", backgroundSize: "100% 12px" }}
      />
      {children}
    </div>
  );
}

// A soft strand of yarn from the ruler's dot to the polaroid
function MobileYarn({ colour, dashed }: { colour: string; dashed?: boolean }) {
  return (
    <svg
      className="shrink-0 self-stretch overflow-visible"
      width={M_YARN_W}
      viewBox={`0 0 ${M_YARN_W} 100`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d={`M-8,50 C8,52 12,38 ${M_YARN_W},40`}
        fill="none"
        stroke={colour}
        strokeWidth={2.5}
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
  const upcoming = upcomingTerms(year, items, today);
  // Oldest at the top, like reading a ruler from January down
  const sorted = [...items].sort((a, b) => a.date.getTime() - b.date.getTime());
  const bands = TERMS.map((term) => ({
    term,
    events: sorted.filter((e) => termOf(e.date) === term),
    upcoming: upcoming.includes(term),
  })).filter((b) => b.events.length > 0 || b.upcoming);

  return (
    <div className="pl-1">
      {bands.map((band, bi) => {
        const label = `${band.term.name} ${year}`;
        const note = UPCOMING_NOTES[label] ?? DEFAULT_NOTE;
        const upcomingDate = note.comingUp ? parseDate(note.comingUp.date) : null;
        const isToday = today && termOf(today) === band.term && today.getFullYear() === year;
        return (
          <div key={band.term.name}>
            {/* Band label */}
            <div className="flex">
              <RulerSlice term={band.term} first={bi === 0}>
                <span className="absolute inset-x-0 top-2 text-center font-mono text-[9px] font-bold uppercase leading-tight tracking-[0.12em] text-black/55">
                  {band.term.name.slice(0, 3)}
                  <br />
                  {String(year).slice(2)}
                </span>
              </RulerSlice>
              <p className={`${caveat.className} pb-3 pl-4 pt-2 text-2xl font-bold text-[#1f2a44]`}>
                <span style={{ backgroundImage: `linear-gradient(transparent 55%, ${band.term.marker} 55%)` }}>{label}</span>
              </p>
            </div>

            {/* Past events in this term */}
            {band.events.map((item, i) => {
              const photos = getPhotos(item.event);
              const selected = item.event.id === selectedId;
              const tilt = TILTS[i % TILTS.length] * 0.6;
              return (
                <div key={item.event.id} className="flex">
                  <RulerSlice term={band.term} last={bi === bands.length - 1 && i === band.events.length - 1 && !band.upcoming}>
                    <span className="absolute left-[18px] right-0 top-1/2 -translate-y-1/2 font-mono text-[8px] font-bold uppercase text-black/60">
                      {MONTHS[item.date.getMonth()]}
                    </span>
                    <span
                      className="absolute right-[-7px] top-1/2 z-10 -translate-y-1/2 rounded-full border-4 border-[#fbf1f1] bg-brand-red transition-all"
                      style={{ width: selected ? 20 : 16, height: selected ? 20 : 16, marginRight: selected ? -2 : 0 }}
                    />
                  </RulerSlice>
                  <MobileYarn colour={selected ? band.term.yarnDark : band.term.yarn} />
                  <div className="flex min-w-0 flex-1 items-center gap-3 py-4">
                    <motion.button
                      type="button"
                      onClick={() => onSelect(item.event.id)}
                      aria-pressed={selected}
                      aria-label={`${item.event.title}, ${item.event.date}`}
                      initial={{ opacity: 0, x: 16, rotate: tilt }}
                      whileInView={{ opacity: 1, x: 0, rotate: selected ? 0 : tilt }}
                      animate={{ rotate: selected ? 0 : tilt, scale: selected ? 1.04 : 1 }}
                      whileTap={{ scale: 0.97 }}
                      viewport={{ once: true, margin: "-40px" }}
                      transition={{ type: "spring", stiffness: 240, damping: 22 }}
                      className={`relative w-[132px] shrink-0 bg-white p-1.5 pb-2 shadow-[0_12px_22px_-12px_rgba(0,0,0,0.45)] ${selected ? "ring-2 ring-brand-red/60" : ""}`}
                    >
                      <Tape tilt={-tilt * 2} className="w-12" />
                      <div className="relative h-[92px] overflow-hidden bg-gray-200">
                        {photos[0] && <Image src={photos[0]} alt="" fill sizes="132px" className="object-cover" />}
                      </div>
                    </motion.button>
                    <button type="button" onClick={() => onSelect(item.event.id)} className="min-w-0 text-left">
                      <span className={`${caveat.className} block text-[22px] font-bold leading-[1.05] text-[#1f2a44]`}>{item.event.title}</span>
                      <span className="mt-1 block font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-brand-red">
                        {item.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        {selected ? " · showing ↓" : " · tap to see"}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Upcoming term: today marker, to-do note and the "coming up" polaroid */}
            {band.upcoming && (
              <>
                {isToday && (
                  <div className="flex">
                    <RulerSlice term={band.term}>
                      <span className="absolute right-[-12px] top-1/2 z-10 h-0 w-0 -translate-y-1/2 border-y-[7px] border-r-[10px] border-y-transparent border-r-brand-red" />
                    </RulerSlice>
                    <p className={`${caveat.className} self-center pl-5 text-lg font-bold text-brand-red`}>&larr; today</p>
                  </div>
                )}
                <div className="flex">
                  <RulerSlice term={band.term} last={bi === bands.length - 1 && !note.comingUp} />
                  <motion.div
                    initial={{ opacity: 0, y: 12, rotate: -2 }}
                    whileInView={{ opacity: 1, y: 0, rotate: -2 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="relative my-4 ml-5 w-full max-w-[250px] drop-shadow-[0_14px_14px_rgba(0,0,0,0.18)]"
                  >
                    <TodoNoteCard term={band.term} label={label} note={note} />
                  </motion.div>
                </div>
                {note.comingUp && upcomingDate && (
                  <div className="flex">
                    <RulerSlice term={band.term} last={bi === bands.length - 1}>
                      <span className="absolute left-[18px] right-0 top-1/2 -translate-y-1/2 font-mono text-[8px] font-bold uppercase text-black/60">
                        {MONTHS[upcomingDate.getMonth()]}
                      </span>
                      <span className="absolute right-[-7px] top-1/2 z-10 h-4 w-4 -translate-y-1/2 rounded-full border-[3px] border-brand-red bg-[#fbf1f1]" />
                    </RulerSlice>
                    <MobileYarn colour={band.term.yarn} dashed />
                    <div className="flex items-center gap-3 py-4">
                      <motion.div
                        initial={{ opacity: 0, y: -14, rotate: 12 }}
                        whileInView={{ opacity: 1, y: 0, rotate: 5 }}
                        viewport={{ once: true, margin: "-40px" }}
                        transition={{ type: "spring", stiffness: 180, damping: 14 }}
                        className="relative w-[112px] shrink-0 bg-white p-1.5 pb-[26px] shadow-[0_10px_18px_-10px_rgba(0,0,0,0.45)]"
                        role="img"
                        aria-label={`${note.comingUp.caption.replace("♡", "").trim()}${note.comingUp.stamp ? `, ${note.comingUp.stamp.toLowerCase()}` : ""}`}
                      >
                        <MiniComingUp term={band.term} comingUp={note.comingUp} />
                      </motion.div>
                      <p className={`${caveat.className} text-xl font-bold leading-tight text-[#1f2a44]`}>coming up!</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Photo viewer ────────────────────────────────────────────────────────────
// One big polaroid with arrows on the photo, and a row of thumbnails underneath to jump around.
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

  // Keep the current thumbnail visible in the thumbnail row
  // (scrolls only the thumbnail row, never the page)
  useEffect(() => {
    const row = thumbsRef.current;
    const thumb = row?.children[index] as HTMLElement | undefined;
    if (!row || !thumb) return;
    row.scrollTo({ left: thumb.offsetLeft - row.clientWidth / 2 + thumb.offsetWidth / 2, behavior: "smooth" });
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
      <div className="relative -rotate-1 bg-white p-2.5 pb-11 shadow-[0_18px_32px_-14px_rgba(0,0,0,0.45)] sm:p-3 sm:pb-12">
        <Tape tilt={3} className="w-24" />
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-200 sm:aspect-[16/10]">
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
              <Image src={photos[index]} alt={`${title} - photo ${index + 1}`} fill sizes="(max-width: 1024px) 100vw, 640px" className="pointer-events-none select-none object-cover" draggable={false} />
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

      {/* Thumbnails */}
      {count > 1 && (
        <div
          ref={thumbsRef}
          className="mt-5 flex gap-2.5 overflow-x-auto px-1 pb-2 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {photos.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => show(i)}
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === index}
              className={`relative h-12 w-16 shrink-0 overflow-hidden border-[3px] shadow-[0_2px_6px_rgba(0,0,0,0.2)] transition-all sm:h-14 sm:w-[4.5rem] ${
                i === index ? "-translate-y-0.5 border-brand-red" : "border-white opacity-70 hover:opacity-100"
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
      className={`absolute top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-brand-dark shadow-md backdrop-blur-sm transition-colors hover:bg-brand-red hover:text-white sm:h-12 sm:w-12 ${
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

function EventDetail({ item, onOpen }: { item: DatedEvent; onOpen: (index: number) => void }) {
  const { event, date } = item;
  const photos = getPhotos(event);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="grid items-center gap-10 lg:grid-cols-[minmax(0,24rem)_1fr] lg:gap-14"
    >
      <div>
        <TicketStub event={event} date={date} />
        {event.description && (
          <p className={`${caveat.className} mt-6 max-w-md text-[22px] font-medium leading-snug text-[#1f2a44] sm:text-2xl`}>{event.description}</p>
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
        <PhotoViewer photos={photos} title={event.title} caption={date.toLocaleDateString("en-US", { month: "short", day: "numeric" })} onOpen={onOpen} />
      ) : (
        <p className={`${caveat.className} text-2xl text-brand-body/60`}>Photos coming soon.</p>
      )}
    </motion.div>
  );
}

// ─── Polaroids of recent events dropped next to the title ────────────────────

const TOSS = [
  { x: 0, y: 26, r: -9 },
  { x: 118, y: 0, r: 5 },
  { x: 236, y: 30, r: -3 },
];

function TossedPolaroids({ items }: { items: DatedEvent[] }) {
  const withPhotos = items.filter((e) => getPhotos(e.event).length > 0);
  if (withPhotos.length === 0) return null;
  return (
    <div className="relative h-[150px] w-[320px] shrink-0 origin-left scale-[0.85] sm:h-[170px] sm:w-[370px] sm:scale-100 md:mb-2" aria-hidden="true">
      {withPhotos.map((item, i) => (
        <motion.div
          key={item.event.id}
          initial={{ opacity: 0, y: -140, rotate: TOSS[i].r * 3 }}
          animate={{ opacity: 1, y: TOSS[i].y, rotate: TOSS[i].r }}
          transition={{ type: "spring", stiffness: 170, damping: 15, delay: 0.7 + i * 0.18 }}
          className="absolute w-[130px] bg-white p-1.5 pb-6 shadow-[0_10px_18px_-10px_rgba(0,0,0,0.45)]"
          style={{ left: TOSS[i].x, zIndex: i === 1 ? 2 : 1 }}
        >
          <div className="relative h-[92px] overflow-hidden bg-gray-200">
            <Image src={getPhotos(item.event)[0]} alt="" fill sizes="130px" className="object-cover" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Handwritten margin notes ────────────────────────────────────────────────
// Red-pen notes in the empty space either side of the page, like someone annotating their notebook.
// They only appear on very wide screens (where those sides would otherwise be blank) and are purely
// decorative. Edit the wording, position (top, in px from the top of the section) and tilt here.
//   highlight → optional word to mark with a term-coloured highlighter ("Winter" | "Summer" | "Fall")
//   arrow     → optional hand-drawn arrow under the note: "down-right", "down-left" or "right"

type MarginNote = {
  side: "left" | "right";
  top: number;
  tilt: number;
  lines: string[];
  colour?: "red" | "ink";
  highlight?: { word: string; term: "Winter" | "Summer" | "Fall" };
  arrow?: "down-right" | "down-left" | "right";
};

const MARGIN_NOTES: MarginNote[] = [
  { side: "left", top: 110, tilt: -6, lines: ["our first year", "as a club ♡"], colour: "red", arrow: "down-right" },
  { side: "left", top: 470, tilt: -4, lines: ["pick an event", "on the ruler →"] },
  { side: "left", top: 640, tilt: 3, lines: ["Winter was", "busy!!"], highlight: { word: "busy!!", term: "Winter" } },
  { side: "right", top: 120, tilt: 5, lines: ["← that's us", "having fun"] },
  { side: "right", top: 470, tilt: -4, lines: ["Oct 8 sold out", "in no time!! ✎"], colour: "red", arrow: "down-left" },
  { side: "right", top: 720, tilt: 4, lines: ["more fall", "events soon…"], highlight: { word: "fall", term: "Fall" } },
];

const ARROWS: Record<NonNullable<MarginNote["arrow"]>, { w: number; h: number; d: string; head: string }> = {
  "down-right": { w: 170, h: 170, d: "M20,8 C10,80 60,130 150,160", head: "M150,160 l-18,-2 M150,160 l-6,-16" },
  "down-left": { w: 110, h: 110, d: "M96,8 C60,18 36,52 26,100", head: "M26,100 l-6,-17 M26,100 l14,-11" },
  right: { w: 120, h: 40, d: "M6,24 C40,10 80,30 112,18", head: "M112,18 l-15,-6 M112,18 l-12,11" },
};

function MarginNotes() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden min-[1700px]:block">
      {MARGIN_NOTES.map((note, i) => {
        const ink = note.colour === "red" ? "#8a1c24" : "#1f2a44";
        const arrow = note.arrow ? ARROWS[note.arrow] : null;
        const marker = note.highlight ? TERMS.find((t) => t.name === note.highlight?.term)?.marker : undefined;
        return (
          <motion.div
            key={i}
            className={`${caveat.className} absolute w-[240px] text-[27px] font-bold leading-[1.2]`}
            style={{
              top: note.top,
              color: ink,
              rotate: note.tilt,
              ...(note.side === "left" ? { right: "calc(50% + 610px)" } : { left: "calc(50% + 610px)" }),
            }}
            // "Written in": revealed left to right, one note after another once the header has animated in
            initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
            animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
            transition={{ duration: 0.7, delay: 1.5 + i * 0.25, ease: "easeOut" }}
          >
            {note.lines.map((line) => {
              const hl = note.highlight && line.includes(note.highlight.word) ? note.highlight.word : null;
              if (!hl) return <p key={line}>{line}</p>;
              const [before, after] = line.split(hl);
              return (
                <p key={line}>
                  {before}
                  <span style={{ backgroundImage: `linear-gradient(transparent 55%, ${marker} 55%)` }}>{hl}</span>
                  {after}
                </p>
              );
            })}
            {arrow && (
              <svg width={arrow.w} height={arrow.h} className={`mt-2 ${note.arrow === "down-left" ? "-ml-6" : "ml-6"}`} fill="none">
                <path d={arrow.d} stroke={ink} strokeWidth={3} strokeLinecap="round" />
                <path d={arrow.head} stroke={ink} strokeWidth={3} strokeLinecap="round" />
              </svg>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

// Phones don't have side margins, so one note sits in the empty space beside the title instead.
// Edit the wording here.
const MOBILE_HEADER_NOTE = ["our first year", "as a club ♡"];

function MobileHeaderNote() {
  return (
    <motion.div
      aria-hidden="true"
      className={`${caveat.className} pointer-events-none absolute right-1 top-[64px] w-[150px] rotate-[-7deg] text-right text-[22px] font-bold leading-[1.15] text-brand-red min-[400px]:right-4 sm:top-[96px] sm:text-[26px] md:hidden`}
      initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
      animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
      transition={{ duration: 0.7, delay: 1.4, ease: "easeOut" }}
    >
      {MOBILE_HEADER_NOTE.map((line) => (
        <p key={line}>{line}</p>
      ))}
      {/* little hand-drawn squiggle and stars */}
      <svg width="120" height="26" viewBox="0 0 120 26" fill="none" className="ml-auto mt-0.5">
        <path d="M6,14 C24,4 38,22 56,12 C72,4 86,20 104,10" stroke="#8a1c24" strokeWidth={2.5} strokeLinecap="round" />
      </svg>
      <span className="mr-6 block text-lg text-[#c9a0a6]">&#10038; &#9734;</span>
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

  // On phones the details sit below the timeline, so bring them into view after picking an event
  const detailRef = useRef<HTMLDivElement>(null);
  const selectOnPhone = (id: string) => {
    setSelectedId(id);
    setTimeout(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
  };

  const chooseYear = (y: number) => {
    setYear(y);
    setSelectedId(datedEvents.find((e) => e.date.getFullYear() === y)?.event.id ?? null);
  };

  return (
    // Skip transform animations for visitors who have "reduce motion" turned on
    <MotionConfig reducedMotion="user">
      <section className="relative w-full overflow-x-clip pb-20 sm:pb-28">
        <MarginNotes />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          {/* Masthead: the title, a highlighter in the ruler's term colours, and polaroids of recent events */}
          <header className="relative flex flex-col gap-6 pt-10 sm:gap-8 sm:pt-20 md:flex-row md:items-end md:justify-between">
            <MobileHeaderNote />
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }}>
              <p className="mb-4 font-mono text-xs font-bold uppercase tracking-[0.24em] text-brand-red">UONotes / Events</p>
              <h1 className="font-logo font-black text-gray-900 tracking-tighter leading-[0.85] text-[4.5rem] sm:text-[7rem] lg:text-[8rem]">
                Past{" "}
                <span className="relative isolate inline-block text-brand-red">
                  {/* Highlighter swipe: Winter blue → Summer pink → Fall green, like the ruler */}
                  <motion.span
                    aria-hidden="true"
                    className="absolute -inset-x-[0.06em] bottom-[0.08em] -z-10 h-[0.42em] origin-left -rotate-1 rounded-[0.08em]"
                    style={{ backgroundImage: `linear-gradient(90deg, ${TERMS[0].marker} 0 33%, ${TERMS[1].marker} 33% 66%, ${TERMS[2].marker} 66%)` }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 0.55, ease: [0.65, 0, 0.35, 1] }}
                  />
                  events
                </span>
              </h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.2 }}
                className="mt-5 max-w-md text-base leading-relaxed text-brand-body sm:text-lg"
              >
                What we&apos;ve been up to. Pick an event on the ruler, then tap any photo to see it up close.
              </motion.p>
            </motion.div>

            <TossedPolaroids items={datedEvents.slice(0, 3)} />
          </header>

          {datedEvents.length === 0 ? (
            <p className="py-20 text-brand-body">No past events yet. Check back soon.</p>
          ) : (
            <>
              {/* Year switcher, only when there's more than one year */}
              {years.length > 1 && (
                <div className="mt-10 flex flex-wrap gap-2" role="tablist" aria-label="School year">
                  {years.map((y) => (
                    <button
                      key={y}
                      type="button"
                      role="tab"
                      aria-selected={y === year}
                      onClick={() => chooseYear(y)}
                      className={`${caveat.className} rounded-full px-4 py-1 text-xl font-bold transition-colors ${
                        y === year ? "bg-brand-red text-white" : "text-[#1f2a44] hover:bg-white/70"
                      }`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              )}

              {/* Tablets and up: the ruler across the page */}
              <div className="mt-10 hidden sm:mt-12 md:block">
                <SchoolYearRuler year={year} items={itemsThisYear} selectedId={selected?.event.id ?? null} onSelect={setSelectedId} />
              </div>

              {/* Phones: the ruler stands upright down the page */}
              <div className="mt-10 md:hidden">
                <MobileTimeline year={year} items={itemsThisYear} selectedId={selected?.event.id ?? null} onSelect={selectOnPhone} />
              </div>

              <div ref={detailRef} className="mt-12 scroll-mt-6 sm:mt-14">
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
        </div>

        <PhotoLightbox state={lightbox} onClose={closeLightbox} onChange={changeLightbox} />
      </section>
    </MotionConfig>
  );
}