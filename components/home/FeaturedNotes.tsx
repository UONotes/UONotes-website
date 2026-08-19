"use client";

import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { FileText } from "lucide-react";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
};

export function FeaturedNotes() {
  return (
    <motion.section 
      initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
      className="py-20 max-w-7xl mx-auto px-4"
    >
      <motion.div variants={fadeUp} className="flex items-center justify-center gap-4 mb-12">
        <FileText className="w-8 h-8 text-brand-red" />
        <h2 className="text-4xl font-bold font-logo text-brand-red">Featured notes</h2>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {[1, 2, 3, 4].map((i) => (
          <motion.div key={i} variants={fadeUp} whileHover={{ y: -5 }} className="bg-[#fef5f6] rounded-xl shadow-sm border border-brand-red/10 overflow-hidden flex flex-col">
            <div className="h-40 bg-brand-red/5 w-full flex items-center justify-center text-brand-red/30">
              <FileText className="w-12 h-12" />
            </div>
            <div className="p-5 flex-1 flex flex-col items-center text-center">
              <h3 className="font-bold text-gray-900 mb-1">Note title</h3>
              <p className="text-sm text-gray-500 mb-4">Course title and code</p>
              <div className="mt-auto flex gap-2 w-full justify-center">
                <button className="px-4 py-1.5 text-xs font-medium border border-brand-red/20 text-brand-red rounded hover:bg-brand-red/5 transition-colors">View PDF</button>
                <button className="px-4 py-1.5 text-xs font-medium border border-brand-red/20 text-brand-red rounded hover:bg-brand-red/5 transition-colors">Save</button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div variants={fadeUp} className="flex justify-center">
        <Link href="/notes" className="bg-brand-red text-white px-8 py-3 rounded-md shadow-md hover:bg-brand-red/90 transition-transform active:scale-95 font-medium">
          View all notes
        </Link>
      </motion.div>
    </motion.section>
  );
}