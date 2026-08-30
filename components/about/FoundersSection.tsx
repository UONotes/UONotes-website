"use client";

import { motion, Variants } from "framer-motion";
import { TEAM_DATA } from "@/lib/team-data";
import { ProfileCard } from "@/components/about/ProfileCard";

const presidentialTeamData = 
  TEAM_DATA.TEAM_DATA?.find((team: any) => team.teamName === "Presidential Team") || 
  TEAM_DATA.find((team: any) => team.teamName === "Presidential Team");

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

  return (
    <motion.section 
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={sectionVariants}
      className="mb-20 w-full relative flex flex-col items-center px-4"
    >
      {/* Header Section */}
      <motion.div variants={cardVariants} className="flex flex-col items-center text-center w-full max-w-xl mb-12">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 font-logo tracking-tight mb-3">
          {presidentialTeamData.teamName}
        </h2>
        
        <p className="text-gray-500 text-xs md:text-sm leading-relaxed max-w-lg">
          Guiding the institutional vision, cross-departmental execution, and long-term academic integrity of the UONotes platform.
        </p>
      </motion.div>

      {/* Centered Founders Row */}
      <div className="w-full max-w-5xl flex flex-wrap justify-center items-center gap-6">
        {presidentialTeamData.members.map((member: any, idx: number) => (
          <motion.div key={idx} variants={cardVariants}>
            <ProfileCard member={member} size="default" priority={false} />
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}