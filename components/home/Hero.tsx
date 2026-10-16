"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, Variants } from "framer-motion";
import { Caveat } from "next/font/google";
import { Search, UploadCloud, ArrowRight } from "lucide-react";

// Handwriting font for the notes and index cards
const caveat = Caveat({ subsets: ["latin"], weight: ["500", "700"] });

// ─── Decoration settings ─────────────────────────────────────────────────────
// The index cards (left) and polaroid (right) sit in the empty space either side of the title
// on wide screens. Edit their text / photo here.
const INDEX_CARDS = [
  { label: "Cheat sheets", sub: "key terms · formulas" },
  { label: "Study guides", sub: "chapter by chapter" },
  { label: "Past exams", sub: "practice makes perfect" },
];
const HERO_POLAROID = { src: "/about/group-photo.png", caption: "the UONotes team" };

// ─────────────────────────────────────────────────────────────────────────────

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

const wordAnim: Variants = {
  hidden: { opacity: 0, y: 15, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

const fadeUpAnim: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};


function IndexCardStack() {
  const tilts = [5, -4, 2];
  const offsets = [16, 0, 26];
  return (
    <div className="relative h-[330px] w-[230px]">
      {INDEX_CARDS.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, x: -40, rotate: tilts[i] * 2 }}
          animate={{ opacity: 1, x: 0, rotate: tilts[i] }}
          transition={{ type: "spring", stiffness: 140, damping: 16, delay: 0.9 + i * 0.15 }}
          className="absolute h-[130px] w-[210px] bg-white px-3.5 shadow-[0_16px_26px_-14px_rgba(0,0,0,0.35)]"
          style={{
            left: offsets[i],
            top: i * 100,
            backgroundImage: "repeating-linear-gradient(transparent 0 21px, #cfe0ef 21px 22px)",
            backgroundPosition: "0 40px",
          }}
        >
          <div className="flex h-10 items-end border-b-2 border-[#e39aa1] pb-1.5">
            <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-brand-red">0{i + 1}</span>
          </div>
          <p className={`${caveat.className} pt-0.5 text-[22px] font-bold leading-[22px] text-[#1f2a44]`}>{card.label}</p>
          <p className={`${caveat.className} text-lg leading-[22px] text-[#6b7386]`}>{card.sub}</p>
        </motion.div>
      ))}
    </div>
  );
}

function HeroPolaroid() {
  return (
    <div className="relative w-[210px]">
      <motion.div
        initial={{ opacity: 0, y: -60, rotate: 20 }}
        animate={{ opacity: 1, y: 0, rotate: 6 }}
        transition={{ type: "spring", stiffness: 150, damping: 14, delay: 1.1 }}
        className="relative bg-white p-2 pb-9 shadow-[0_16px_28px_-14px_rgba(0,0,0,0.45)]"
      >
        <span aria-hidden="true" className="absolute -top-3 left-1/2 z-10 h-6 w-20 -translate-x-1/2 -rotate-3 bg-brand-red/20" />
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-200">
          <Image src={HERO_POLAROID.src} alt="" fill sizes="210px" className="object-cover" />
        </div>
        <span className="absolute bottom-3 left-3 text-sm font-bold text-[#1f2a44]">{HERO_POLAROID.caption}</span>
      </motion.div>
    </div>
  );
}

export function Hero() {
  const line1 = "Notes made by students,".split(" ");
  const line2 = "for students.".split(" ");

  return (
    <section className="relative w-full flex flex-col items-center justify-center overflow-hidden pt-10 pb-12 sm:pt-14 sm:pb-16 lg:min-h-[max(640px,calc(100svh-80px))] lg:pt-12 lg:pb-28">
      {/* Side decorations: only on wide screens, so the title always stays centred */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden xl:block">
        <div className="absolute top-1/2 -translate-y-[35%]" style={{ left: "max(1.5rem, calc(50% - 640px))" }}>
          <IndexCardStack />
        </div>
        <div className="absolute top-1/2 -translate-y-[40%]" style={{ right: "max(1.5rem, calc(50% - 630px))" }}>
          <HeroPolaroid />
        </div>
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="flex flex-col items-center text-center px-4 sm:px-6 max-w-5xl mx-auto relative z-10 w-full"
      >
        {/* "Follow along" label taped to the page, with the two socials as little stickers */}
        <motion.div variants={fadeUpAnim} className="mb-7 sm:mb-9">
          <div className="relative inline-flex -rotate-1 items-center gap-1.5 bg-white py-1.5 pl-3 pr-1.5 shadow-[0_8px_16px_-8px_rgba(0,0,0,0.3)] sm:gap-3 sm:pl-5">
            <span aria-hidden="true" className="absolute -top-2.5 left-1/2 h-5 w-16 -translate-x-1/2 rotate-2 bg-brand-red/20" />
            <span className={`${caveat.className} whitespace-nowrap text-base font-bold leading-none text-brand-red sm:text-xl`}>follow along<span className="hidden min-[400px]:inline"> &rarr;</span></span>
            <a
              href="https://instagram.com/uonotes"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="UONotes on Instagram"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#fde7ea] px-2.5 py-1.5 text-[11px] sm:px-3 font-bold text-gray-800 transition-all hover:-translate-y-0.5 hover:-rotate-3 hover:bg-brand-red hover:text-white sm:text-xs [&_svg]:hover:text-white"
            >
              <svg className="w-3.5 h-3.5 fill-current text-brand-red transition-colors" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              @uonotes
            </a>
            <a
              href="https://www.tiktok.com/@uo_notes"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="UONotes on TikTok"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#e4eefc] px-2.5 py-1.5 text-[11px] sm:px-3 font-bold text-gray-800 transition-all hover:-translate-y-0.5 hover:rotate-3 hover:bg-brand-red hover:text-white sm:text-xs [&_svg]:hover:text-white"
            >
              <svg className="w-3.5 h-3.5 fill-current text-brand-red transition-colors" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
              @uo_notes
            </a>
            <a
              href="https://www.linkedin.com/company/uonotes/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="UONotes on LinkedIn"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#dff0e1] px-2.5 py-1.5 text-[11px] sm:px-3 font-bold text-gray-800 transition-all hover:-translate-y-0.5 hover:-rotate-3 hover:bg-brand-red hover:text-white sm:text-xs [&_svg]:hover:text-white"
            >
              <svg className="w-3.5 h-3.5 fill-current text-brand-red transition-colors" viewBox="0 0 24 24"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"/></svg>
              {/* Icon only on small phones so all three stickers fit on one line */}
              <span className="hidden sm:inline">UONotes</span>
            </a>
          </div>
        </motion.div>

        {/* Heading */}
        <h1 className="text-[2.5rem] leading-[1.05] sm:text-6xl md:text-7xl lg:text-[5rem] font-black font-logo text-gray-900 mb-6 tracking-tighter w-full max-w-4xl flex flex-wrap justify-center gap-x-2 sm:gap-x-3 lg:gap-x-4">
          {line1.map((word, i) => (
            <motion.span key={i} variants={wordAnim} className="inline-block">
              {word}
            </motion.span>
          ))}
          <span className="flex w-full justify-center">
            <span className="relative isolate flex flex-wrap justify-center gap-x-2 sm:gap-x-3 lg:gap-x-4">
              {line2.map((word, i) => (
                <motion.span key={i} variants={wordAnim} className="inline-block text-brand-red">
                  {word}
                </motion.span>
              ))}
            </span>
          </span>
        </h1>

        <motion.p variants={fadeUpAnim} className="text-[15px] sm:text-lg md:text-xl text-gray-500 font-medium max-w-2xl leading-relaxed mb-8 sm:mb-10 px-2 sm:px-0 tracking-tight">
          A student-driven platform making academic resources, cheat sheets, and study guides instantly accessible for the University of Ottawa.
        </motion.p>

        {/* Action Center */}
        <motion.div variants={fadeUpAnim} className="flex flex-col items-center w-full max-w-lg mx-auto">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 sm:gap-5 w-full px-2 sm:px-0">
            {/* Red card taped to the page */}
            <Link
              href="/notes"
              className="group relative flex items-center justify-center gap-2 w-full sm:w-auto px-7 py-3.5 sm:py-4 bg-brand-red text-white font-bold rounded-[4px] -rotate-1 shadow-[0_12px_18px_-10px_rgba(138,28,36,0.7)] transition-all hover:rotate-0 hover:-translate-y-0.5 hover:bg-brand-red-hover active:scale-[0.98] text-sm sm:text-base"
            >
              <span aria-hidden="true" className="absolute -top-2.5 left-[42%] h-[18px] w-14 rotate-[4deg] bg-white/45" />
              <Search className="w-4 h-4 sm:w-5 sm:h-5" />
              Explore Database
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            {/* Lined index card taped to the page */}
            <Link
              href="/submit"
              className="group relative flex items-center justify-center gap-2 w-full sm:w-auto px-8 sm:px-9 py-3.5 sm:py-4 bg-white text-[#1f2a44] font-bold border-t-[3px] border-[#e39aa1] rotate-1 shadow-[0_12px_18px_-10px_rgba(0,0,0,0.3)] transition-all hover:rotate-0 hover:-translate-y-0.5 active:scale-[0.98] text-sm sm:text-base"
              style={{ backgroundImage: "repeating-linear-gradient(transparent 0 15px, #dfe6ee 15px 16px)" }}
            >
              <span aria-hidden="true" className="absolute -top-3 left-[35%] h-[18px] w-14 -rotate-[5deg] bg-brand-red/20" />
              <UploadCloud className="w-4 h-4 sm:w-5 sm:h-5 text-brand-red" />
              Share Notes
            </Link>
          </div>

          {/* Dashboard link, in red */}
          <Link
            href="/dashboard"
            className="group mt-5 inline-flex items-center gap-1.5 border-b-2 border-brand-red/30 pb-0.5 text-sm font-bold leading-tight text-brand-red transition-colors hover:border-brand-red sm:text-base"
          >
            or go to your dashboard
            <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">&rarr;</span>
          </Link>

          {/* Social proof */}
          <div className="flex items-center gap-3 mt-7 sm:mt-8">
            <div className="flex -space-x-2">
              <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border-2 border-white shadow-xs bg-gray-100">
                <Image src="/about/Aanreen-Headshot.png" alt="Aanreen" fill className="object-cover" />
              </div>
              <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border-2 border-white shadow-xs bg-gray-100">
                <Image src="/about/Abigail-Headshot.png" alt="Abigail" fill className="object-cover" />
              </div>
              <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border-2 border-white shadow-xs bg-gray-100">
                <Image src="/about/Ahmed-Headshot.png" alt="Ahmed" fill className="object-cover" />
              </div>
            </div>
            <p className="text-sm font-bold text-[#1f2a44] sm:text-base">
              join{" "}
              <span className="text-brand-red">
                2,500+
              </span>{" "}
              uOttawa students
            </p>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}