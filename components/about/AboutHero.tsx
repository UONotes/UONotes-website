"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export function AboutHero() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12 flex flex-col justify-start">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-center max-w-3xl mx-auto mb-8 flex flex-col items-center"
      >
        <h1 className="text-3xl sm:text-5xl font-black text-gray-900 font-logo mb-3 tracking-tight">
          Meet <span className="text-brand-red">UONotes</span>
        </h1>
        <p className="text-gray-600 text-sm sm:text-base leading-relaxed font-sans max-w-xl font-medium">
          A bilingual, student-led academic initiative dedicated to peer resource sharing, academic integrity, and institutional accessibility at the University of Ottawa.
        </p>
      </motion.div>

      {/* Side-by-Side Grid Layout with restored, comfortable proportions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Immersive Executive Group Photo Banner (Full, healthy height with object-top) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          className="lg:col-span-7 w-full relative min-h-[340px] sm:min-h-[380px] rounded-3xl overflow-hidden bg-gray-900 border border-gray-200/80 shadow-2xl shadow-brand-red/5 group flex flex-col justify-end"
        >
          <Image 
            src="/about/group-photo.png" 
            alt="UONotes Executive Team" 
            fill
            quality={95}
            sizes="(max-width: 1200px) 100vw, 800px"
            className="object-cover object-top group-hover:scale-102 transition-transform duration-700 ease-out"
            priority
          />
          
          {/* Multi-stop Gradient Overlay for Legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

          {/* Editorial Caption with UONotes Brand Identity & /logo.png Badge */}
          <div className="relative z-10 p-5 sm:p-6 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white shadow-lg flex items-center justify-center shrink-0 border border-white/20 p-2 overflow-hidden">
                <Image 
                  src="/logo.png" 
                  alt="UONotes Logo" 
                  width={22} 
                  height={22} 
                  className="object-contain"
                />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-black tracking-tight font-logo">UONOTES // EXECUTIVE TEAM</p>
                <p className="text-[10px] text-gray-300 font-mono">uOttawa • 2026 Cohort</p>
              </div>
            </div>
            <span className="hidden sm:inline-block px-3 py-1 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 text-[10px] font-mono uppercase tracking-widest text-gray-200 shadow-sm">
              Official Roster
            </span>
          </div>
        </motion.div>

        {/* Compact Editorial Context Card */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
          className="lg:col-span-5 w-full bg-white rounded-3xl p-6 sm:p-7 border border-gray-100 shadow-xl shadow-gray-100/50 flex flex-col justify-between"
        >
          <div>
            <span className="text-[10px] font-mono font-bold text-brand-red uppercase tracking-widest mb-2 block">Our Core Mission</span>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight mb-2.5 font-sans">
              Built by uOttawa students, for uOttawa students.
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed font-medium">
              We bridge the gap between rigorous coursework and accessible peer study materials across every faculty on campus.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-5 mt-6 border-t border-gray-100">
            <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gray-50/80 border border-gray-100">
              <span className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">500+</span>
              <span className="text-[10px] font-mono text-gray-400 uppercase font-bold mt-0.5">Study Guides</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-brand-red/5 border border-brand-red/10">
              <span className="text-xl sm:text-2xl font-black text-brand-red tracking-tight">40+</span>
              <span className="text-[10px] font-mono text-brand-red/80 uppercase font-bold mt-0.5">Exec Members</span>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}