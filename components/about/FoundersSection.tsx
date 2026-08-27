"use client";

import { motion, Variants } from "framer-motion";
import { TEAM_DATA } from "@/lib/team-data";
import { ProfileCard } from "@/components/about/ProfileCard";
import { Sparkles, ShieldCheck, Users } from "lucide-react";

const presidentialTeamData = TEAM_DATA.TEAM_DATA?.find((team: any) => team.teamName === "Presidential Team") || TEAM_DATA.find((team: any) => team.teamName === "Presidential Team");

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 25 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 0.6, 
      ease: [0.16, 1, 0.3, 1],
      staggerChildren: 0.12 
    } 
  }
};

const cardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 15 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0, 
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } 
  }
};

export function FoundersSection() {
  if (!presidentialTeamData) return null;

  // King Kwab mapped using imageUrl to match ProfileCard's expected prop
  const kingKwabMember = {
    name: "Kwab",
    role: "President & GEO (Goat Executive Officer)",
    imageUrl: "/about/image0.jpg",
  };

  return (
    <motion.section 
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={sectionVariants}
      className="mb-20 w-full relative flex flex-col items-center px-4"
    >
      {/* Subtle Ambient Background Blur */}
      <div className="absolute inset-0 -z-10 flex items-center justify-center pointer-events-none">
        <div className="w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-brand-red/4 rounded-full blur-[100px]" />
      </div>

      {/* Header Section */}
      <motion.div variants={cardVariants} className="flex flex-col items-center text-center w-full max-w-xl mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-red/5 border border-brand-red/10 text-brand-red text-[11px] font-mono font-bold uppercase tracking-wider mb-3 shadow-2xs">
          <Sparkles className="w-3 h-3" />
          <span>Executive Leadership</span>
        </div>

        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 font-logo tracking-tight mb-3">
          {presidentialTeamData.teamName}
        </h2>
        
        <p className="text-gray-500 text-xs md:text-sm leading-relaxed max-w-lg">
          Guiding the institutional vision, cross-departmental execution, and long-term academic integrity of the UONotes platform.
        </p>
      </motion.div>

      {/* Balanced 3-Column Layout */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        
        {/* Left Pill: Zero-Tolerance & Governance */}
        <motion.div 
          variants={cardVariants}
          className="hidden lg:flex lg:col-span-3 flex-col justify-between p-5 rounded-2xl bg-gradient-to-br from-white via-white to-purple-50/30 backdrop-blur-md border border-gray-100/90 shadow-2xs hover:border-gray-200 transition-all h-[280px]"
        >
          <div>
            <div className="w-8 h-8 rounded-xl bg-purple-600/10 text-purple-600 flex items-center justify-center mb-3 border border-purple-600/10">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-mono font-bold text-purple-600 uppercase tracking-widest">Governance</span>
            <h3 className="text-sm font-bold text-gray-900 mt-0.5 mb-1.5">Zero-Tolerance Ethics</h3>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Enforcing strict conflict-of-interest checks, immutable audit logging, and presidential oversight.
            </p>
          </div>

          <div className="pt-3 border-t border-gray-100/80 flex items-center justify-between text-[10px] font-mono text-gray-400">
            <span>Security Tier</span>
            <span className="text-purple-600 font-bold">Super-Admin</span>
          </div>
        </motion.div>

        {/* Center Section: King Kwab on top, founders below */}
        <motion.div 
          variants={cardVariants} 
          className="col-span-1 lg:col-span-6 flex flex-col items-center gap-5 w-full"
        >
          {/* Top Leader (King Kwab) */}
          <motion.div variants={cardVariants} className="flex justify-center w-full">
            <div className="[&_img]:object-cover [&_img]:w-full [&_img]:h-full [&_img]:scale-125">
              <ProfileCard member={kingKwabMember} size="default" priority={true} />
            </div>
          </motion.div>

          {/* Bottom Founders Row */}
          <div className="flex flex-wrap justify-center items-center gap-6 w-full">
            {presidentialTeamData.members.map((member: any, idx: number) => (
              <motion.div key={idx} variants={cardVariants}>
                <ProfileCard member={member} size="default" priority={false} />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right Pill: Organization Scale (40+ Executive Members) */}
        <motion.div 
          variants={cardVariants}
          className="hidden lg:flex lg:col-span-3 flex-col justify-between p-5 rounded-2xl bg-gradient-to-br from-white via-white to-gray-50/85 backdrop-blur-md border border-gray-100/90 shadow-2xs hover:border-gray-200 transition-all h-[280px]"
        >
          <div>
            <div className="w-8 h-8 rounded-xl bg-brand-red/5 text-brand-red flex items-center justify-center mb-3 border border-brand-red/10">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Team Scale</span>
            <h3 className="text-sm font-bold text-gray-900 mt-0.5 mb-1.5">40+ Executives</h3>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Coordinating dedicated directors and student leads across web development, notes verification, campus outreach, and operations.
            </p>
          </div>

          <div className="pt-3 border-t border-gray-100/80 flex items-center justify-between text-[10px] font-mono text-gray-400">
            <span>Departments</span>
            <span className="text-gray-900 font-bold">Cross-Functional</span>
          </div>
        </motion.div>

      </div>

    </motion.section>
  );
}