"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export function Navbar() {
  const [lang, setLang] = useState<"EN" | "FR">("EN");
  const toggleLang = () => setLang(prev => prev === "EN" ? "FR" : "EN");

  return (
    <nav className="flex items-center gap-8 max-w-site mx-auto px-6 py-4">
      <Link href="/" className="flex items-center gap-2">
        <Image src="/logo.png" alt="" width={44} height={44} className="object-contain w-auto h-[clamp(28px,4vw,44px)]" />
        <span className="font-logo font-semibold text-[clamp(1rem,2.5vw,1.5rem)] text-brand-red leading-relaxed">UONotes</span>
      </Link>
      
      <div className="hidden sm:flex gap-6 flex-1">
        <Link href="/" className="text-sm text-brand-red font-medium transition-colors">Home</Link>
        <Link href="/notes" className="text-sm text-brand-body hover:text-brand-red transition-colors">Notes</Link>
        <Link href="/about" className="text-sm text-brand-body hover:text-brand-red transition-colors">About</Link>
        <Link href="/sponsors" className="text-sm text-brand-body hover:text-brand-red transition-colors">Sponsors</Link>
        <Link href="/contact" className="text-sm text-brand-body hover:text-brand-red transition-colors">Contact</Link>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        <button onClick={toggleLang} className="text-xs text-brand-body bg-brand-surface border border-brand-border-light rounded px-2.5 py-1.5">
          {lang} / {lang === "EN" ? "FR" : "EN"}
        </button>
        <Link href="/signin" className="btn-primary">Sign in</Link>
      </div>
    </nav>
  );
}