"use client";

import Image from "next/image";
import { motion, Variants } from "framer-motion";
import { TEAM_DATA } from "@/lib/team-data";
import { GraduationCap, Quote } from "lucide-react";

const presidentialTeamData = TEAM_DATA.find(
  (team: any) => team.teamName === "Presidential Team"
);

// CONTROL PANEL: Adjust scaling, positioning, and hover states per member independently.
// You can now push scale beyond 125 (e.g., scale-150, scale-175, scale-200) for heavy zooming.
const MEMBER_IMAGE_CONFIG: Record<number, { scale: string; position: string; hoverScale: string }> = {
  0: { 
    scale: "scale-150", 
    position: "object-center", 
    hoverScale: "hover:scale-105" 
  }, // Kiana G. Vazvani (Founder 1)
  1: { 
    scale: "scale-130", // <-- Change this higher or lower to scale Kiana's photo (e.g. scale-175, scale-200)
    position: "object-top", 
    hoverScale: "hover:scale-105" 
  }, // Talar Aghazarian (Founder 2)
};

const sectionVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { staggerChildren: 0.15 } 
  }
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } 
  }
};

export function FoundersSection() {
  if (!presidentialTeamData || !presidentialTeamData.members) return null;

  return (
    <motion.section 
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={sectionVariants}
      className="mb-10 w-full relative flex flex-col items-center px-4 sm:px-6 overflow-hidden"
    >
      {/* Header Section (Restored to original larger text sizing) */}
      <motion.div variants={cardVariants} className="flex flex-col items-center text-center w-full max-w-xl mb-10">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 font-logo tracking-tight mb-2">
          {presidentialTeamData.teamName}
        </h2>
        <p className="text-gray-500 text-xs sm:text-sm leading-relaxed max-w-lg">
          Guiding the institutional vision, cross-departmental execution, and long-term academic integrity of the UONotes platform.
        </p>
      </motion.div>

      {/* Tightly Packed Z-Pattern Rows with reduced gap */}
      <div className="w-full max-w-5xl flex flex-col gap-6 md:gap-8">
        {presidentialTeamData.members.map((member: any, idx: number) => {
          const isEven = idx % 2 === 0;
          
          const config = MEMBER_IMAGE_CONFIG[idx] || { 
            scale: "scale-100", 
            position: "object-center", 
            hoverScale: "hover:scale-105" 
          };

          return (
            <motion.div 
              key={idx} 
              variants={cardVariants}
              className={`flex flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} items-center justify-center gap-5 md:gap-7 w-full`}
            >
              
              {/* Image Container - Slightly streamlined proportions */}
              <div className="w-48 sm:w-52 lg:w-56 aspect-[3/4] relative rounded-3xl overflow-hidden shadow-md border border-gray-200/50 shrink-0">
                <Image 
                  src={member.image || member.imageUrl || "/placeholder.jpg"} 
                  alt={member.name} 
                  fill 
                  className={`object-cover transition-transform duration-700 ease-in-out ${config.position} ${config.scale} ${config.hoverScale}`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
              </div>

              {/* Text Card Container - Slightly more compact vertical footprint */}
              <div className="flex-1 w-full max-w-xl min-h-[260px] sm:min-h-[290px] flex flex-col justify-center bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg shadow-brand-red/5 border border-gray-100 p-5 sm:p-6 relative">
                
                {/* Subtle "Notebook Margin" accent line */}
                <div className="absolute top-5 bottom-5 left-5 w-[2px] bg-brand-red/20 rounded-full" />

                <div className="pl-5 flex flex-col space-y-3 text-left">
                  
                  {/* Title & Headers */}
                  <div className="space-y-2 relative">
                    <Quote className="w-4 h-4 text-brand-red/10 absolute top-0 right-0 hidden sm:block" />
                    
                    <div>
                      <h3 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight mb-1">
                        {member.name}
                      </h3>
                      <span className="inline-block px-2 py-0.5 rounded bg-brand-red text-white text-[9px] font-mono font-bold uppercase tracking-widest shadow-2xs">
                        {member.role || member.title || "Founder"}
                      </span>
                    </div>

                    {/* Academic Ribbon */}
                    {member.program && (
                      <div className="flex items-center gap-2 pt-0.5">
                        <div className="w-1.5 h-3 bg-brand-red rounded-full" />
                        <span className="text-[11px] font-semibold text-gray-700 tracking-wide">
                          {member.program}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Compressed Bio */}
                  <div className="text-gray-800 font-medium text-xs leading-[1.6] max-w-lg">
                    {member.bio ? member.bio.split('\n').map((paragraph: string, i: number) => (
                      <p key={i} className={i > 0 ? "mt-2" : ""}>
                        {paragraph}
                      </p>
                    )) : (
                      <p>Biography not available.</p>
                    )}
                  </div>

                </div>
              </div>

            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}