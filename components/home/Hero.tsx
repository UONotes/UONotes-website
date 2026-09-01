"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, Variants } from "framer-motion";
import { Search, UploadCloud, LayoutDashboard, ArrowRight } from "lucide-react";

// 1. Premium Animation Variants
const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { staggerChildren: 0.1, delayChildren: 0.1 } 
  }
};

const wordAnim: Variants = {
  hidden: { opacity: 0, y: 15, filter: "blur(8px)" },
  visible: { 
    opacity: 1, 
    y: 0, 
    filter: "blur(0px)", 
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } 
  }
};

const fadeUpAnim: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

export function Hero() {
  const line1 = "Notes made by students,".split(" ");
  const line2 = "for students.".split(" ");

  return (
    <section className="relative w-full min-h-[calc(100vh-80px)] flex flex-col items-center justify-center overflow-hidden py-10 sm:py-16 lg:py-24">
      
      <motion.div 
        initial="hidden" animate="visible" variants={staggerContainer}
        className="flex flex-col items-center text-center px-4 sm:px-6 max-w-5xl mx-auto relative z-10 w-full"
      >
        {/* Social Links Pill */}
        <motion.div variants={fadeUpAnim} className="flex items-center gap-1.5 sm:gap-2 mb-8 sm:mb-10">
          <a href="https://instagram.com/uonotes" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-700 text-[10px] sm:text-xs font-semibold shadow-xs hover:border-brand-red/40 hover:text-brand-red transition-all">
            <svg className="w-3.5 h-3.5 fill-current text-brand-red" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            <span>Instagram</span>
          </a>
          <a href="https://tiktok.com/@uonotes" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-700 text-[10px] sm:text-xs font-semibold shadow-xs hover:border-brand-red/40 hover:text-brand-red transition-all">
            <svg className="w-3.5 h-3.5 fill-current text-brand-red" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
            <span>TikTok</span>
          </a>
        </motion.div>

        {/* Premium Typographic Heading */}
        <h1 className="text-[2.5rem] leading-[1.05] sm:text-6xl md:text-7xl lg:text-[5rem] font-black font-logo text-gray-900 mb-6 tracking-tighter w-full max-w-4xl flex flex-wrap justify-center gap-x-2 sm:gap-x-3 lg:gap-x-4">
          {line1.map((word, i) => (
            <motion.span key={i} variants={wordAnim} className="inline-block">
              {word}
            </motion.span>
          ))}
          <span className="flex flex-wrap justify-center gap-x-2 sm:gap-x-3 lg:gap-x-4 w-full">
            {line2.map((word, i) => (
              <motion.span key={i} variants={wordAnim} className="inline-block text-brand-red">
                {word}
              </motion.span>
            ))}
          </span>
        </h1>

        <motion.p variants={fadeUpAnim} className="text-[15px] sm:text-lg md:text-xl text-gray-500 font-medium max-w-2xl leading-relaxed mb-10 sm:mb-12 px-2 sm:px-0 tracking-tight">
          A student-driven platform making academic resources, cheat sheets, and study guides instantly accessible for the University of Ottawa.
        </motion.p>

        {/* Action Center */}
        <motion.div variants={fadeUpAnim} className="flex flex-col items-center w-full max-w-lg mx-auto">
          
          <div className="flex flex-col sm:flex-row items-stretch justify-center gap-3 w-full px-2 sm:px-0">
            {/* Primary Action */}
            <Link 
              href="/notes" 
              className="group relative flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 sm:py-4 bg-brand-red text-white font-bold rounded-xl sm:rounded-2xl shadow-lg shadow-brand-red/20 hover:shadow-brand-red/30 hover:-translate-y-0.5 transition-all text-sm sm:text-base active:scale-[0.98]"
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5" />
              Explore Database
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            {/* Secondary Action - Widened horizontally via padding */}
            <Link 
              href="/submit" 
              className="group flex items-center justify-center gap-2 w-full sm:w-auto px-10 sm:px-12 py-3.5 sm:py-4 bg-white text-gray-800 font-bold rounded-xl sm:rounded-2xl border-2 border-gray-100 shadow-xs hover:border-brand-red/30 hover:bg-gray-50 transition-all text-sm sm:text-base active:scale-[0.98]"
            >
              <UploadCloud className="w-4 h-4 sm:w-5 sm:h-5 text-brand-red" />
              Share Notes
            </Link>
          </div>

          {/* Tertiary Utility */}
          <Link 
            href="/dashboard" 
            className="mt-6 flex items-center gap-1.5 text-[11px] sm:text-xs font-mono font-bold text-gray-400 hover:text-brand-red transition-colors uppercase tracking-widest group p-2"
          >
            <LayoutDashboard className="w-3.5 h-3.5" /> 
            Go to dashboard <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
          </Link>

          {/* Social Proof with Real Student Headshots */}
          <div className="flex items-center gap-3 mt-10 sm:mt-12">
            <div className="flex -space-x-2">
              <div className="relative w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden border-2 border-white shadow-xs bg-gray-100">
                <Image src="/about/Aanreen-Headshot.png" alt="Aanreen" fill className="object-cover" />
              </div>
              <div className="relative w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden border-2 border-white shadow-xs bg-gray-100">
                <Image src="/about/Abigail-Headshot.png" alt="Abigail" fill className="object-cover" />
              </div>
              <div className="relative w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden border-2 border-white shadow-xs bg-gray-100">
                <Image src="/about/Ahmed-Headshot.png" alt="Ahmed" fill className="object-cover" />
              </div>
            </div>
            <p className="text-[10px] sm:text-xs text-gray-500 font-medium tracking-tight">
              Join <span className="font-bold text-gray-900">2,500+</span> uOttawa students
            </p>
          </div>

        </motion.div>
      </motion.div>

    </section>
  );
}