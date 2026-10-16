"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Caveat } from "next/font/google";

// Tiny red handwritten "margin notes" beside each homepage section, alternating sides
// (How it works: left · Community: right · Featured notes: left). The lined paper and red margin line
// itself now comes from the page background in globals.css. Decorative, and hidden below 1700px.
// Edit the wording of the notes at the bottom of this file.

const caveat = Caveat({ subsets: ["latin"], weight: ["500", "700"] });

// ─── Settings ────────────────────────────────────────────────────────────────
// Matches --margin-x in globals.css on very wide screens: the notes sit in the strip left/right of the red margin line
const MARGIN_X = 150;

// ─── A tiny handwritten note in the margin ───────────────────────────────────

type NoteProps = {
  side: "left" | "right";
  top: number; // px from the top of the section
  tilt: number;
  children: ReactNode;
};

function MarginNote({ side, top, tilt, children }: NoteProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 z-0 hidden min-[1700px]:block"
      // Spans the full screen width (the right side leaves room for a desktop scrollbar)
      style={{ left: "calc(50% - 50vw)", right: "calc(50% - 50vw + 16px)" }}
    >
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`${caveat.className} absolute text-[22px] font-bold leading-[1.1] text-brand-red`}
        // Sits in the strip between the screen edge and the red margin line
        style={{ top, [side]: 20, width: MARGIN_X - 30, rotate: `${tilt}deg`, textAlign: side }}
      >
        {children}
      </motion.p>
    </div>
  );
}

// ─── The margin note for each section (edit the wording here) ────────────────

export function HowItWorksScraps() {
  return (
    <MarginNote side="left" top={120} tilt={-4}>
      &#9733; important!
    </MarginNote>
  );
}

export function CommunityScraps() {
  return (
    <MarginNote side="right" top={160} tilt={3}>
      &larr; say hi!
    </MarginNote>
  );
}

export function FeaturedNotesScraps() {
  return (
    <MarginNote side="left" top={130} tilt={-3}>
      exam season essentials &#10003;
    </MarginNote>
  );
}