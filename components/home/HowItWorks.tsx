"use client";

import { motion, Variants } from "framer-motion";
import { Upload, FileText, Star, ArrowRight } from "lucide-react";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
};

export function HowItWorks() {
  return (
    <motion.section 
      initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
      className="py-20"
    >
      <div className="max-w-5xl mx-auto px-4">
        <motion.h2 variants={fadeUp} className="text-4xl font-bold font-logo text-brand-red text-center mb-16">
          How it works
        </motion.h2>
        
        <motion.div variants={fadeUp} className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-4">
          <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0 }} className="flex flex-col items-center flex-1">
            <div className="w-20 h-20 bg-[#fef5f6] rounded-full flex items-center justify-center mb-4 shadow-sm border border-brand-red/10">
              <Upload className="w-8 h-8 text-brand-red" />
            </div>
            <p className="font-semibold text-gray-800 text-center">Upload your notes</p>
          </motion.div>

          <motion.div animate={{ opacity: [0.2, 1, 0.2], x: [0, 10, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }} className="hidden md:flex">
            <ArrowRight className="w-8 h-8 text-brand-red" />
          </motion.div>

          <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="flex flex-col items-center flex-1">
            <div className="w-20 h-20 bg-[#fef5f6] rounded-full flex items-center justify-center mb-4 shadow-sm border border-brand-red/10">
              <FileText className="w-8 h-8 text-brand-red" />
            </div>
            <p className="font-semibold text-gray-800 text-center">Get reviewed by our team</p>
          </motion.div>

          <motion.div animate={{ opacity: [0.2, 1, 0.2], x: [0, 10, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1.5 }} className="hidden md:flex">
            <ArrowRight className="w-8 h-8 text-brand-red" />
          </motion.div>

          <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 2 }} className="flex flex-col items-center flex-1">
            <div className="w-20 h-20 bg-[#fef5f6] rounded-full flex items-center justify-center mb-4 shadow-sm border border-brand-red/10">
              <Star className="w-8 h-8 text-brand-red" />
            </div>
            <p className="font-semibold text-gray-800 text-center">Earn volunteer hours</p>
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  );
}