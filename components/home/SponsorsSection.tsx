"use client";

import { motion, Variants } from "framer-motion";
import { SPONSORS } from "@/lib/sponsors-data";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

export function SponsorsSection() {
  const carouselItems = [...SPONSORS, ...SPONSORS];

  return (
    <motion.section 
      initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
      className="py-12 md:py-16 max-w-7xl mx-auto px-6 relative z-10 border-t border-brand-red/10 overflow-hidden"
    >
      <motion.div variants={fadeUp} className="text-center mb-10">
        <p className="text-sm font-bold tracking-wider text-brand-red uppercase mb-2">
          Backed By
        </p>
        <h2 className="text-2xl md:text-3xl font-bold font-logo text-gray-900 tracking-tight">
          Our Partners & Sponsors
        </h2>
      </motion.div>

      <motion.div variants={fadeUp} className="relative w-full flex items-center">
        
        <div className="absolute -left-6 top-0 bottom-0 w-32 z-10 bg-gradient-to-r from-[#FFE8E8] to-transparent pointer-events-none" />
        <div className="absolute -right-6 top-0 bottom-0 w-32 z-10 bg-gradient-to-l from-[#FFE8E8] to-transparent pointer-events-none" />

        <motion.div 
          className="flex gap-16 items-center w-max"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ 
            duration: 30, 
            ease: "linear", 
            repeat: Infinity 
          }}
        >
          {carouselItems.map((sponsor, idx) => (
            <div 
              key={`${sponsor.name}-${idx}`} 
              className="relative w-32 h-16 transition-transform duration-300 hover:scale-105"
            >
              <img 
                src={sponsor.imageUrl} 
                alt={sponsor.name} 
                className="object-contain w-full h-full"
              />
            </div>
          ))}
        </motion.div>
      </motion.div>
    </motion.section>
  );
}