"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { Caveat } from "next/font/google";
import { SPONSORS } from "@/lib/sponsors-data";

const caveat = Caveat({ subsets: ["latin"], weight: ["500", "700"] });

// ─── Settings ────────────────────────────────────────────────────────────────
// Adds an empty "your logo here?" card at the end that links to the contact page
const SHOW_INVITE_CARD = true;
const INVITE_HREF = "/contact";
// Each card gets a slight tilt (and its tape a different angle), cycling through these
const CARD_TILTS = [-1.5, 1, -0.5, 1.5, -1, 0.5, -1.5, 1];
const TAPE_TILTS = [-4, 3, -2, 5, -3, 2, -5, 4];
// ─────────────────────────────────────────────────────────────────────────────

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const grid: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } },
};

// Each card drops onto the page at its own tilt
const card: Variants = {
  hidden: { opacity: 0, y: -24, rotate: 0 },
  visible: (tilt: number) => ({ opacity: 1, y: 0, rotate: tilt, transition: { type: "spring", stiffness: 160, damping: 16 } }),
};

function Tape({ tilt }: { tilt: number }) {
  return (
    <span
      aria-hidden="true"
      className="absolute -top-2.5 left-1/2 z-10 h-[18px] w-16 -translate-x-1/2 bg-brand-red/20"
      style={{ rotate: `${tilt}deg` }}
    />
  );
}

export function SponsorsSection() {
  // Cards per row: 2 on phones, 3 on tablets, 4 on laptops (a short last row stays centred)
  const width = "w-[calc(50%-8px)] sm:w-[calc(33.333%-16px)] lg:w-[calc(25%-21px)]";
  const cardClass =
    `${width} relative flex h-24 items-center justify-center bg-white p-4 shadow-[0_12px_18px_-12px_rgba(0,0,0,0.35)] sm:h-28 sm:p-5`;

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      className="relative z-10 mx-auto max-w-7xl border-t border-brand-red/10 px-4 py-10 sm:px-6 md:py-14"
    >
      <motion.div variants={fadeUp} className="mb-9 text-center md:mb-11">
        <p className="mb-2 text-sm font-bold uppercase tracking-wider text-brand-red">Backed By</p>
        <h2 className="flex flex-wrap items-baseline justify-center gap-x-3 font-logo text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
          Our Partners &amp; Sponsors
          <motion.span
            initial={{ opacity: 0, clipPath: "inset(-20% 100% -20% 0)" }}
            // The negative insets leave room for the slanted handwriting, so the last "!" isn't clipped
            whileInView={{ opacity: 1, clipPath: "inset(-20% -15% -20% 0)" }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className={`${caveat.className} inline-block -rotate-3 pr-1.5 text-2xl font-bold text-brand-red md:text-3xl`}
          >
            thank you!!
          </motion.span>
        </h2>
      </motion.div>

      {/* Logos on taped business cards */}
      <motion.ul
        variants={grid}
        className="mx-auto flex max-w-5xl flex-wrap justify-center gap-x-4 gap-y-7 sm:gap-x-6 sm:gap-y-8 lg:gap-x-7"
      >
        {SPONSORS.map((sponsor, i) => (
          <motion.li
            key={sponsor.name}
            custom={CARD_TILTS[i % CARD_TILTS.length]}
            variants={card}
            whileHover={{ rotate: 0, y: -4, scale: 1.03 }}
            className={cardClass}
          >
            <Tape tilt={TAPE_TILTS[i % TAPE_TILTS.length]} />
            <div className="relative h-full w-full">
              <Image src={sponsor.imageUrl} alt={sponsor.name} fill sizes="(min-width: 1024px) 220px, 45vw" className="object-contain" />
            </div>
          </motion.li>
        ))}

        {SHOW_INVITE_CARD && (
          <motion.li
            custom={CARD_TILTS[SPONSORS.length % CARD_TILTS.length]}
            variants={card}
            whileHover={{ rotate: 0, y: -4, scale: 1.03 }}
            className={`${width} relative`}
          >
            <Link
              href={INVITE_HREF}
              className="group flex h-24 flex-col items-center justify-center border-2 border-dashed border-brand-red/30 bg-white/50 text-center transition-colors hover:border-brand-red/60 hover:bg-white sm:h-28"
            >
              <span className={`${caveat.className} text-2xl font-bold leading-none text-brand-red`}>your logo here?</span>
              <span className="mt-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500 transition-colors group-hover:text-brand-red">
                Become a sponsor &rarr;
              </span>
            </Link>
          </motion.li>
        )}
      </motion.ul>
    </motion.section>
  );
}