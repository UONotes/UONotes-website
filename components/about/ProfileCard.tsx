"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Caveat } from "next/font/google";
import type { TeamMember } from "@/lib/team-data";

// Handwriting font for the sticky-note names
const caveat = Caveat({ subsets: ["latin"], weight: ["500", "700"] });

interface ProfileCardProps {
  member: TeamMember;
  size?: "default" | "large";
  priority?: boolean;
  /** "lead" = big pink sticky note, "director" = small yellow/cream sticky note, "default" = original card */
  variant?: "default" | "lead" | "director";
  /** Position in the grid – used to vary each note's tilt */
  index?: number;
  /** Sticky-note colour (e.g. the team's colour). Falls back to pink for leads, yellow/cream for directors. */
  noteColour?: string;
}

// Small alternating tilts so the board looks hand-placed
const TILTS = [-2, 2, -1, 3, -3, 1];
const DEFAULT_LEAD_COLOUR = "#fde7ea";
const DEFAULT_DIRECTOR_COLOURS = ["#fff3c9", "#fffdf8"];

function PhotoPlaceholder() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-brand-pink">
      <svg className="h-12 w-12 text-brand-red opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    </div>
  );
}

function StickyNoteCard({
  member,
  variant,
  index = 0,
  noteColour,
}: {
  member: TeamMember;
  variant: "lead" | "director";
  index?: number;
  noteColour?: string;
}) {
  const isLead = variant === "lead";
  const tilt = TILTS[index % TILTS.length];
  const colour = noteColour ?? (isLead ? DEFAULT_LEAD_COLOUR : DEFAULT_DIRECTOR_COLOURS[index % DEFAULT_DIRECTOR_COLOURS.length]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, rotate: tilt }}
      animate={{ opacity: 1, y: 0, rotate: tilt }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={{ rotate: 0, y: -8, scale: 1.04, transition: { duration: 0.2 } }}
      // Leads and directors are the same size; leads are marked by the paperclip and the stronger team colour
      className="group relative w-[150px] flex-shrink-0 cursor-pointer p-2.5 shadow-[0_12px_18px_-10px_rgba(0,0,0,0.35)] transition-shadow duration-300 hover:shadow-[0_20px_28px_-12px_rgba(0,0,0,0.35)] md:w-[165px]"
      style={{ backgroundColor: colour }}
    >
      {/* Paperclip on leadership notes */}
      {isLead && (
        <span
          aria-hidden="true"
          className="absolute -top-3 left-4 z-10 h-8 w-3 rounded-full border-[3px] border-[#98a0aa]"
        />
      )}

      <div className="relative aspect-square w-full overflow-hidden border-4 border-white bg-brand-pink shadow-[0_2px_6px_rgba(0,0,0,0.15)]">
        {member.imageUrl ? (
          <Image
            src={member.imageUrl}
            alt={`${member.name} - ${member.role}`}
            fill
            sizes="165px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <PhotoPlaceholder />
        )}
      </div>

      <h4 className={`${caveat.className} mt-2.5 text-xl font-bold leading-[1.05] text-[#1f2a44] md:text-[22px]`}>
        {member.name}
      </h4>
      <p className="mt-1.5 font-mono text-[8px] font-bold uppercase leading-snug tracking-[0.1em] text-brand-red">
        {member.role}
      </p>
    </motion.div>
  );
}

export function ProfileCard({ member, size = "default", variant = "default", index, noteColour }: ProfileCardProps) {
  if (variant === "lead" || variant === "director") {
    return <StickyNoteCard member={member} variant={variant} index={index} noteColour={noteColour} />;
  }

  // Original card (used anywhere a variant isn't passed)
  const sizeClasses =
    size === "large"
      ? "w-[160px] md:w-[200px]"
      : "w-[140px] md:w-[160px]";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={{ y: -10, scale: 1.05, transition: { duration: 0.2 } }}
      className={`flex flex-col items-center flex-shrink-0 snap-start cursor-pointer p-2 rounded-xl group ${sizeClasses}`}
    >
      <motion.div
        whileHover={{ boxShadow: "0 20px 25px -5px rgba(181, 16, 50, 0.1), 0 10px 10px -5px rgba(181, 16, 50, 0.04)" }}
        className="relative w-full aspect-square mb-3 overflow-hidden rounded-md bg-brand-pink border border-brand-border-light shadow-inner"
      >
        {member.imageUrl ? (
          <Image
            src={member.imageUrl}
            alt={`${member.name} - ${member.role}`}
            fill
            sizes={size === "large" ? "(max-width: 768px) 160px, 200px" : "(max-width: 768px) 140px, 160px"}
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="absolute inset-0 bg-brand-pink flex items-center justify-center transition-all duration-300 group-hover:bg-gradient-to-br group-hover:from-white group-hover:to-brand-pink">
            <svg className="w-12 h-12 text-brand-red opacity-30 group-hover:opacity-60 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        )}
      </motion.div>
      <h4 className={`text-center font-bold leading-tight text-brand-red transition-colors mt-3 ${size === "large" ? "text-base md:text-lg" : "text-sm md:text-base"}`}>
        {member.name}
      </h4>
      <p className={`text-center text-gray-800 mt-1 ${size === "large" ? "text-sm md:text-base" : "text-xs md:text-sm"}`}>
        {member.role}
      </p>
    </motion.div>
  );
}