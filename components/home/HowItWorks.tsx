"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, Variants } from "framer-motion";
import { Caveat } from "next/font/google";
import { UploadCloud, FileSearch, Award } from "lucide-react";
import { HowItWorksScraps } from "./SideScraps";

const caveat = Caveat({ subsets: ["latin"], weight: ["500", "700"] });

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

// The section itself stays visible (its tabs peek up at the bottom of the hero); only the page fades in
const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const STEP_MS = 4500; // how long each step shows before flipping to the next
const AFTER_CLICK_MS = 9000; // after someone picks a step themselves, stay on it a bit longer before carrying on

// Each step is a coloured binder divider. `tab` is the short label on its tab; `colour` is the page and tab colour.
const STEPS = [
  {
    icon: UploadCloud,
    tab: "Upload",
    title: "Upload your notes",
    desc: "Share your well-organized study materials, cheat sheets, and past exams in PDF format.",
    colour: "#f7d3d8",
  },
  {
    icon: FileSearch,
    tab: "Get reviewed",
    title: "Get reviewed by our team",
    desc: "Our team verifies the content to ensure all resources meet high academic standards.",
    colour: "#d6e4f8",
  },
  {
    icon: Award,
    tab: "Earn hours",
    title: "Earn volunteer hours",
    desc: "Get recognized for your contributions. Verified uploads count toward official volunteer hours.",
    colour: "#d4ebd8",
  },
];

// Colour of the page background, used for the binder's punched holes
const HOLE_COLOUR = "#FFF0F0";

// ─── The pen-sketch illustration for each step ───────────────────────────────
const PEN = "#1f2a44";
const RED = "#8a1c24";

// A red-pen stroke that draws itself in
function PenStroke({ d, delay, width = 2.6 }: { d: string; delay: number; width?: number }) {
  return (
    <motion.path
      d={d}
      fill="none"
      stroke={RED}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ pathLength: { duration: 0.45, delay, ease: "easeOut" }, opacity: { duration: 0.01, delay } }}
    />
  );
}

// Step 1: a page of notes drops into a folder
function FolderSketch() {
  return (
    <svg viewBox="0 0 240 170" className="h-full w-auto" fill="none" stroke={PEN} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round">
      {/* back of the folder + tab */}
      <path d="M26 48 Q26 40 34 40 H86 Q92 40 96 46 L100 52 H206 Q214 52 214 60 V150 H26 Z" fill="#e6c992" />
      {/* the page sliding in */}
      <motion.g initial={{ y: -80, rotate: -6, opacity: 0 }} animate={{ y: 0, rotate: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 110, damping: 13, delay: 0.25 }}>
        <path d="M58 22 H164 L182 40 V132 H58 Z" fill="#fff" />
        <path d="M164 22 V40 H182" />
        <text x="70" y="44" fill={RED} stroke="none" fontFamily="monospace" fontWeight="700" fontSize="11" letterSpacing="1.5">PDF</text>
        {[58, 70, 82, 94].map((y, i) => (
          <path key={y} d={`M70 ${y} H${[158, 142, 164, 130][i]}`} stroke="#d8d2d2" strokeWidth={3} />
        ))}
      </motion.g>
      {/* front of the folder */}
      <path d="M18 84 H222 L212 156 H28 Z" fill="#efd6a6" />
      <text x="120" y="130" textAnchor="middle" className={caveat.className} fill={PEN} stroke="none" fontSize="24" fontWeight="700">
        my notes
      </text>
    </svg>
  );
}

// Step 2: a page gets checked over in red pen
function ReviewSketch() {
  const rows = [30, 50, 70, 90, 110];
  return (
    <svg viewBox="0 0 240 170" className="h-full w-auto" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <g transform="rotate(-2 120 85)">
        <rect x="44" y="10" width="140" height="150" fill="#fff" stroke={PEN} strokeWidth={2} />
        <path d="M58 22 H132" stroke={PEN} strokeWidth={5} />
        {rows.map((y, i) => (
          <path key={y} d={`M58 ${y + 12} H${[160, 146, 166, 138, 154][i]}`} stroke="#d8d2d2" strokeWidth={3} />
        ))}
      </g>
      {/* red-pen ticks down the margin, one after another */}
      {rows.slice(0, 4).map((y, i) => (
        <PenStroke key={y} d={`M196 ${y + 10} l5 6 l10 -13`} delay={0.3 + i * 0.25} />
      ))}
      {/* circles a line and writes a comment */}
      <PenStroke d="M52 103 C 60 92, 150 92, 160 101 C 168 110, 70 116, 54 108" delay={1.35} width={2} />
      <motion.text
        x="92"
        y="150"
        className={caveat.className}
        fill={RED}
        fontSize="24"
        fontWeight="700"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 1.8 }}
        transform="rotate(-5 92 150)"
      >
        looks good!
      </motion.text>
    </svg>
  );
}

// Step 3: hours get logged on a sign-off sheet
function HoursSketch() {
  const entries = [
    ["notes upload", "2h"],
    ["study guide", "1h"],
  ];
  return (
    <div className="relative w-56 -rotate-1 border-2 border-[#1f2a44] bg-[#fffdf8] px-4 pb-4 pt-3 shadow-[5px_5px_0_rgba(31,42,68,0.1)]">
      <p className="border-b-2 border-[#e39aa1] pb-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-brand-red">Volunteer hours log</p>
      {entries.map(([what, hrs], i) => (
        <motion.p
          key={what}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, delay: 0.3 + i * 0.35 }}
          className={`${caveat.className} flex justify-between border-b border-[#dfe6ee] pt-1.5 text-xl font-bold text-[#1f2a44]`}
        >
          <span>{what}</span>
          <span>{hrs}</span>
        </motion.p>
      ))}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 1.1 }}
        className={`${caveat.className} relative flex justify-between pt-1.5 text-xl font-bold text-brand-red`}
      >
        <span>total</span>
        <span className="relative pr-1">
          3h
          <svg viewBox="0 0 60 36" className="absolute -right-3 -top-1.5 h-9 w-12 overflow-visible" fill="none">
            <PenStroke d="M8 18 C 8 4, 52 2, 54 16 C 56 30, 14 34, 6 22" delay={1.3} width={2} />
          </svg>
        </span>
      </motion.div>
    </div>
  );
}

function StepVisual({ step }: { step: number }) {
  return (
    <div className="flex h-44 items-center justify-center sm:h-48">
      {step === 0 ? <FolderSketch /> : step === 1 ? <ReviewSketch /> : <HoursSketch />}
    </div>
  );
}

export function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);
  // How far through the current step we are (0 → 1). Fills the progress dash; at 1 we flip to the next step.
  const [progress, setProgress] = useState(0);
  const binderRef = useRef<HTMLDivElement>(null);
  // How long the current step stays up (longer right after someone clicks a tab)
  const delayRef = useRef(STEP_MS);

  // A simple clock that ticks every 100ms and only counts while the binder is actually on screen.
  // (Checked directly each tick rather than with a scroll observer, so it can't get stuck after scrolling.)
  useEffect(() => {
    const TICK = 100;
    const id = window.setInterval(() => {
      const el = binderRef.current;
      if (!el || document.hidden) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // "On screen" = at least a third of the viewport height's worth of it is showing (or all of it, if it's short)
      const visible = Math.min(r.bottom, vh) - Math.max(r.top, 0);
      if (visible < Math.min(r.height, vh) / 3) return;

      setProgress((p) => {
        const next = p + TICK / delayRef.current;
        if (next < 1) return next;
        delayRef.current = STEP_MS;
        setActiveStep((s) => (s + 1) % STEPS.length);
        return 0;
      });
    }, TICK);
    return () => window.clearInterval(id);
  }, []);

  // Someone picked a step themselves: show it, and give them a little longer to read it
  const pickStep = (i: number) => {
    delayRef.current = AFTER_CLICK_MS;
    setProgress(0);
    setActiveStep(i);
  };

  const step = STEPS[activeStep];
  const Icon = step.icon;
  const isLast = activeStep === STEPS.length - 1;

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={staggerContainer}
      id="how-it-works"
      // On laptops the tabs overlap the bottom of the full-screen hero, so they peek up before you scroll
      className="relative z-10 scroll-mt-20 pt-6 pb-14 md:pb-20 lg:-mt-14 lg:pt-0"
    >
      <HowItWorksScraps />
      <div
        ref={binderRef}
        className="relative mx-auto max-w-6xl px-4 sm:px-6"
      >
        {/* Divider tabs (always visible, so they show at the bottom of the hero) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 120, damping: 16, delay: 1.2 }}
          className="relative flex flex-col items-start lg:items-center"
        >
          <div className="relative w-full sm:ml-10 sm:w-auto lg:ml-0">
            <p className={`${caveat.className} mb-2 ml-1 -rotate-3 text-2xl font-bold text-brand-red lg:absolute lg:bottom-3 lg:right-full lg:mb-0 lg:ml-0 lg:mr-4 lg:whitespace-nowrap`}>
              how it works{" "}
              <motion.span
                aria-hidden="true"
                className="inline-block"
                animate={{ y: [0, 4, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              >
                &darr;
              </motion.span>
            </p>
            <div role="tablist" aria-label="How UONotes works" className="flex w-full items-end gap-1.5 sm:w-auto sm:gap-2">
            {STEPS.map((s, i) => {
              const active = i === activeStep;
              return (
                <button
                  key={s.title}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-controls="how-panel"
                  onClick={() => pickStep(i)}
                  className={`flex flex-1 items-baseline justify-center gap-1.5 rounded-t-xl px-2 pb-3 pt-3 shadow-[0_-4px_10px_-6px_rgba(0,0,0,0.25)] transition-all duration-300 sm:flex-none sm:gap-2 sm:px-6 ${
                    active ? "translate-y-0" : "translate-y-2 opacity-85 hover:translate-y-1 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: s.colour }}
                >
                  <span className="hidden font-mono text-[11px] font-bold tracking-[0.15em] text-brand-red sm:inline">0{i + 1}</span>
                  <span className="whitespace-nowrap text-[13px] font-bold text-[#1f2a44] sm:text-[15px]">{s.tab}</span>
                </button>
              );
            })}
            </div>
          </div>
        </motion.div>

        {/* The page for the chosen tab */}
        <motion.div
          variants={fadeUp}
          id="how-panel"
          role="tabpanel"
          className="relative overflow-hidden rounded-b-3xl rounded-t-xl shadow-[0_24px_40px_-24px_rgba(0,0,0,0.35)] transition-colors duration-500 sm:rounded-3xl"
          style={{ backgroundColor: step.colour }}
        >
          {/* Punched binder holes down the left edge */}
          <div aria-hidden="true" className="absolute inset-y-10 left-5 hidden flex-col justify-around sm:flex">
            {[0, 1, 2].map((k) => (
              <span key={k} className="h-[18px] w-[18px] rounded-full shadow-[inset_0_2px_3px_rgba(0,0,0,0.2)]" style={{ backgroundColor: HOLE_COLOUR }} />
            ))}
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="grid items-center gap-8 px-5 pb-8 pt-7 sm:pl-20 sm:pr-10 sm:pt-12 lg:min-h-[330px] lg:grid-cols-[1.1fr_1fr] lg:gap-12"
            >
              <div>
                <h2 className="flex items-start gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-brand-red sm:text-[11px]">
                  <Icon className="h-4 w-4" />
                  How UONotes works · Step {activeStep + 1} of {STEPS.length}
                </h2>
                <div className="mt-3 flex items-baseline gap-3 sm:gap-4">
                  <span
                    aria-hidden="true"
                    className="font-logo text-5xl font-black leading-none text-transparent sm:text-8xl"
                    style={{ WebkitTextStroke: "2px #8a1c24" }}
                  >
                    0{activeStep + 1}
                  </span>
                  <h3 className="font-logo text-[1.6rem] font-black leading-[1.05] tracking-tight text-gray-900 sm:text-[2.6rem]">{step.title}</h3>
                </div>
                <p className="mt-4 max-w-md text-base leading-relaxed text-gray-600 sm:text-lg">{step.desc}</p>

                {/* Progress dashes (the current one fills up until the next flip) + next step */}
                <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
                  <div className="flex gap-2">
                    {STEPS.map((s, i) => (
                      <button
                        key={s.title}
                        type="button"
                        aria-label={`Show step ${i + 1}`}
                        onClick={() => pickStep(i)}
                        className="relative h-1.5 overflow-hidden rounded-full bg-brand-red/15 transition-all"
                        style={{ width: i === activeStep ? 56 : 22 }}
                      >
                        {i === activeStep && (
                          <span
                            className="absolute inset-y-0 left-0 bg-brand-red transition-[width] duration-100 ease-linear"
                            style={{ width: `${Math.min(progress, 1) * 100}%` }}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                  {isLast ? (
                    <Link
                      href="/submit"
                      className={`${caveat.className} text-2xl font-bold text-brand-red transition-transform hover:translate-x-1`}
                    >
                      ready? share your notes &rarr;
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => pickStep(activeStep + 1)}
                      className={`${caveat.className} text-2xl font-bold text-brand-red transition-transform hover:translate-x-1`}
                    >
                      next: {STEPS[activeStep + 1].tab.toLowerCase()} &rarr;
                    </button>
                  )}
                </div>
              </div>

              {/* Taped illustration */}
              <div className="relative rotate-[1.5deg] bg-white p-4 shadow-[0_18px_26px_-16px_rgba(0,0,0,0.35)] sm:p-5">
                <span aria-hidden="true" className="absolute -top-3 left-1/2 h-6 w-20 -translate-x-1/2 -rotate-3 bg-brand-red/20" />
                <StepVisual step={activeStep} />
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.section>
  );
}