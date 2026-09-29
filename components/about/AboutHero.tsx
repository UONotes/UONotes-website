"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Caveat } from "next/font/google";

// Handwriting font for the scribbles, caption and checklist
const caveat = Caveat({ subsets: ["latin"], weight: ["500", "700"] });

const VALUES = [
  { title: "Access", text: "Useful academic support should not depend on who you already know." },
  { title: "Community", text: "We build alongside students, with room for many experiences and perspectives." },
  { title: "Care", text: "Every note, event, and conversation should make campus feel a little more possible." },
];

// Pink highlighter stroke across the lower part of the word
const HIGHLIGHTER = "linear-gradient(transparent 38%, rgba(250,120,140,0.5) 38%, rgba(250,120,140,0.45) 88%, transparent 88%)";

export function AboutHero() {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20">
      <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
          className="max-w-2xl"
        >
          <p className="mb-5 font-mono text-xs font-bold uppercase tracking-[0.24em] text-brand-red">
            UONotes / About us
          </p>
          <h1 className="font-logo text-[clamp(3.75rem,9vw,8.5rem)] font-black leading-[0.82] tracking-[-0.06em] text-gray-900">
            Students
            <br />
            <span className="relative inline-block">
              {/* Highlighter swipes across "helping" after the page loads */}
              <motion.span
                className="-mx-[0.08em] bg-no-repeat px-[0.08em]"
                style={{ backgroundImage: HIGHLIGHTER }}
                initial={{ backgroundSize: "0% 100%" }}
                animate={{ backgroundSize: "100% 100%" }}
                transition={{ duration: 0.7, delay: 0.6, ease: [0.65, 0, 0.35, 1] }}
              >
                helping
              </motion.span>
              {/* Handwritten note next to the word */}
              <motion.span
                aria-hidden="true"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 1.25 }}
                className={`${caveat.className} absolute left-full top-[18%] ml-[0.25em] hidden -rotate-6 whitespace-nowrap text-[clamp(1.5rem,2.4vw,2.25rem)] font-bold leading-none tracking-normal text-brand-red sm:block`}
              >
                &larr; us!
              </motion.span>
            </span>
            <br />
            students.
          </h1>
          <p className="mt-8 max-w-xl text-base leading-relaxed text-brand-body sm:text-lg">
            UONotes is a bilingual, student-led community making university feel more navigable through shared knowledge, thoughtful resources, and people who care.
          </p>
          <a
            href="#teams"
            className="mt-8 inline-flex items-center gap-3 border-b-2 border-brand-red pb-2 font-bold text-brand-red transition-[gap] hover:gap-5"
          >
            Meet the people behind UONotes
            <span aria-hidden="true">&rarr;</span>
          </a>
        </motion.div>

        {/* Team photo taped onto a lined notebook page */}
        <motion.figure
          initial={{ opacity: 0, scale: 0.96, rotate: -3 }}
          animate={{ opacity: 1, scale: 1, rotate: -1.5 }}
          transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
          className="relative bg-[#fffdf8] p-3 shadow-[0_24px_40px_-20px_rgba(0,0,0,0.4)] sm:p-4"
          style={{ backgroundImage: "repeating-linear-gradient(to bottom, transparent 0 27px, #dfe6ee 27px 28px)" }}
        >
          {/* Two strips of tape */}
          <span aria-hidden="true" className="absolute -top-3 left-[8%] z-10 h-6 w-24 -rotate-[8deg] bg-brand-red/20 sm:w-28" />
          <span aria-hidden="true" className="absolute -top-3 right-[8%] z-10 h-6 w-24 rotate-[7deg] bg-brand-red/20 sm:w-28" />

          <div className="relative aspect-[990/638] rotate-[1.5deg] overflow-hidden border-[6px] border-white bg-[#261b1d] shadow-[0_4px_10px_rgba(0,0,0,0.2)]">
            <Image
              src="/about/group-photo.png"
              alt="The UONotes executive team"
              fill
              priority
              quality={95}
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover object-center transition-transform duration-700 hover:scale-[1.02]"
            />
          </div>

          <figcaption className={`${caveat.className} mx-1.5 mt-3 text-[22px] font-bold leading-7 text-[#1f2a44] sm:text-2xl`}>
            The whole exec team, <span className="text-brand-red">2026</span> &mdash; uOttawa
          </figcaption>
        </motion.figure>
      </div>

      {/* Values as a ticked checklist */}
      <motion.ul
        initial="hidden"
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.15, delayChildren: 0.4 } } }}
        className="mt-16 grid border-y-2 border-dashed border-[#e3cfd1] sm:grid-cols-3"
      >
        {VALUES.map((value, i) => (
          <motion.li
            key={value.title}
            variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45 } } }}
            className={`flex gap-3.5 py-6 ${
              i < VALUES.length - 1 ? "border-b-2 border-dashed border-[#e3cfd1] sm:border-b-0 sm:border-r-2" : ""
            } ${i === 0 ? "sm:pr-8" : i === VALUES.length - 1 ? "sm:pl-8" : "sm:px-8"}`}
          >
            {/* Checkbox with a red pen tick */}
            <span aria-hidden="true" className="relative mt-1 h-[22px] w-[22px] flex-none rounded-[3px] border-[2.5px] border-[#161a2e]">
              <motion.span
                variants={{ hidden: { scale: 0, rotate: -20 }, visible: { scale: 1, rotate: 0, transition: { delay: 0.25, type: "spring", stiffness: 400, damping: 14 } } }}
                className={`${caveat.className} absolute -top-[18px] left-px text-[34px] font-bold leading-none text-brand-red`}
              >
                &#10003;
              </motion.span>
            </span>
            <div>
              <p className={`${caveat.className} text-[28px] font-bold leading-none text-[#161a2e]`}>{value.title}</p>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-brand-body">{value.text}</p>
            </div>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
}