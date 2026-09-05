"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserIcon, ChevronDownIcon, StarFilledIcon, UploadIcon, EditSmallIcon, LogoutIcon } from "../icons";
import { Settings, ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface AccountMenuProps {
  lang: "EN" | "FR";
  toggleLang: () => void;
  onSignOut: () => void;
  isAdmin: boolean;
}

export function AccountMenu({ lang, toggleLang, onSignOut, isAdmin }: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState<string>("Account");
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const supabase = createClient();

    async function fetchUserProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      if (profile?.full_name) {
        const first = profile.full_name.trim().split(" ")[0];
        if (first) setFirstName(first);
      }
    }

    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      {/* iOS Glass Pill Trigger displaying the user's first name */}
      <button 
        onClick={() => setOpen((o) => !o)} 
        className="flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-white/20 backdrop-blur-xl border border-white/50 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),0_4px_12px_rgba(0,0,0,0.03)] transition-all hover:bg-white/30 active:scale-95 group"
        aria-label="Account menu"
      >
        <span className="w-6 h-6 rounded-full bg-brand-red flex items-center justify-center text-white shadow-xs">
          <UserIcon className="w-3.5 h-3.5" />
        </span>
        <span className="font-logo text-xs font-bold uppercase tracking-wider text-brand-body hidden md:inline-block max-w-[100px] truncate">
          {firstName}
        </span>
        <ChevronDownIcon className={`w-3.5 h-3.5 text-brand-red transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-full mt-3 w-72 bg-white/90 backdrop-blur-2xl rounded-2xl shadow-[0_12px_32px_rgba(185,28,28,0.08)] border border-white/80 py-3 z-50 origin-top overflow-hidden"
          >
            {/* Menu Items with dynamic active route styling */}
            {[
              { href: "/dashboard", label: "My Dashboard", icon: <StarFilledIcon className="w-4 h-4" /> },
              { href: "/submit", label: "Submit Notes", icon: <UploadIcon className="w-4 h-4" /> },
              { href: "/notes", label: "View Notes", icon: <EditSmallIcon className="w-4 h-4" /> },
              { href: "/settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
            ].map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3.5 px-5 py-3 text-xs font-logo font-bold uppercase tracking-wider transition-all duration-200 rounded-xl mx-2 ${
                    isActive 
                      ? "text-brand-red bg-brand-red/10" 
                      : "text-gray-800 hover:bg-brand-red/10 hover:text-brand-red"
                  }`}
                >
                  <span className={isActive ? "text-brand-red" : "text-gray-700"}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* Admin Section (Only renders if user is an admin) */}
            {isAdmin && (
              <>
                <div className="border-t border-brand-red/10 my-2 mx-4" />
                <div className="px-5 py-0.5 mb-1">
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-500 font-bold">
                    // ADMINISTRATION
                  </span>
                </div>
                {/* Removed the nested px-2 container and matched mx-2 to align with standard links */}
                <div className="px-2">
                  <Link 
                    href="/admin/" 
                    onClick={() => setOpen(false)} 
                    className="flex items-center justify-center gap-2.5 w-full py-3 bg-gray-900 text-white font-logo text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-brand-red transition-colors shadow-sm"
                  >
                    <ShieldAlert className="w-4 h-4 text-brand-red" strokeWidth={2.5} />
                    Admin Console
                  </Link>
                </div>
              </>
            )}

            <div className="border-t border-brand-red/10 my-2 mx-4" />

            {/* Utility Actions */}
            <button 
              onClick={() => { setOpen(false); onSignOut(); }} 
              className="flex items-center gap-3.5 w-full px-5 py-3 text-xs font-logo font-bold uppercase tracking-wider text-gray-700 hover:text-brand-red hover:bg-brand-red/10 transition-all duration-200 rounded-xl mx-2 text-left"
            >
              <LogoutIcon className="w-4 h-4 text-brand-red" /> 
              <span>Sign out</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}