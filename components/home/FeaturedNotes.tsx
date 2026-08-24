"use client";

import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { NoteCard } from "@/components/ui/NoteCard";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

export function FeaturedNotes() {
  return (
    <motion.section 
      initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
      className="py-16 md:py-24 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10 text-center"
    >
      <motion.div variants={fadeUp} className="flex flex-col items-center justify-center gap-3 mb-16">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-logo text-brand-red tracking-tight">
          Featured notes
        </h2>
        <p className="text-gray-600 text-base sm:text-lg max-w-xl">
          Explore top-rated study guides, cheat sheets, and summaries shared by students across faculties.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 text-left">
        <NoteCard title="Data Structures and Algorithms - Midterm Prep" course="CSI 2110" />
        <NoteCard title="Introduction to Microeconomics Cheat Sheet" course="ECO 1104" />
        <NoteCard title="Organic Chemistry I - Full Reaction Mechanisms" course="CHM 2120" />
        <NoteCard title="Calculus II - Integration Formulas" course="MAT 1322" />
      </div>

      <motion.div variants={fadeUp} className="flex justify-center">
        <Link href="/notes" className="px-8 py-3.5 rounded-lg bg-brand-red text-white font-semibold text-base shadow-lg shadow-brand-red/20 hover:bg-brand-red/90 transition-all active:scale-95 text-center">
          View all notes
        </Link>
      </motion.div>
    </motion.section>
  );
}