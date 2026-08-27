"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { motion, useInView, useMotionValue, animate, Variants } from "framer-motion";
import { TrendingUp, Users, BookOpen } from "lucide-react";

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
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
};

export function Community() {
  return (
    <motion.section 
      initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
      className="py-16 md:py-20 max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center gap-16 relative z-10"
    >
      <motion.div variants={fadeUp} className="w-full md:w-1/2 bg-white rounded-3xl p-10 shadow-xl shadow-brand-red/5 border border-brand-red/10 flex flex-col gap-10">
        <div className="flex items-center gap-6 group">
          <div className="w-14 h-14 bg-[#fef5f6] rounded-full flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-7 h-7 text-brand-red" />
          </div>
          <div>
            <h4 className="text-3xl font-bold text-gray-900 tracking-tight">
              <AnimatedCounter to={100000} suffix="+" />
            </h4>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mt-1">Interactions</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6 group">
          <div className="w-14 h-14 bg-[#fef5f6] rounded-full flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <Users className="w-7 h-7 text-brand-red" />
          </div>
          <div>
            <h4 className="text-3xl font-bold text-gray-900 tracking-tight">
              <AnimatedCounter to={100} suffix="+" />
            </h4>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mt-1">Contributors</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6 group">
          <div className="w-14 h-14 bg-[#fef5f6] rounded-full flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <BookOpen className="w-7 h-7 text-brand-red" />
          </div>
          <div>
            <h4 className="text-3xl font-bold text-gray-900 tracking-tight">
              <AnimatedCounter to={10} />
            </h4>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mt-1">Faculties Covered</p>
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left">
        <h2 className="text-4xl md:text-5xl font-bold font-logo text-gray-900 leading-[1.15] tracking-tight mb-8">
          Join a growing community of students supporting each other academically.
        </h2>
        <p className="text-lg text-gray-600 mb-10 leading-relaxed">
          Whether you need to cram for a midterm or want to share your pristine lecture notes, UONotes is built to help everyone succeed.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link href="/contact" className="px-8 py-3.5 rounded-lg bg-white text-gray-800 font-semibold text-base border border-gray-200 hover:border-brand-red/30 hover:bg-[#fef5f6] hover:text-brand-red transition-all text-center">
            Contact us
          </Link>
          <Link href="/about" className="px-8 py-3.5 rounded-lg bg-white text-gray-800 font-semibold text-base border border-gray-200 hover:border-brand-red/30 hover:bg-[#fef5f6] hover:text-brand-red transition-all text-center">
            Meet the team
          </Link>
        </div>
      </motion.div>
    </motion.section>
  );
}