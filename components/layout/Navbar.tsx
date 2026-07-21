"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export function Navbar() {
  // Placeholder for future auth context/session (e.g., next-auth or supabase)
  const [isSignedIn, setIsSignedIn] = useState(false); 
  
  // Placeholder for i18n state
  const [lang, setLang] = useState<"EN" | "FR">("EN");

  const toggleLang = () => setLang(prev => prev === "EN" ? "FR" : "EN");

  return (
    <nav className="navbar">
      <Link href="/" className="nav-logo">
        <Image src="/logo.png" alt="UONotes" width={44} height={44} style={{ objectFit: "contain", width: "auto", height: "clamp(28px, 4vw, 44px)" }} />
        <span className="nav-logo-text">UONotes</span>
      </Link>
      <div className="nav-links">
        <Link href="/" className="nav-link active">Home</Link>
        <Link href="/notes" className="nav-link">Notes</Link>
        <Link href="/about" className="nav-link">About</Link>
        <Link href="/sponsors" className="nav-link">Sponsors</Link>
        <Link href="/contact" className="nav-link">Contact</Link>
      </div>
      <div className="nav-right">
        <button onClick={toggleLang} className="lang-toggle">
          {lang} / {lang === "EN" ? "FR" : "EN"}
        </button>
        
        {isSignedIn ? (
          <Link href="/dashboard" className="btn-primary">Dashboard</Link>
        ) : (
          <Link href="/signin" className="btn-primary">Sign in</Link>
        )}
      </div>
    </nav>
  );
}