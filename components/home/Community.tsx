"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { motion, useInView, useMotionValue, animate, Variants } from "framer-motion";
import { TrendingUp, Users, BookOpen } from "lucide-react";

// Encapsulated within the only file that uses it
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
      className="py-24 max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center gap-12 md:gap-20"
    >
      <motion.div variants={fadeUp} className="w-full md:w-1/2 bg-[#fef5f6] rounded-2xl p-10 shadow-sm border border-brand-red/10 flex flex-col gap-8">
        <div className="flex items-center gap-6">
          <TrendingUp className="w-10 h-10 text-brand-red" />
          <div>
            <h4 className="text-2xl font-bold text-gray-900">
              <AnimatedCounter to={100000} suffix="+" />
            </h4>
            <p className="text-sm text-gray-600">Interactions</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <Users className="w-10 h-10 text-brand-red" />
          <div>
            <h4 className="text-2xl font-bold text-gray-900">
              <AnimatedCounter to={100} suffix="+" />
            </h4>
            <p className="text-sm text-gray-600">Contributors</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <BookOpen className="w-10 h-10 text-brand-red" />
          <div>
            <h4 className="text-2xl font-bold text-gray-900">
              <AnimatedCounter to={10} />
            </h4>
            <p className="text-sm text-gray-600">Faculties covered</p>
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left">
        <h2 className="text-3xl md:text-4xl font-bold font-logo text-gray-900 leading-tight mb-10">
          Join a growing community of students supporting each other academically.
        </h2>
        <div className="flex flex-wrap justify-center md:justify-start gap-4">
          <Link href="/contact" className="border-2 border-brand-red text-brand-red px-8 py-2.5 rounded-md hover:bg-brand-red/5 transition-colors font-medium">
            Contact us
          </Link>
          <Link href="/about" className="border-2 border-brand-red text-brand-red px-8 py-2.5 rounded-md hover:bg-brand-red/5 transition-colors font-medium">
            Meet the team
          </Link>
        </div>
      </motion.div>
    </motion.section>
  );
}