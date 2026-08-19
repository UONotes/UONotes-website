"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TEAM_DATA } from "@/lib/team-data";
import { ProfileCard } from "@/components/about/ProfileCard";

// Strip out the Founders so they do not pollute the tab selector
const nonFounderTeams = TEAM_DATA.filter((team) => team.teamName !== "Founders");

export function TeamSelector() {
  // Default to the first available non-founder team
  const [activeTeam, setActiveTeam] = useState(nonFounderTeams[0]?.teamName || "");
  const currentTeamData = nonFounderTeams.find((team) => team.teamName === activeTeam);

  return (
    <motion.section 
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full flex flex-col items-center"
    >
      <h2 className="text-3xl font-bold text-gray-900 text-center mb-8 font-logo">
        Our Teams
      </h2>

      {/* The Button Row */}
      <div className="flex flex-wrap justify-center gap-3 mb-16 max-w-4xl">
        {nonFounderTeams.map((team) => {
          const isActive = activeTeam === team.teamName;
          return (
            <motion.button
              key={team.teamName}
              onClick={() => setActiveTeam(team.teamName)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-5 py-2.5 rounded-full text-sm md:text-base font-semibold transition-all duration-200 ${
                isActive 
                  ? "bg-brand-red text-white shadow-md" 
                  : "bg-gray-100 text-gray-600 hover:bg-brand-pink hover:text-brand-red"
              }`}
            >
              {team.teamName}
            </motion.button>
          );
        })}
      </div>

      {/* The Active Team Display */}
      <div className="w-full min-h-[400px]"> 
        <AnimatePresence mode="wait">
          {currentTeamData && (
            <motion.div
              key={currentTeamData.teamName} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex flex-wrap justify-center gap-6 md:gap-8"
            >
              {currentTeamData.members.map((member, idx) => (
                <ProfileCard key={idx} member={member} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}