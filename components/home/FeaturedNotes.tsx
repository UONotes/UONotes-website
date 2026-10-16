"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { motion, Variants } from "framer-motion";
import { Caveat } from "next/font/google";
import { ArrowRight } from "lucide-react";
import { FeaturedNotesScraps } from "./SideScraps";
import { PdfThumbnail } from "@/components/notes/PdfThumbnail";

const caveat = Caveat({ subsets: ["latin"], weight: ["500", "700"] });

export interface FeaturedNote {
  id: string;
  title: string;
  courseCode: string;
  fileUrl?: string;
}

interface FeaturedNotesProps {
  notes: FeaturedNote[];
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

// Each handout drops onto the pile one after another, landing at its own angle
const handout: Variants = {
  hidden: { opacity: 0, y: -80, rotate: 0 },
  visible: (tilt: number) => ({ opacity: 1, y: 0, rotate: tilt, transition: { type: "spring", stiffness: 140, damping: 16 } }),
};

const pile: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
};

// Fan angles: spread evenly from left to right, at most 9° either side
function fanTilt(i: number, count: number) {
  if (count === 1) return 0;
  return -9 + (18 * i) / (count - 1);
}

// Decorative "text lines" on each handout
const LINE_WIDTHS = [92, 76, 86, 60, 82, 70, 90, 52];

// Grey "text lines" shown while a PDF preview loads (or when there's no PDF)
function TextLines() {
  return (
    <div aria-hidden="true" className="space-y-2.5 p-3">
      {LINE_WIDTHS.slice(0, 6).map((w, k) => (
        <div key={k} className="h-1.5 rounded bg-[#e9e3e3] sm:h-2" style={{ width: `${w}%` }} />
      ))}
    </div>
  );
}

// Same page the note cards in the library open
const noteHref = (note: FeaturedNote) => `/notes/view/${note.id}`;

// True on large screens, where the handouts fan out (smaller screens get gentler tilts)
function useIsLarge() {
  const [large, setLarge] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setLarge(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return large;
}

export function FeaturedNotes({ notes }: FeaturedNotesProps) {
  const isLarge = useIsLarge();
  if (!notes || notes.length === 0) return null;

  const viewAll = (
    <Link
      href="/notes"
      className="group relative inline-flex items-center justify-center gap-2 rounded-xl bg-brand-red px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-red/20 transition-all hover:-translate-y-0.5 hover:shadow-brand-red/30 active:scale-[0.98] sm:rounded-2xl sm:py-4 sm:text-base"
    >
      View All Notes
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
    </Link>
  );

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      className="relative z-10 mx-auto max-w-7xl px-4 py-10 sm:px-8 md:py-16 lg:px-12"
    >
      <FeaturedNotesScraps />

      {/* Wide screens: handouts on the left, heading on the right (the mirror of the Community section above).
          Smaller screens: heading on top, then the handouts (a fan on laptops, a grid on phones), then the button. */}
      <div className="grid items-center gap-8 md:gap-10 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] xl:gap-14">
        <motion.div variants={fadeUp} className="flex flex-col items-center text-center xl:order-2 xl:items-start xl:text-left">
          <p className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-brand-red">From the library</p>
          <h2 className="mb-4 font-sans text-3xl font-black tracking-tighter text-gray-900 md:text-5xl xl:text-[3.5rem] xl:leading-[1.02]">
            Featured <span className="text-brand-red">Notes</span>
          </h2>
          <p className="max-w-xl text-base font-medium leading-relaxed text-gray-500 md:text-lg xl:max-w-md">
            Explore top-rated study guides, cheat sheets, and summaries shared by students across faculties.
          </p>
          <div className="mt-8 hidden items-center gap-4 xl:flex">
            {viewAll}
            <span className={`${caveat.className} -rotate-3 whitespace-nowrap text-2xl font-bold text-brand-red`}>&larr; hand-picked by our team</span>
          </div>
        </motion.div>

        {/* A fan of handouts on big screens; a neat two-column pile on smaller ones */}
        <motion.div
          variants={pile}
          className="mx-auto grid w-full max-w-md grid-cols-2 gap-4 text-left sm:max-w-2xl sm:gap-6 xl:order-1 lg:flex lg:max-w-none lg:justify-center lg:gap-0 lg:pt-4"
        >
          {notes.map((note, i) => {
            const tilt = isLarge ? fanTilt(i, notes.length) : i % 2 === 0 ? -1.5 : 1.5;
            const isPdf = !!note.fileUrl;
            return (
              <motion.div
                key={note.id}
                custom={tilt}
                variants={handout}
                whileHover={{ rotate: 0, y: -14, scale: 1.04, zIndex: 20 }}
                className="relative lg:-mx-2.5 lg:mt-[var(--fan-drop)]"
                style={{ zIndex: i + 1, "--fan-drop": `${Math.abs(tilt) * 1.6}px` } as CSSProperties}
              >
                <Link
                  href={noteHref(note)}
                  className="group relative block h-[240px] bg-white p-4 shadow-[0_18px_30px_-16px_rgba(0,0,0,0.4)] transition-shadow hover:shadow-[0_26px_40px_-18px_rgba(138,28,36,0.45)] sm:h-[285px] sm:p-5 lg:h-[290px] lg:w-[180px] lg:p-4 xl:w-[165px] 2xl:w-[190px]"
                >
                  {/* Folded top corner */}
                  <span
                    aria-hidden="true"
                    className="absolute right-0 top-0 h-8 w-8"
                    style={{ backgroundImage: "linear-gradient(225deg, #fbf1f1 50%, #e9dede 50%)" }}
                  />
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-brand-red">{note.courseCode}</p>
                  <h3 className="mt-1.5 line-clamp-2 pr-4 font-sans text-[15px] font-black leading-tight tracking-tight text-gray-900 sm:text-lg lg:text-[15px]">
                    {note.title}
                  </h3>
                  {/* First page of the PDF (same preview as the notes library); grey "text lines" while it loads or if there's no PDF */}
                  <div className="relative mt-3 h-[105px] overflow-hidden border border-[#eee6e6] bg-[#fdfafb] sm:h-[135px] lg:h-[140px]">
                    {isPdf ? (
                      <PdfThumbnail
                        fileUrl={note.fileUrl!}
                        className="h-full w-full transition-transform duration-500 group-hover:scale-105"
                        fallback={<TextLines />}
                      />
                    ) : (
                      <TextLines />
                    )}
                  </div>
                  <span className={`${caveat.className} absolute bottom-3 left-4 text-lg font-bold text-brand-red transition-transform group-hover:translate-x-1 sm:bottom-4 sm:left-5 sm:text-xl lg:left-4`}>
                    view note &rarr;
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Button under the pile on smaller screens (on wide screens it sits next to the heading) */}
      <motion.div variants={fadeUp} className="mt-10 flex justify-center xl:hidden">
        {viewAll}
      </motion.div>
    </motion.section>
  );
}