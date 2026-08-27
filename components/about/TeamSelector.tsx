"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TEAM_DATA } from "@/lib/team-data";
import { ProfileCard } from "./ProfileCard";

// Filter out both Presidential Team and Founders so they do not pollute the tab selector
const nonFounderTeams = TEAM_DATA.filter(
  (team) => team.teamName !== "Presidential Team" && team.teamName !== "Founders"
);

export function TeamSelector() {
  const [activeTeam, setActiveTeam] = useState(nonFounderTeams[0]?.teamName || "");
  const currentTeamData = nonFounderTeams.find((team) => team.teamName === activeTeam);

  // Separate members into VPs and Directors/Others for structural hierarchy
  const vps = currentTeamData?.members.filter((m) => m.role.toLowerCase().includes("vp") || m.role.toLowerCase().includes("vice president")) || [];
  const others = currentTeamData?.members.filter((m) => !vps.includes(m)) || [];

  return (
    <motion.section 
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full flex flex-col items-center"
    >
      <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-3 font-logo">
        Our Teams
      </h2>
      <p className="text-gray-500 text-center max-w-lg mb-10 text-sm md:text-base px-4">
        Explore the specialized departments working behind the scenes to power UONotes.
      </p>

      {/* Clean Selector Button Row */}
      <div className="flex flex-wrap justify-center gap-2.5 mb-8 max-w-4xl px-4">
        {nonFounderTeams.map((team) => {
          const isActive = activeTeam === team.teamName;
          
          return (
            <motion.button
              key={team.teamName}
              onClick={() => setActiveTeam(team.teamName)}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              animate={isActive ? { scale: [1, 1.04, 1] } : { scale: 1 }}
              transition={{ duration: 0.3 }}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-colors duration-300 ${
                isActive 
                  ? "bg-brand-red text-white shadow-lg shadow-brand-red/25 ring-2 ring-brand-red/20" 
                  : "bg-white border border-gray-200 text-gray-600 hover:border-brand-red/40 hover:text-brand-red shadow-sm"
              }`}
            >
              <span>{team.teamName}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Unique Department Saying Banner */}
      <div className="w-full max-w-4xl px-6 mb-12">
        <AnimatePresence mode="wait">
          {currentTeamData && currentTeamData.description && (
            <motion.div
              key={activeTeam + "-desc"}
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="flex items-center justify-center bg-[#fef5f6] border border-brand-red/15 rounded-2xl py-4 px-6 text-center shadow-sm"
            >
              <p className="text-sm md:text-base font-medium text-gray-700">
                {currentTeamData.description}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Structured Multi-Row Layout with VPs on Top and Directors Below */}
      <div className="w-full max-w-5xl mx-auto px-4 min-h-[320px]"> 
        <AnimatePresence mode="wait">
          {currentTeamData && (
            <motion.div
              key={currentTeamData.teamName} 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="flex flex-col items-center gap-10 w-full"
            >
              {/* VP Row */}
              {vps.length > 0 && (
                <div className="w-full flex flex-col items-center">
                  <div className="flex flex-wrap justify-center gap-6 md:gap-8 w-full">
                    {vps.map((member, idx) => (
                      <ProfileCard key={`vp-${idx}`} member={member} />
                    ))}
                  </div>
                </div>
              )}

              {/* Directors / Members Row */}
              {others.length > 0 && (
                <div className="w-full flex flex-col items-center">
                  <div className="flex flex-wrap justify-center gap-6 md:gap-8 w-full">
                    {others.map((member, idx) => (
                      <ProfileCard key={`other-${idx}`} member={member} />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}