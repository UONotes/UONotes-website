"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence, animate, useMotionValue, usePresence, useReducedMotion, useTransform } from "framer-motion";
import { Caveat } from "next/font/google";
import { TEAM_DATA } from "@/lib/team-data";
import { ProfileCard } from "./ProfileCard";

// Handwriting font for the notebook-style team header
const caveat = Caveat({ subsets: ["latin"], weight: ["500", "700"] });

// Each team gets its own sticky-note colour (assigned in menu order, repeats after 9).
// sheet = pad + leadership notes, light = director notes, under1/under2 = sheets below, marker = highlighter
const TEAM_COLOURS = [
  { sheet: "#fde7ea", light: "#fff3f5", under1: "#f3c9cf", under2: "#f7d6da", marker: "rgba(244,114,138,0.45)" }, // pink
  { sheet: "#e4eefc", light: "#f2f7fe", under1: "#c5d7f2", under2: "#d4e2f7", marker: "rgba(96,150,230,0.40)" }, // blue
  { sheet: "#e3f4e6", light: "#f2faf3", under1: "#c3e3ca", under2: "#d3ecd8", marker: "rgba(92,184,112,0.42)" }, // green
  { sheet: "#fff3c9", light: "#fffae6", under1: "#f2df9c", under2: "#f8e9b3", marker: "rgba(245,200,60,0.55)" }, // yellow
  { sheet: "#efe7fb", light: "#f8f4fd", under1: "#d8c9f1", under2: "#e3d8f6", marker: "rgba(150,110,220,0.38)" }, // lavender
  { sheet: "#ffe8d9", light: "#fff4ec", under1: "#f5cbb0", under2: "#fadac5", marker: "rgba(245,140,80,0.42)" }, // peach
  { sheet: "#dff4f1", light: "#effaf8", under1: "#bfe3dd", under2: "#cfece7", marker: "rgba(60,180,165,0.40)" }, // mint
  { sheet: "#fbe3f3", light: "#fdf2fa", under1: "#efc2df", under2: "#f5d2e9", marker: "rgba(225,100,180,0.40)" }, // magenta
  { sheet: "#eef1f4", light: "#f7f9fb", under1: "#d3d9e0", under2: "#e0e5ea", marker: "rgba(120,135,155,0.40)" }, // grey-blue
];
type TeamColour = (typeof TEAM_COLOURS)[number];
const colourFor = (index: number) => TEAM_COLOURS[((index % TEAM_COLOURS.length) + TEAM_COLOURS.length) % TEAM_COLOURS.length];
const highlighter = (marker: string) => `linear-gradient(100deg, transparent 2%, ${marker} 4%, ${marker} 94%, transparent 97%)`;

// ─── Peel-off animation ──────────────────────────────────────────────────────
// The top sheet is peeled like real paper: its bottom-right corner is pulled up and to the
// left, and a fold line sweeps across the whole note. Everything past the fold flips over,
// showing the plain back of the sticky note, until the entire sheet has come off the pad.
// When the sheet is sitting still, the same maths draws the small dog-eared corner.

type Point = { x: number; y: number };

const PEEL_REST = 58; // px the corner is lifted at rest (the dog-ear)
const PEEL_DURATION = 1.2; // seconds for the fold to cross the whole sheet
const PEEL_EASE: [number, number, number, number] = [0.5, 0.05, 0.35, 1];
const PULL_STEEPNESS = 2.2; // bigger = corner is pulled more upward than leftward

// Keep the part of a polygon where side(p) >= 0 (Sutherland–Hodgman clipping against a line)
function clipPolygon(polygon: Point[], side: (p: Point) => number): Point[] {
  const out: Point[] = [];
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    const sa = side(a);
    const sb = side(b);
    if (sa >= 0) out.push(a);
    if (sa >= 0 !== sb >= 0) {
      const t = sa / (sa - sb);
      out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    }
  }
  return out;
}

function pullDirection(w: number, h: number): Point {
  const len = Math.hypot(w, PULL_STEEPNESS * h);
  return { x: -w / len, y: (-PULL_STEEPNESS * h) / len };
}

// How far the corner must travel for the fold to pass the top-left corner (sheet fully off)
function fullLift(w: number, h: number) {
  const u = pullDirection(w, h);
  return 2 * (-w * u.x - h * u.y) + 6;
}

function peelGeometry(w: number, h: number, lift: number) {
  const u = pullDirection(w, h);
  const corner = { x: w, y: h };
  const fold = { x: corner.x + (u.x * lift) / 2, y: corner.y + (u.y * lift) / 2 }; // a point on the fold line
  const side = (p: Point) => (p.x - fold.x) * u.x + (p.y - fold.y) * u.y; // > 0: still stuck to the pad
  const sheet = [{ x: 0, y: 0 }, { x: w, y: 0 }, { x: w, y: h }, { x: 0, y: h }];
  const flat = clipPolygon(sheet, side);
  const lifted = clipPolygon(sheet, (p) => -side(p));
  // The lifted part is mirrored across the fold line – that's the flipped-over back of the note
  const flap = lifted.map((p) => {
    const d = side(p);
    return { x: p.x - 2 * d * u.x, y: p.y - 2 * d * u.y };
  });
  const tip = { x: corner.x + u.x * lift, y: corner.y + u.y * lift };
  return { u, fold, flat, flap, tip };
}

const toPoints = (ps: Point[]) => ps.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
const toClipPath = (ps: Point[]) =>
  ps.length >= 3 ? `polygon(${ps.map((p) => `${p.x.toFixed(1)}px ${p.y.toFixed(1)}px`).join(", ")})` : "polygon(0 0, 0 0, 0 0)";

// One sheet of the pad. When it is removed from <AnimatePresence>, it peels itself off
// (still showing the old team's text) before unmounting, revealing the next sheet below.
function PeelingSheet({ colour, reduceMotion, children }: { colour: TeamColour; reduceMotion: boolean; children: ReactNode }) {
  const [isPresent, safeToRemove] = usePresence();
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const wrapRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const flapRef = useRef<SVGPolygonElement>(null);
  const shadeRef = useRef<SVGPolygonElement>(null);
  const flapGradRef = useRef<SVGLinearGradientElement>(null);
  const shadeGradRef = useRef<SVGLinearGradientElement>(null);
  const size = useRef({ w: 0, h: 0 });

  const lift = useMotionValue(PEEL_REST);
  const fade = useMotionValue(1);
  const flyUp = useTransform(fade, [1, 0], [0, -30]);

  // Redraw the fold for the current lift amount (runs every animation frame while peeling)
  const draw = useCallback(() => {
    const { w, h } = size.current;
    if (!w || !h || !sheetRef.current) return;
    const g = peelGeometry(w, h, Math.min(lift.get(), fullLift(w, h)));
    sheetRef.current.style.clipPath = toClipPath(g.flat);
    flapRef.current?.setAttribute("points", toPoints(g.flap));
    shadeRef.current?.setAttribute("points", toPoints(g.flat));
    const setLine = (el: SVGLinearGradientElement | null, a: Point, b: Point) => {
      el?.setAttribute("x1", String(a.x));
      el?.setAttribute("y1", String(a.y));
      el?.setAttribute("x2", String(b.x));
      el?.setAttribute("y2", String(b.y));
    };
    setLine(flapGradRef.current, g.fold, g.tip); // back of the paper: bright at the fold, darker at the tip
    setLine(shadeGradRef.current, g.fold, { x: g.fold.x + g.u.x * 46, y: g.fold.y + g.u.y * 46 }); // shadow cast next to the fold
  }, [lift]);

  // Keep the geometry in sync with the sheet's size
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      size.current = { w: el.offsetWidth, h: el.offsetHeight };
      draw();
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [draw]);

  useEffect(() => lift.on("change", draw), [lift, draw]);

  // Peel off when this sheet is being replaced
  useEffect(() => {
    if (isPresent) return;
    const { w, h } = size.current;
    if (reduceMotion || !w || !h) {
      const c = animate(fade, 0, { duration: 0.2, onComplete: () => safeToRemove?.() });
      return () => c.stop();
    }
    const peel = animate(lift, fullLift(w, h), { duration: PEEL_DURATION, ease: PEEL_EASE });
    const away = animate(fade, 0, {
      duration: PEEL_DURATION * 0.35,
      delay: PEEL_DURATION * 0.72,
      ease: "easeIn",
      onComplete: () => safeToRemove?.(),
    });
    return () => {
      peel.stop();
      away.stop();
    };
  }, [isPresent, reduceMotion, lift, fade, safeToRemove]);

  return (
    <motion.div
      ref={wrapRef}
      className="relative [grid-area:1/1]"
      style={{ opacity: fade, y: flyUp, zIndex: isPresent ? 1 : 2 }}
    >
      {/* The front of the sheet (clipped to the part still stuck down) */}
      <div
        ref={sheetRef}
        className="relative px-6 pb-8 pt-6 sm:px-8 sm:pb-9 sm:pt-7"
        style={{ backgroundColor: colour.sheet, backgroundImage: "linear-gradient(rgba(0,0,0,0.035), transparent 28px)" }}
      >
        {children}
      </div>

      {/* Fold shadow + the flipped-over back of the sheet */}
      <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
        <defs>
          <linearGradient id={`shade${id}`} ref={shadeGradRef} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#000" stopOpacity="0.2" />
            <stop offset="1" stopColor="#000" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`flap${id}`} ref={flapGradRef} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.3" stopColor={colour.sheet} />
            <stop offset="1" stopColor={colour.under1} />
          </linearGradient>
          <filter id={`lift${id}`} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="-3" dy="6" stdDeviation="6" floodOpacity="0.22" />
          </filter>
        </defs>
        <polygon ref={shadeRef} fill={`url(#shade${id})`} />
        <polygon ref={flapRef} fill={`url(#flap${id})`} filter={`url(#lift${id})`} />
      </svg>
    </motion.div>
  );
}

// Text on a sheet
function TeamSheet({
  teamName,
  description,
  teamNumber,
  teamTotal,
  memberCount,
  leadCount,
  directorCount,
  colour,
}: {
  teamName: string;
  description?: string;
  teamNumber: string;
  teamTotal: string;
  memberCount: number;
  leadCount: number;
  directorCount: number;
  colour: TeamColour;
}) {
  return (
    <>
      <div className={`${caveat.className} relative sm:pr-56`}>
        <p className="text-lg leading-8 text-[#1f2a44]/55">
          Team {teamNumber} / {teamTotal}
        </p>
        <h3 className="mt-1 text-[42px] font-bold leading-[1.1] text-[#1f2a44] sm:text-[56px]">
          <span
            className="[box-decoration-break:clone]"
            style={{ backgroundImage: `linear-gradient(transparent 62%, ${colour.marker} 62%)` }}
          >
            {teamName}
          </span>
        </h3>
        {description && (
          <p className="mt-3 max-w-xl text-[21px] font-medium leading-[1.35] text-[#2e3650] sm:text-[23px]">{description}</p>
        )}
      </div>

      {/* Member count, circled in pen */}
      <div
        className={`${caveat.className} relative ml-6 mt-7 inline-flex flex-col items-center px-8 py-3 text-center leading-[1.05] text-[#1f2a44] sm:absolute sm:right-14 sm:top-8 sm:ml-0 sm:mt-0`}
      >
        <span aria-hidden="true" className="absolute -inset-x-3 -inset-y-2 -rotate-6 rounded-[50%] border-[3px] border-brand-red/50" />
        <span className="text-[56px] font-bold leading-none text-brand-red">{memberCount}</span>
        <span className="text-xl font-bold">members</span>
        <span className="whitespace-nowrap text-[17px] font-medium">
          {leadCount} {leadCount === 1 ? "lead" : "leads"} · {directorCount} {directorCount === 1 ? "director" : "directors"}
        </span>
      </div>
    </>
  );
}

// Filter out Presidential Team and Founders from the selector tabs
const nonFounderTeams = TEAM_DATA.filter(
  (team) => team.teamName !== "Presidential Team" && team.teamName !== "Founders"
);

export function TeamSelector() {
  const [activeTeam, setActiveTeam] = useState(nonFounderTeams[0]?.teamName || "");
  const currentTeamData = nonFounderTeams.find((team) => team.teamName === activeTeam);
  const teamNumber = String(nonFounderTeams.findIndex((team) => team.teamName === activeTeam) + 1).padStart(2, "0");
  const teamTotal = String(nonFounderTeams.length).padStart(2, "0");
  const activeIndex = nonFounderTeams.findIndex((team) => team.teamName === activeTeam);
  const colour = colourFor(activeIndex);
  const reduceMotion = useReducedMotion();
  const isLeader = (role: string) => {
    const normalizedRole = role.toLowerCase();
    return normalizedRole.includes("vp") || normalizedRole.includes("vice president") || normalizedRole.includes("president");
  };
  const vps = currentTeamData?.members.filter((member) => isLeader(member.role)) || [];
  const directors = currentTeamData?.members.filter((member) => !isLeader(member.role)) || [];

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      id="teams"
      className="w-full max-w-6xl scroll-mt-20 px-4 pb-20 sm:px-6 lg:px-8"
    >
      <div className="mb-8 flex flex-col gap-4 border-b border-brand-dark/15 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-brand-red">02 / The people behind the work</p>
          <h2 className="font-sans text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">Find your people</h2>
        </div>
        <p className="max-w-md text-sm leading-relaxed text-brand-body sm:text-right">
          Browse the people translating the UONotes mission into notes, events, partnerships, and tools.
        </p>
      </div>

      <div className="grid gap-10 lg:grid-cols-[230px_1fr] lg:items-start">
        {/* Handwritten team list: the chosen team gets a pink highlighter stroke */}
        <nav aria-label="UONotes teams" className={`${caveat.className} min-w-0 lg:pr-5`}>
          <p className="mb-2 hidden font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-brand-red lg:block">Pick a team</p>
          <div className="flex gap-6 overflow-x-auto border-b border-dashed border-[#e3cfd1] pb-2 lg:flex-col lg:gap-0 lg:overflow-visible lg:border-b-0 lg:pb-0">
            {nonFounderTeams.map((team, index) => {
              const isActive = activeTeam === team.teamName;
              return (
                <button
                  key={team.teamName}
                  type="button"
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => setActiveTeam(team.teamName)}
                  className="group flex shrink-0 items-baseline gap-2.5 whitespace-nowrap text-left lg:w-full lg:border-b lg:border-dashed lg:border-[#e3cfd1] lg:py-0.5"
                >
                  <span className="font-mono text-[9px] font-bold text-[#b9a3a5]">{String(index + 1).padStart(2, "0")}</span>
                  <span
                    style={{ backgroundImage: highlighter(colourFor(index).marker) }}
                    className={`-mx-1.5 bg-no-repeat px-1.5 leading-9 transition-[background-size,color] duration-300 ${
                      isActive
                        ? "bg-[length:100%_100%] text-2xl font-bold text-[#1f2a44]"
                        : "bg-[length:0%_100%] text-[22px] font-medium text-[#4a5064] group-hover:text-brand-red"
                    }`}
                  >
                    {team.teamName.replace(" Team", "")}
                  </span>
                  {isActive && (
                    <span aria-hidden="true" className="ml-auto hidden text-2xl font-bold text-brand-red lg:inline">
                      &#10003;
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="min-h-[320px] min-w-0">
          {/* Sticky-note pad header. Switching teams peels the top sheet off to reveal the next one. */}
          {currentTeamData && (
            <div className="relative mb-12 mr-2 mt-3 [filter:drop-shadow(0_14px_14px_rgba(0,0,0,0.16))]">
              {/* Sheets underneath, peeking out */}
              <span
                aria-hidden="true"
                className="absolute inset-0 translate-x-1.5 translate-y-1.5 transition-colors duration-500"
                style={{ backgroundColor: colour.under1 }}
              />
              <span
                aria-hidden="true"
                className="absolute inset-0 translate-x-[3px] translate-y-[3px] transition-colors duration-500"
                style={{ backgroundColor: colour.under2 }}
              />

              {/* Old and new sheets sit in the same grid cell so one can peel off over the other */}
              <div className="grid">
                <AnimatePresence initial={false}>
                  <PeelingSheet key={currentTeamData.teamName} colour={colour} reduceMotion={!!reduceMotion}>
                    <TeamSheet
                      teamName={currentTeamData.teamName}
                      description={currentTeamData.description}
                      teamNumber={teamNumber}
                      teamTotal={teamTotal}
                      memberCount={currentTeamData.members.length}
                      leadCount={vps.length}
                      directorCount={directors.length}
                      colour={colour}
                    />
                  </PeelingSheet>
                </AnimatePresence>
              </div>
            </div>
          )}

        <AnimatePresence mode="wait">
          {currentTeamData && (
            <motion.div
              key={currentTeamData.teamName} 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="w-full"
            >
              <div className="space-y-12">
                {vps.length > 0 && (
                  <section>
                    <div className="mb-7 flex items-center gap-3">
                      <h4 className={`${caveat.className} text-3xl font-bold text-[#1f2a44]`}>Leadership</h4>
                      <span aria-hidden="true" className="h-0.5 flex-1" style={{ backgroundImage: `repeating-linear-gradient(90deg, ${colour.under1} 0 8px, transparent 8px 13px)` }} />
                    </div>
                    {/* VP notes in the team colour (same as the pad sheet) */}
                    <div className="grid grid-cols-2 justify-items-center gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">
                      {vps.map((member, idx) => (
                        <ProfileCard key={`${currentTeamData.teamName}-vp-${idx}`} member={member} variant="lead" index={idx} noteColour={colour.sheet} />
                      ))}
                    </div>
                  </section>
                )}
                {directors.length > 0 && (
                  <section>
                    <div className="mb-7 flex items-center gap-3">
                      <h4 className={`${caveat.className} text-3xl font-bold text-[#1f2a44]`}>Directors</h4>
                      <span aria-hidden="true" className="h-0.5 flex-1" style={{ backgroundImage: `repeating-linear-gradient(90deg, ${colour.under1} 0 8px, transparent 8px 13px)` }} />
                    </div>
                    {/* Director notes in a lighter shade of the team colour */}
                    <div className="grid grid-cols-2 justify-items-center gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">
                      {directors.map((member, idx) => (
                        <ProfileCard key={`${currentTeamData.teamName}-director-${idx}`} member={member} variant="director" index={idx + vps.length} noteColour={colour.light} />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>
    </motion.section>
  );
}