"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { BookOpen, Award, CheckCircle2 } from "lucide-react";

export function AboutHero() {
  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-center max-w-2xl mb-12 px-4"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 font-logo mb-4 tracking-tight">
          Meet <span className="text-brand-red">UONotes</span>
        </h1>
        <p className="text-gray-600 text-base md:text-lg leading-relaxed font-normal">
          A bilingual, student-led academic initiative dedicated to peer resource sharing and institutional accessibility at the University of Ottawa.
        </p>
      </motion.div>

      {/* Clean High-Resolution Executive Group Photo Banner */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        className="w-full relative h-[38vh] md:h-[55vh] min-h-[380px] max-h-[650px] rounded-2xl mb-12 overflow-hidden border border-gray-200 shadow-sm group"
      >
        <Image 
          src="/about/group-photo.png" 
          alt="UONotes Executive Team" 
          fill
          quality={95}
          sizes="(max-width: 1200px) 100vw, 1200px"
          className="object-cover"
          priority
        />
      </motion.div>

      {/* Minimalist Academic Information Badges */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
        className="flex flex-wrap justify-center items-center gap-3 md:gap-5 w-full max-w-4xl mb-24 px-4"
      >
        <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-medium tracking-wide">
          <BookOpen className="w-4 h-4 text-brand-red" />
          <span>Student-made notes</span>
        </div>

        <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-medium tracking-wide">
          <Award className="w-4 h-4 text-brand-red" />
          <span>Volunteer recognition</span>
        </div>

        <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-medium tracking-wide">
          <CheckCircle2 className="w-4 h-4 text-brand-red" />
          <span>Verified submissions</span>
        </div>
      </motion.div>
    </>
  );
}