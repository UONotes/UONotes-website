"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { motion, useInView, useMotionValue, animate, Variants } from "framer-motion";
import { TrendingUp, Users, BookOpen, ArrowRight } from "lucide-react";

function AnimatedCounter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const count = useMotionValue(0);

  useEffect(() => {
    if (inView) {
      animate(count, to, { duration: 2, ease: "easeOut" });
    }
  }, [inView, count, to]);

  useEffect(() => {
    return count.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = Math.round(latest).toLocaleString() + suffix;
      }
    });
  }, [count, suffix]);

  return <span ref={ref}>0{suffix}</span>;
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

export function Community() {
  return (
    <motion.section 
      initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
      className="py-12 sm:py-16 max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center gap-10 lg:gap-16 relative z-10"
    >
      <motion.div variants={fadeUp} className="w-full md:w-1/2 bg-white/90 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-[0_12px_32px_rgba(185,28,28,0.06)] border border-white/80 flex flex-col gap-6">
        
        <div className="flex items-center gap-5 p-4 rounded-2xl bg-[#fdfafb]/80 border border-brand-red/10 transition-all hover:border-brand-red/30 group">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-brand-red/10 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform text-brand-red shadow-xs">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight font-sans">
              <AnimatedCounter to={100000} suffix="+" />
            </h4>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 font-bold mt-0.5 block">
              // TOTAL INTERACTIONS
            </span>
          </div>
        </div>

        <div className="flex items-center gap-5 p-4 rounded-2xl bg-[#fdfafb]/80 border border-brand-red/10 transition-all hover:border-brand-red/30 group">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-brand-red/10 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform text-brand-red shadow-xs">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight font-sans">
              <AnimatedCounter to={100} suffix="+" />
            </h4>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 font-bold mt-0.5 block">
              // ACTIVE CONTRIBUTORS
            </span>
          </div>
        </div>

        <div className="flex items-center gap-5 p-4 rounded-2xl bg-[#fdfafb]/80 border border-brand-red/10 transition-all hover:border-brand-red/30 group">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-brand-red/10 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform text-brand-red shadow-xs">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight font-sans">
              <AnimatedCounter to={10} suffix="" />
            </h4>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 font-bold mt-0.5 block">
              // FACULTIES COVERED
            </span>
          </div>
        </div>

      </motion.div>

      <motion.div variants={fadeUp} className="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-logo text-gray-900 leading-[1.1] tracking-tight mb-4">
          Join a growing community of students supporting each other academically.
        </h2>
        
        <p className="text-sm sm:text-base text-gray-600 mb-8 leading-relaxed font-sans max-w-lg">
          Whether you need to prep for midterms or want to share your pristine lecture notes, UONotes is engineered to help everyone succeed.
        </p>

        <div className="flex flex-col sm:flex-row gap-3.5 w-full sm:w-auto">
          <Link 
            href="/contact" 
            className="px-6 py-3.5 rounded-xl bg-brand-red text-white text-xs font-mono font-bold uppercase tracking-widest hover:bg-brand-red-hover transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 group text-center"
          >
            <span>Contact us</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link 
            href="/about" 
            className="px-6 py-3.5 rounded-xl bg-white/80 backdrop-blur-md text-gray-800 text-xs font-mono font-bold uppercase tracking-widest border border-gray-200 hover:border-brand-red/30 hover:bg-brand-red/5 hover:text-brand-red transition-all shadow-xs active:scale-95 text-center flex items-center justify-center"
          >
            Meet the team
          </Link>
        </div>
      </motion.div>
    </motion.section>
  );
}