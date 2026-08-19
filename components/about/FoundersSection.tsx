"use client";

import { motion } from "framer-motion";
import { TEAM_DATA } from "@/lib/team-data";
import { ProfileCard } from "@/components/about/ProfileCard";

const foundersData = TEAM_DATA.find((team) => team.teamName === "Founders");

export function FoundersSection() {
  if (!foundersData) return null;

  return (
    <motion.section 
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="mb-24 w-full"
    >
      <h2 className="text-3xl font-bold text-brand-red text-center mb-10 font-logo">
        {foundersData.teamName}
      </h2>
      <div className="flex flex-wrap justify-center gap-8 md:gap-12">
        {foundersData.members.map((member, idx) => (
          <ProfileCard key={idx} member={member} size="large" priority={true} />
        ))}
      </div>
    </motion.section>
  );
}