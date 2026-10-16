"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserIcon, ChevronDownIcon, StarFilledIcon, UploadIcon, EditSmallIcon, LogoutIcon } from "../icons";
import { Settings, ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// Same "rubber stamp" lettering as the navbar
const STAMP_TEXT = "font-mono font-bold uppercase tracking-[0.16em]";

// Height of each ruled line on the index card (menu rows sit exactly on the lines)
const ROW = 56;

interface AccountMenuProps {
  lang: "EN" | "FR";
  toggleLang: () => void;
  onSignOut: () => void;
  isAdmin: boolean;
}

export function AccountMenu({ onSignOut, isAdmin }: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState<string>("");
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const supabase = createClient();

    async function fetchUserProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();

      if (profile?.full_name) {
        const first = profile.full_name.trim().split(" ")[0];
        if (first) setFirstName(first);
      }
    }

    fetchUserProfile();
  }, []);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", handleClick);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("mousedown", handleClick);
      window.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const items = [
    { href: "/dashboard", label: "My Dashboard", icon: <StarFilledIcon className="h-5 w-5" /> },
    { href: "/submit", label: "Submit Notes", icon: <UploadIcon className="h-5 w-5" /> },
    { href: "/notes", label: "View Notes", icon: <EditSmallIcon className="h-5 w-5" /> },
    { href: "/settings", label: "Settings", icon: <Settings className="h-5 w-5" /> },
  ];

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger: a dashed "HI, NAME ▾" stamp, same size as the navbar links (just the icon on small screens) */}
      <motion.button
        onClick={() => setOpen((o) => !o)}
        whileTap={{ scale: 0.95 }}
        className={`flex items-center gap-2 border-2 border-dashed border-brand-red px-3 py-2.5 text-[13px] text-brand-red transition-colors hover:border-solid md:px-4 xl:text-[15px] ${STAMP_TEXT} ${
          open ? "border-solid bg-brand-red text-white" : "hover:bg-brand-red/5"
        }`}
        aria-label="Account menu"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <UserIcon className="h-4 w-4 md:hidden" />
        <span className="hidden max-w-[140px] items-center truncate md:inline-flex">
          Hi,&nbsp;
          {firstName || <span className="inline-block h-3 w-12 animate-pulse bg-brand-red/20" />}
        </span>
        <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="absolute -right-[62px] top-full z-50 mt-4 w-[min(22rem,calc(100vw-2.5rem))] lg:right-0 origin-top-right bg-white pt-4 shadow-[0_20px_34px_-18px_rgba(0,0,0,0.4)]"
            style={{
              // Lined index card: red line along the top, then faint blue rules under each row
              backgroundImage: `linear-gradient(#e39aa1, #e39aa1), repeating-linear-gradient(transparent 0 ${ROW - 1}px, #e8eef4 ${ROW - 1}px ${ROW}px)`,
              backgroundSize: "100% 2px, 100% 100%",
              backgroundRepeat: "no-repeat, repeat",
              backgroundPosition: "0 14px, 0 16px",
            }}
          >
            {/* Tape */}
            <span aria-hidden="true" className="absolute -top-2.5 left-1/2 h-[18px] w-16 -translate-x-1/2 bg-brand-red/20" />

            {/* Links */}
            {items.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  aria-current={isActive ? "page" : undefined}
                  className={`group flex items-center gap-4 px-6 text-[14px] transition-colors ${STAMP_TEXT} ${
                    isActive ? "bg-brand-red/[0.08] text-brand-red" : "text-[#1f2a44] hover:bg-brand-red/[0.06] hover:text-brand-red"
                  }`}
                  style={{ height: ROW }}
                >
                  <span className="text-brand-red">{item.icon}</span>
                  <span className="transition-transform group-hover:translate-x-0.5">{item.label}</span>
                </Link>
              );
            })}

            {/* Admin */}
            {isAdmin && (
              <div className="mx-4 mt-3.5">
                <Link
                  href="/admin/"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={`flex w-full items-center justify-center gap-2.5 bg-gray-900 py-4 text-[13px] text-white shadow-[inset_0_0_0_2px_rgba(255,255,255,0.12)] transition-colors hover:bg-brand-red ${STAMP_TEXT}`}
                >
                  <ShieldAlert className="h-5 w-5 text-[#f3a7ae]" strokeWidth={2.5} />
                  Admin Console
                </Link>
              </div>
            )}

            {/* Sign out: a quiet link in a soft footer strip */}
            <div className="mt-3.5 flex justify-end border-t border-[#f0d5d8] bg-[#fbf1f1] px-6 py-3.5">
              <button
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onSignOut();
                }}
                className={`group flex items-center gap-2 border-b-[1.5px] border-brand-red/35 pb-0.5 text-[13px] text-brand-red transition-colors hover:border-brand-red ${STAMP_TEXT}`}
              >
                Sign out
                <LogoutIcon className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}