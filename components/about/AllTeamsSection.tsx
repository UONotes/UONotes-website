"use client";

import { motion } from "framer-motion";
import { TEAM_DATA } from "@/lib/team-data";
import { ProfileCard } from "@/components/about/ProfileCard";

const regularTeams = TEAM_DATA.filter((team) => team.teamName !== "Founders");

// Slice the array to isolate the specific teams for the 3-column layout
const topTeams = regularTeams.slice(0, 4); // Notes, Bilingualism, Finance, Social Media
const gridTeams = regularTeams.slice(4, 7); // Events, Outreach, Design
const bottomTeams = regularTeams.slice(7); // Website Devs, Media Prod

export function AllTeamsSection() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Helper function to render standard full-width rows cleanly
  const renderStandardTeam = (team: typeof regularTeams[0]) => (
    <motion.section 
      key={team.teamName}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full flex flex-col items-center"
    >
      <h2 className="text-3xl md:text-4xl font-bold text-brand-red text-center mb-10 font-logo">
        {team.teamName}
      </h2>
      <div className="flex flex-wrap justify-center gap-6 md:gap-10 max-w-5xl">
        {team.members.map((member, idx) => (
          <ProfileCard key={idx} member={member} />
        ))}
      </div>
    </motion.section>
  );

  return (
    <div className="w-full flex flex-col items-center gap-24">
      
      {/* 1. Standard Top Teams */}
      {topTeams.map(renderStandardTeam)}

      {/* 2. The 3-Column Stakeholder Layout */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-5xl flex flex-col md:flex-row justify-center items-start gap-12 md:gap-4 lg:gap-12"
      >
        {gridTeams.map((team) => (
          <div key={team.teamName} className="flex-1 flex flex-col items-center w-full">
            <h2 className="text-3xl font-bold text-brand-red text-center mb-10 font-logo whitespace-nowrap">
              {team.teamName}
            </h2>
            {/* Forced flex-col to stack members vertically exactly like the mockup */}
            <div className="flex flex-col items-center gap-8">
              {team.members.map((member, idx) => (
                <ProfileCard key={idx} member={member} />
              ))}
            </div>
          </div>
        ))}
      </motion.section>

      {/* 3. Standard Bottom Teams */}
      {bottomTeams.map(renderStandardTeam)}

      {/* Back to Top Button */}
      <motion.button
        onClick={scrollToTop}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="mt-12 mb-20 px-8 py-2.5 font-logo border-2 border-brand-red text-brand-red font-bold rounded-md hover:bg-brand-red/5 transition-colors shadow-sm"
      >
        Back to top
      </motion.button>

    </div>
  );
}