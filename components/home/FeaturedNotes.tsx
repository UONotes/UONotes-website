"use client";

import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { NoteCard } from "@/components/ui/NoteCard";
import { ArrowRight } from "lucide-react";

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
      <motion.div variants={fadeUp} className="flex flex-col items-center justify-center mb-16">
        <h2 className="text-3xl md:text-5xl font-black font-sans text-gray-900 tracking-tighter mb-4">
          Featured <span className="text-brand-red">Notes</span>
        </h2>
        <p className="text-gray-500 text-base md:text-lg max-w-xl font-medium leading-relaxed">
          Explore top-rated study guides, cheat sheets, and summaries shared by students across faculties.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 text-left">
        <motion.div variants={fadeUp} className="h-full">
          <NoteCard title="Data Structures and Algorithms - Midterm Prep" course="CSI 2110" />
        </motion.div>
        
        <motion.div variants={fadeUp} className="h-full">
          <NoteCard title="Introduction to Microeconomics Cheat Sheet" course="ECO 1104" />
        </motion.div>
        
        <motion.div variants={fadeUp} className="h-full">
          <NoteCard title="Organic Chemistry I - Full Reaction Mechanisms" course="CHM 2120" />
        </motion.div>
        
        <motion.div variants={fadeUp} className="h-full">
          <NoteCard title="Calculus II - Integration Formulas" course="MAT 1322" />
        </motion.div>
      </div>

      <motion.div variants={fadeUp} className="flex justify-center">
        <Link 
          href="/notes" 
          className="group relative flex items-center justify-center gap-2 px-8 py-3.5 sm:py-4 bg-brand-red text-white font-bold rounded-xl sm:rounded-2xl shadow-lg shadow-brand-red/20 hover:shadow-brand-red/30 hover:-translate-y-0.5 transition-all text-sm sm:text-base active:scale-[0.98]"
        >
          View All Notes
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </motion.div>
    </motion.section>
  );
}