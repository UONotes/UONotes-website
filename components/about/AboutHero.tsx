"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export function AboutHero() {
  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-center max-w-3xl mb-12"
      >
        <h1 className="text-4xl font-bold text-brand-red font-logo mb-4">Meet UONotes</h1>
        <p className="text-gray-700 text-lg">
          UONotes is a bilingual, student-led initiative focused on improving academic accessibility through peer-created resources.
        </p>
      </motion.div>

      {/* Reduced bottom margin from mb-24 to mb-10 to connect it with the tags */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        className="w-full relative h-[40vh] md:h-[60vh] min-h-[400px] max-h-[700px] rounded-2xl mb-10 overflow-hidden border border-brand-border-light shadow-xl"
      >
        <Image 
          src="/about/group-photo.png" 
          alt="UONotes Executive Team" 
          fill
          sizes="(max-width: 1200px) 100vw, 1200px"
          className="object-cover"
          priority
        />
      </motion.div>

      {/* New: The 3 Information Tags */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
        className="flex flex-wrap justify-center gap-4 md:gap-6 w-full max-w-4xl mb-24"
      >
        <div className="px-6 py-2 border border-brand-red text-brand-red font-logo font-bold text-lg rounded-md shadow-sm bg-transparent">
          Student-made notes
        </div>
        <div className="px-6 py-2 border border-brand-red text-brand-red font-logo font-bold text-lg rounded-md shadow-sm bg-transparent">
          Volunteer recognition
        </div>
        <div className="px-6 py-2 border border-brand-red text-brand-red font-logo font-bold text-lg rounded-md shadow-sm bg-transparent">
          Verified submissions
        </div>
      </motion.div>
    </>
  );
}