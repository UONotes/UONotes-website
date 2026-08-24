"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ProfileCard } from "./ProfileCard";
import type { TeamSection } from "@/lib/team-data";

// Define animation constants (called 'variants' in Framer)
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1, // Stagger each child by 0.1s
      delayChildren: 0.2    // Wait 0.2s before starting the staggered sequence
    }
  }
};

const childVariants = {
  hidden: { opacity: 0, x: -20 }, // Slide in from left
  visible: { opacity: 1, x: 0, transition: { duration: 0.5 } }
};

export function TeamRow({ section }: { section: TeamSection }) {
  return (
    // 'whileInView' triggers the reveal only when the section is scrolled into view
    <motion.section 
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }} // Trigger when 20% is visible, only once
      variants={containerVariants}
      className="w-full mb-12 flex flex-col items-center"
    >
      {/* Unique Department Saying Banner (Star/Emoji Removed) */}
      {section.description && (
        <div className="w-full max-w-3xl px-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex items-center justify-center bg-[#fef5f6] border border-brand-red/15 rounded-2xl py-3.5 px-6 text-center shadow-sm"
          >
            <p className="text-sm md:text-base font-medium text-gray-700">
              {section.description}
            </p>
          </motion.div>
        </div>
      )}

      <motion.h3 
        variants={childVariants} // Title slides in
        className="text-2xl font-bold text-brand-red text-center mb-6 font-logo"
      >
        {section.teamName}
      </motion.h3>
      
      {/* 
        Horizontal Scroll Container.
        We make this container animate as a single list,
        then animate its children staggered.
      */}
      <div 
        className="flex flex-nowrap overflow-x-auto no-scrollbar gap-6 px-4 pb-4 snap-x snap-mandatory w-full max-w-5xl mx-auto"
      >
        {section.members.map((member, index) => (
          <motion.div 
            key={`${section.teamName}-${index}`} 
            variants={childVariants} // Staggered children reveal
          >
            <ProfileCard member={member} />
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}