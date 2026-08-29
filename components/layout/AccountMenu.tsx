"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserIcon, ChevronDownIcon, StarFilledIcon, UploadIcon, EditSmallIcon, GlobeIcon, LogoutIcon } from "../icons";
import { Settings } from "lucide-react";

export function AccountMenu({ lang, toggleLang, onSignOut }: { lang: "EN" | "FR"; toggleLang: () => void; onSignOut: () => void; }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, [open]);

  const itemClass = "flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-brand-red/5";

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setOpen((o) => !o)} 
        className="flex items-center gap-2 group p-1 rounded-md transition-colors hover:bg-brand-red/5" 
        aria-label="Account menu"
      >
        <span className="w-10 h-10 rounded-full bg-brand-red flex items-center justify-center text-white shadow-sm transition-transform group-active:scale-95">
          <UserIcon className="w-5 h-5" />
        </span>
        <ChevronDownIcon className={`w-4 h-4 text-brand-red transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            // Replaced 'right-0' with '-right-4' to push the menu outward
            className="absolute -right-4 top-full mt-6 w-64 bg-white rounded-xl shadow-xl border border-brand-red/10 py-2 z-50 origin-top"
          >
            <Link href="/dashboard" onClick={() => setOpen(false)} className={`${itemClass} font-bold text-brand-red`}>
              <StarFilledIcon active className="text-brand-red w-5 h-5" /> My Dashboard
            </Link>
            <Link href="/submit" onClick={() => setOpen(false)} className={`${itemClass} font-semibold text-gray-700 hover:text-brand-red`}>
              <UploadIcon className="w-5 h-5" /> Submit Notes
            </Link>
            <Link href="/notes" onClick={() => setOpen(false)} className={`${itemClass} font-semibold text-gray-700 hover:text-brand-red`}>
              <EditSmallIcon className="w-5 h-5" /> View Notes
            </Link>
            <Link href="/settings" onClick={() => setOpen(false)} className={`${itemClass} font-semibold text-gray-700 hover:text-brand-red`}>
              <Settings className="w-5 h-5" /> Settings
            </Link>

            <div className="border-t border-brand-red/10 my-2" />

            <button onClick={toggleLang} className={`${itemClass} w-full text-left font-semibold text-gray-700 hover:text-brand-red`}>
              <GlobeIcon className="w-5 h-5" /> {lang === "EN" ? "Switch to French" : "Switch to English"}
            </button>
            <button onClick={() => { setOpen(false); onSignOut(); }} className={`${itemClass} w-full text-left font-semibold text-gray-700 hover:text-brand-red`}>
              <LogoutIcon className="w-5 h-5" /> Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}