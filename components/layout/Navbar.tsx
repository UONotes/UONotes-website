"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AccountMenu } from "@/components/layout/AccountMenu";

export function Navbar() {
  const [lang, setLang] = useState<"EN" | "FR">("EN");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  // TODO: Replace this hardcoded boolean with your actual authentication provider hook
  const isLoggedIn = false;

  const toggleLang = () => setLang((prev) => (prev === "EN" ? "FR" : "EN"));
  const pathname = usePathname();

  const signInHref = pathname === "/signin"
    ? "/signin"
    : `/signin?from=${encodeURIComponent(pathname)}`;

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Notes", href: "/notes" },
    { name: "About", href: "/about" },
    { name: "Sponsors", href: "/sponsors" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full border-b-2 border-white relative z-50"
    >
      <nav className="flex max-w-site items-center justify-between mx-auto px-6 py-4">
        
        {/* 1. Logo Section */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 group"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <motion.div whileHover={{ rotate: -5, scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
            <Image
              src="/logo.png"
              alt="UONotes Logo"
              width={44}
              height={44}
              className="object-contain w-auto h-[clamp(28px,4vw,44px)]"
              priority
            />
          </motion.div>
          <span className="font-logo font-semibold text-[clamp(1rem,2.5vw,1.5rem)] text-brand-red leading-relaxed">
            UONotes
          </span>
        </Link>

        {/* 2. Desktop Navigation Links */}
        <div 
          className="hidden sm:flex items-center gap-2 ml-auto"
          onMouseLeave={() => setHoveredLink(null)}
        >
          {navLinks.map((link) => {
            const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            const isHovered = hoveredLink === link.name;

            return (
              <Link
                key={link.name}
                href={link.href}
                onMouseEnter={() => setHoveredLink(link.name)}
                className={`relative px-4 py-2 font-logo text-[17px] font-semibold transition-colors duration-200 z-10 ${
                  isActive
                    ? "text-brand-red italic"
                    : "text-brand-body hover:text-brand-red"
                }`}
              >
                {link.name}

                {/* Floating Hover / Active Pill */}
                {(isHovered || (isActive && !hoveredLink)) && (
                  <motion.div
                    layoutId="navbar-floating-pill"
                    className={`absolute inset-0 rounded-full -z-10 ${
                      isActive && !hoveredLink
                        ? "bg-brand-red/10 border border-brand-red/20 shadow-sm" 
                        : "bg-brand-pink/70 shadow-md border border-brand-red/10"   
                    }`}
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* 3. Desktop Actions */}
        <div className="hidden sm:flex items-center gap-6 ml-6">
          
          {/* SLIDING SEGMENTED CONTROL (DESKTOP) */}
          <div className="relative flex items-center bg-[#fdfafb] border border-brand-red/20 rounded-md p-1 h-9 w-[100px] shrink-0 shadow-inner">
            {(["EN", "FR"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`relative flex-1 flex items-center justify-center h-full text-sm font-logo font-semibold z-10 transition-colors duration-200 ${
                  lang === l ? "text-white" : "text-brand-red hover:text-brand-red/70"
                }`}
              >
                {lang === l && (
                  <motion.div
                    layoutId="desktop-lang-pill"
                    className="absolute inset-0 bg-brand-red rounded shadow-sm -z-10"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                {l}
              </button>
            ))}
          </div>

          {/* AUTHENTICATION LOGIC */}
          {isLoggedIn ? (
             <AccountMenu 
               lang={lang} 
               toggleLang={toggleLang} 
               onSignOut={() => console.log("User signed out")} 
             />
          ) : (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href={signInHref}
                className="flex h-9 min-w-[92px] items-center justify-center rounded border border-transparent bg-brand-red px-4 font-logo text-sm font-semibold text-white transition-colors hover:bg-brand-red-hover shadow-sm"
              >
                Sign in
              </Link>
            </motion.div>
          )}
        </div>

        {/* 4. Mobile Hamburger Button */}
        <div className="flex sm:hidden ml-auto">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-brand-red p-2"
            aria-label="Toggle mobile menu"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* 5. Mobile Dropdown Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="sm:hidden overflow-hidden bg-[#fdfafb] border-t border-brand-border-light absolute w-full left-0 top-full shadow-xl"
          >
            <div className="flex flex-col items-center py-6 gap-6">
              {navLinks.map((link) => {
                const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`font-logo text-lg font-semibold transition-colors duration-200 ${
                      isActive ? "text-brand-red italic" : "text-brand-body"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
              
              <div className="flex gap-4 mt-2">
                
                {/* SLIDING SEGMENTED CONTROL (MOBILE) */}
                <div className="relative flex items-center bg-[#fdfafb] border border-brand-red/20 rounded-md p-1 h-10 w-[120px] shrink-0 shadow-inner">
                  {(["EN", "FR"] as const).map((l) => (
                    <button
                      key={l}
                      onClick={() => setLang(l)}
                      className={`relative flex-1 flex items-center justify-center h-full text-base font-logo font-semibold z-10 transition-colors duration-200 ${
                        lang === l ? "text-white" : "text-brand-red hover:text-brand-red/70"
                      }`}
                    >
                      {lang === l && (
                        <motion.div
                          layoutId="mobile-lang-pill"
                          className="absolute inset-0 bg-brand-red rounded shadow-sm -z-10"
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      )}
                      {l}
                    </button>
                  ))}
                </div>
                
                {/* MOBILE AUTHENTICATION LOGIC */}
                {isLoggedIn ? (
                  <button
                    onClick={() => { setIsMobileMenuOpen(false); console.log("User signed out"); }}
                    className="flex h-10 min-w-[100px] items-center justify-center rounded border border-transparent bg-brand-red px-4 font-logo text-base font-semibold text-white transition-colors hover:bg-brand-red-hover shadow-sm"
                  >
                    Sign out
                  </button>
                ) : (
                  <Link
                    href={signInHref}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex h-10 min-w-[100px] items-center justify-center rounded border border-transparent bg-brand-red px-4 font-logo text-base font-semibold text-white transition-colors hover:bg-brand-red-hover shadow-sm"
                  >
                    Sign in
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}