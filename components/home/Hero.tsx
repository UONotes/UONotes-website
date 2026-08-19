"use client";

import Link from "next/link";
import { motion, Variants } from "framer-motion";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
};

export function Hero() {
  return (
    <motion.section 
      initial="hidden" animate="visible" variants={staggerContainer}
      className="flex flex-col items-center text-center px-4 pt-20 pb-24 max-w-4xl mx-auto"
    >
      <motion.h1 variants={fadeUp} className="text-5xl md:text-6xl font-bold font-logo text-brand-red mb-4">
        Welcome to UONotes
      </motion.h1>
      <motion.p variants={fadeUp} className="text-xl md:text-2xl text-gray-800 italic mb-10">
        Notes made by students, for students.
      </motion.p>

      <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-4 mb-12">
        <Link href="/submit" className="bg-brand-red text-white px-8 py-3 rounded-md shadow-md hover:bg-brand-red/90 transition-transform active:scale-95 font-medium">
          Submit notes
        </Link>
        <Link href="/notes" className="bg-brand-red text-white px-8 py-3 rounded-md shadow-md hover:bg-brand-red/90 transition-transform active:scale-95 font-medium">
          View notes
        </Link>
        <Link href="/dashboard" className="bg-brand-red text-white px-8 py-3 rounded-md shadow-md hover:bg-brand-red/90 transition-transform active:scale-95 font-medium">
          My dashboard
        </Link>
      </motion.div>

      <motion.p variants={fadeUp} className="text-gray-600 max-w-2xl text-lg leading-relaxed">
        A student-driven platform making academic resources more accessible across all faculties at the University of Ottawa.
      </motion.p>
    </motion.section>
  );
}