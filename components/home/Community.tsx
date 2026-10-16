"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useInView, animate, Variants } from "framer-motion";
import { Caveat } from "next/font/google";
import { ArrowRight } from "lucide-react";
import { CommunityScraps } from "./SideScraps";

const caveat = Caveat({ subsets: ["latin"], weight: ["500", "700"] });

// ─── Settings ────────────────────────────────────────────────────────────────
// One sticker per uOttawa faculty (colours cycle through the site's term colours)
const FACULTIES = [
  "Arts",
  "Education",
  "Engineering",
  "Health Sciences",
  "Law",
  "Medicine",
  "Science",
  "Social Sciences",
  "Telfer",
];
const STICKER_COLOURS = ["#f7d3d8", "#d6e4f8", "#d4ebd8", "#fff3c9", "#ecdff5"];
const STICKER_TILTS = [-4, 3, -2, 5, -3, 2, -5, 4, -1, 3];

// The numbers under the stickers
const STATS = [
  { to: 100000, suffix: "+", label: "total interactions" },
  { to: 100, suffix: "+", label: "active contributors" },
];
// ─────────────────────────────────────────────────────────────────────────────

// Counts up from 0 once `start` becomes true
function AnimatedCounter({ to, suffix = "", start }: { to: number; suffix?: string; start: boolean }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!start) return;
    const controls = animate(0, to, { duration: 2, ease: "easeOut", onUpdate: (v) => setValue(Math.round(v)) });
    return () => controls.stop();
  }, [start, to]);

  return (
    <span>
      {value.toLocaleString()}
      {suffix}
    </span>
  );
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const stickerGroup: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

// Each sticker gets slapped on at its own angle
const sticker: Variants = {
  hidden: { opacity: 0, scale: 0.6, rotate: 0 },
  visible: (tilt: number) => ({ opacity: 1, scale: 1, rotate: tilt, transition: { type: "spring", stiffness: 320, damping: 16 } }),
};

export function Community() {
  const statsRef = useRef<HTMLDivElement>(null);
  const statsInView = useInView(statsRef, { once: true, margin: "-60px" });

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={staggerContainer}
      className="relative z-10 mx-auto max-w-5xl px-4 py-12 text-center sm:px-6 sm:py-16"
    >
      <CommunityScraps />

      <motion.p variants={fadeUp} className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-brand-red">
        Join the community
      </motion.p>
      <motion.h2
        variants={fadeUp}
        className="mx-auto max-w-3xl font-logo text-3xl font-black leading-[1.1] tracking-tight text-gray-900 sm:text-4xl lg:text-5xl"
      >
        Notes from <span className="text-brand-red">every faculty</span> at uOttawa.
      </motion.h2>
      <motion.p variants={fadeUp} className="mx-auto mt-4 max-w-xl font-sans text-sm leading-relaxed text-gray-600 sm:text-base">
        Whether you need to prep for midterms or want to share your pristine lecture notes, UONotes is engineered to help everyone succeed.
      </motion.p>

      {/* Faculty stickers */}
      <motion.ul variants={stickerGroup} className="mx-auto mt-8 flex max-w-[50rem] flex-wrap justify-center gap-2.5 sm:mt-10 sm:gap-3.5">
        {FACULTIES.map((faculty, i) => (
          <motion.li
            key={faculty}
            custom={STICKER_TILTS[i % STICKER_TILTS.length]}
            variants={sticker}
            whileHover={{ rotate: 0, scale: 1.08, y: -3 }}
            className="rounded-full border-[3px] border-white px-4 py-2 font-sans text-sm font-extrabold text-[#1f2a44] shadow-[0_8px_12px_-8px_rgba(0,0,0,0.35)] sm:px-5 sm:py-2.5 sm:text-base"
            style={{ backgroundColor: STICKER_COLOURS[i % STICKER_COLOURS.length] }}
          >
            {faculty}
          </motion.li>
        ))}
      </motion.ul>

      {/* Stats */}
      <motion.div
        ref={statsRef}
        variants={fadeUp}
        className="mt-8 flex flex-col items-center justify-center gap-3 sm:mt-10 sm:flex-row sm:gap-12"
      >
        {STATS.map((stat) => (
          <p key={stat.label} className="flex items-baseline gap-2">
            <span className="font-logo text-4xl font-black tracking-tight text-gray-900 sm:text-5xl">
              <AnimatedCounter to={stat.to} suffix={stat.suffix} start={statsInView} />
            </span>
            <span className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-brand-red sm:text-sm">{stat.label}</span>
          </p>
        ))}
      </motion.div>

      {/* Buttons */}
      <motion.div variants={fadeUp} className="mt-8 flex flex-col items-center justify-center gap-3.5 sm:mt-10 sm:flex-row">
        <Link
          href="/contact"
          className="group flex w-full items-center justify-center gap-2 rounded-xl bg-brand-red px-6 py-3.5 font-mono text-xs font-bold uppercase tracking-widest text-white shadow-md transition-all hover:bg-brand-red-hover active:scale-95 sm:w-auto"
        >
          <span>Contact us</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
        <Link
          href="/about"
          className="flex w-full items-center justify-center rounded-xl border border-gray-200 bg-white/80 px-6 py-3.5 font-mono text-xs font-bold uppercase tracking-widest text-gray-800 shadow-xs backdrop-blur-md transition-all hover:border-brand-red/30 hover:bg-brand-red/5 hover:text-brand-red active:scale-95 sm:w-auto"
        >
          Meet the team
        </Link>
      </motion.div>
      <motion.p variants={fadeUp} className={`${caveat.className} mt-4 text-2xl font-bold text-brand-red`}>
        &uarr; we&apos;d love to hear from you!
      </motion.p>
    </motion.section>
  );
}