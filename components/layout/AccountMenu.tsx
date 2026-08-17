"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { UserIcon, ChevronDownIcon, StarFilledIcon, UploadIcon, EditSmallIcon, GlobeIcon, LogoutIcon } from "../icons";

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

  const itemClass = "flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-brand-surface";

  return (
    <div className="relative" ref={menuRef}>
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-1.5" aria-label="Account menu">
        <span className="w-9 h-9 rounded-full bg-brand-red flex items-center justify-center">
          <UserIcon />
        </span>
        <ChevronDownIcon className={open ? "rotate-180 transition-transform" : "transition-transform"} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-brand-border-light py-2 z-50">
          <Link href="/dashboard" onClick={() => setOpen(false)} className={`${itemClass} font-bold text-brand-red`}>
            <StarFilledIcon active /> My Dashboard
          </Link>
          <Link href="/submit" onClick={() => setOpen(false)} className={`${itemClass} font-bold text-brand-dark`}>
            <UploadIcon /> Submit Notes
          </Link>
          <Link href="/notes" onClick={() => setOpen(false)} className={`${itemClass} font-bold text-brand-dark`}>
            <EditSmallIcon /> View Notes
          </Link>

          <div className="border-t border-brand-border-light my-2" />

          <button onClick={toggleLang} className={`${itemClass} w-full text-left font-medium text-brand-dark`}>
            <GlobeIcon /> {lang === "EN" ? "ENG / FR" : "FR / ENG"}
          </button>
          <button onClick={() => { setOpen(false); onSignOut(); }} className={`${itemClass} w-full text-left font-medium text-brand-dark`}>
            <LogoutIcon /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
