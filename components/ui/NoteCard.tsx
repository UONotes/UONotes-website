"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { EyeIcon, BookmarkIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";

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
  const [isSaved, setIsSaved] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function checkSaved() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const { data } = await supabase
        .from("saved_notes")
        .select("id")
        .eq("user_id", user.id)
        .eq("note_id", id)
        .maybeSingle();

      if (!cancelled) setIsSaved(!!data);
    }

    checkSaved();
    return () => { cancelled = true; };
  }, [id]);

  async function handleToggleSave() {
    if (isToggling) return;
    setIsToggling(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setIsToggling(false);
      return;
    }

    if (isSaved) {
      await supabase.from("saved_notes").delete().eq("user_id", user.id).eq("note_id", id);
      setIsSaved(false);
    } else {
      await supabase.from("saved_notes").insert({ user_id: user.id, note_id: id });
      setIsSaved(true);
    }

    setIsToggling(false);
  }

  return (
    <motion.div 
      variants={fadeUp}
      whileHover={{ y: -4 }}
      className="bg-white rounded-xl shadow-sm border border-brand-red/10 overflow-hidden flex flex-col group h-full"
    >
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

      <div className="p-4 flex-1 flex flex-col">
        <Link href={`/notes/view/${id}`}>
          <h3 className="text-base font-bold text-gray-900 leading-tight line-clamp-2 mb-1 group-hover:text-brand-red transition-colors cursor-pointer">
            {title}
          </h3>
        </Link>
        
        <p className="text-sm text-gray-500 mb-4 line-clamp-1">
          {course}
        </p>
        
        <div className="mt-auto pt-4 border-t border-gray-100 flex items-center gap-2">
          <Link 
            href={`/notes/view/${id}`}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-red border border-brand-red/20 rounded hover:bg-brand-red/5 transition-colors text-center"
          >
            <EyeIcon className="w-3.5 h-3.5" /> View PDF
          </Link>
          
          <button 
            onClick={handleToggleSave}
            disabled={isToggling}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-colors cursor-pointer disabled:opacity-60 ${
              isSaved
                ? "text-brand-red border border-brand-red/30 bg-brand-red/5 hover:bg-brand-red/10"
                : "text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-brand-red hover:border-brand-red/20"
            }`}
          >
            <BookmarkIcon className="w-3.5 h-3.5" style={{ fill: isSaved ? "currentColor" : "none" }} /> {isSaved ? "Saved" : "Save"}          </button>
        </div>
      </div>
    </motion.div>
  );
}