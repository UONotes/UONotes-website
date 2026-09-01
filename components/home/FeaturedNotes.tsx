"use client";

import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { NoteCard } from "@/components/ui/NoteCard";
import { ArrowRight } from "lucide-react";

// 1. Define the strict interface for your real database payload
export interface FeaturedNote {
  id: string;
  title: string;
  courseCode: string;
  // Add any other metadata NoteCard needs (e.g., author, upvotes)
}

interface FeaturedNotesProps {
  notes: FeaturedNote[]; // 2. Accept real data as a prop
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

export function FeaturedNotes({ notes }: FeaturedNotesProps) {
  // Graceful fallback if the database returns empty or is still loading
  if (!notes || notes.length === 0) {
    return null; 
  }

  return (
    <motion.section 
      initial="hidden" 
      whileInView="visible" 
      viewport={{ once: true, margin: "-100px" }} 
      variants={staggerContainer}
      className="py-16 md:py-24 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10 text-center"
    >
      <motion.div variants={fadeUp} className="flex flex-col items-center justify-center mb-16">
        <h2 className="text-3xl md:text-5xl font-black font-sans text-gray-900 tracking-tighter mb-4">
          Featured <span className="text-brand-red">Notes</span>
        </h2>
        <p className="text-gray-500 text-base md:text-lg max-w-xl font-medium leading-relaxed">
          Explore top-rated study guides, cheat sheets, and summaries shared by students across faculties.
        </p>
      </motion.div>

      {/* 3. Dynamically map over your real database records */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 text-left">
        {notes.map((note) => (
          <motion.div key={note.id} variants={fadeUp} className="h-full">
            <NoteCard 
              id={note.id}
              title={note.title} 
              course={note.courseCode} 
            />
          </motion.div>
        ))}
      </div>

      <motion.div variants={fadeUp} className="flex justify-center">
        <Link 
          href="/notes" 
          className="group relative flex items-center justify-center gap-2 px-8 py-3.5 sm:py-4 bg-brand-red text-white font-bold rounded-xl sm:rounded-2xl shadow-lg shadow-brand-red/20 hover:shadow-brand-red/30 hover:-translate-y-0.5 transition-all text-sm sm:text-base active:scale-[0.98]"
        >
          View All Notes
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </motion.div>
    </motion.section>
  );
}