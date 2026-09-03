"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { EyeIcon, BookmarkIcon } from "@/components/icons";

type NoteCardProps = {
  title?: string;
  course?: string;
  thumb?: string;
  id?: string;
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

export function NoteCard({ 
  title = "Note title", 
  course = "Course title and code", 
  thumb,
  id = "1"
}: NoteCardProps) {
  
  return (
    <motion.div 
      variants={fadeUp}
      whileHover={{ y: -4 }}
      className="bg-white rounded-xl shadow-sm border border-brand-red/10 overflow-hidden flex flex-col group"
    >
      {/* Top Preview Area — links to the actual note, not the course folder */}
      <Link href={`/notes/view/${id}`} className="relative h-40 bg-[#fdfafb] border-b border-brand-red/5 w-full flex flex-col items-center justify-center overflow-hidden cursor-pointer">
        {thumb ? (
          <Image 
            src={thumb} 
            alt={title} 
            fill 
            sizes="(max-width: 768px) 100vw, 33vw" 
            className="object-cover transition-transform duration-500 group-hover:scale-105" 
          />
        ) : (
          <>
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "repeating-linear-gradient(transparent, transparent 23px, #D9A79E 24px)" }} />
            <div className="z-10 bg-white px-4 py-2 rounded shadow-sm border border-brand-red/10 flex items-center gap-2 group-hover:border-brand-red/40 transition-colors">
              <span className="font-logo font-bold text-brand-red">PDF</span>
            </div>
          </>
        )}
      </Link>

      {/* Content Area */}
      <div className="p-4 flex-1 flex flex-col">
        <Link href={`/notes/view/${id}`}>
          <h3 className="text-base font-bold text-gray-900 leading-tight line-clamp-2 mb-1 group-hover:text-brand-red transition-colors cursor-pointer">
            {title}
          </h3>
        </Link>
        
        <p className="text-sm text-gray-500 mb-4 line-clamp-1">
          {course}
        </p>
        
        {/* Bottom Actions */}
        <div className="mt-auto pt-4 border-t border-gray-100 flex items-center gap-2">
          <Link 
            href={`/notes/view/${id}`}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-red border border-brand-red/20 rounded hover:bg-brand-red/5 transition-colors text-center"
          >
            <EyeIcon className="w-3.5 h-3.5" /> View PDF
          </Link>
          
          <button 
            onClick={() => alert("Note saved to bookmarks!")}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 border border-gray-200 rounded hover:bg-gray-50 hover:text-brand-red hover:border-brand-red/20 transition-colors cursor-pointer"
          >
            <BookmarkIcon className="w-3.5 h-3.5" /> Save
          </button>
        </div>
      </div>
    </motion.div>
  );
}