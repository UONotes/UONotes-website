"use client";

import { motion } from "framer-motion";
import { EventsSection } from "@/components/events/EventsSection.tsx";

export default function EventsPage() {
  return (
    <motion.main 
      initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="w-full min-h-screen text-gray-900"
    >
      <EventsSection />
    </motion.main>
  );
}