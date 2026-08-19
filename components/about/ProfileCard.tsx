"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import type { TeamMember } from "@/lib/team-data";

// 1. Define the props interface to include our new optional size variant
interface ProfileCardProps {
  member: TeamMember;
  size?: "default" | "large";
  priority?: boolean; 
}

export function ProfileCard({ member, size = "default" }: ProfileCardProps) {
  
  // 2. Map the size prop to specific Tailwind width classes
  const sizeClasses = 
    size === "large" 
      ? "w-[160px] md:w-[200px]" // Founders are scaled up
      : "w-[140px] md:w-[160px]"; // Standard grid size

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={{ y: -10, scale: 1.05, transition: { duration: 0.2 } }}
      // 3. Inject the dynamic size classes into the container
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
            // 4. Update the sizes prop to help Next.js optimize the image payload
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
      {/* Changed text-gray-900 to text-brand-red to match the new static mockup */}
      <h4 className={`text-center font-bold leading-tight text-brand-red transition-colors mt-3 ${size === "large" ? "text-base md:text-lg" : "text-sm md:text-base"}`}>
        {member.name}
      </h4>
      <p className={`text-center text-gray-800 mt-1 ${size === "large" ? "text-sm md:text-base" : "text-xs md:text-sm"}`}>
        {member.role}
      </p>
    </motion.div>
  );
}