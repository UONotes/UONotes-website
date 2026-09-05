"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AccountMenu } from "@/components/layout/AccountMenu";
import { createClient } from "@/lib/supabase/client";
import { ShieldAlert, X, Menu } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  
  const isAdminOrStandalone = 
    pathname.startsWith("/admin")

  const [lang, setLang] = useState<"EN" | "FR">("EN");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function loadAuthState(userId: string | undefined) {
      if (!userId) {
        setIsLoggedIn(false);
        setIsAdmin(false);
        return;
      }
      setIsLoggedIn(true);

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", userId)
        .single();

      setIsAdmin(profile?.is_admin ?? false);
    }

    supabase.auth.getUser().then(({ data }) => loadAuthState(data.user?.id));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      loadAuthState(session?.user?.id);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  if (isAdminOrStandalone) {
    return null;
  }

  const signInHref = pathname === "/signin"
    ? "/signin"
    : `/signin?from=${encodeURIComponent(pathname)}`;

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Notes", href: "/notes" },
    { name: "About", href: "/about" },
    { name: "Events", href: "/events" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full bg-transparent backdrop-blur-[2px] border-b border-brand-red/10 relative z-50 shrink-0"
    >
      <nav className="flex w-full items-center justify-between px-6 lg:px-12 py-4">
        
        {/* 1. Logo Section (Pinned Far Left) */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-3 group"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <motion.div whileHover={{ rotate: -5, scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
            <Image
              src="/logo.png"
              alt="UONotes Logo"
              width={38}
              height={38}
              className="object-contain w-auto h-[34px] sm:h-[40px] drop-shadow-sm"
              priority
            />
          </motion.div>
          <div className="flex flex-col">
            <span className="font-logo font-black text-lg sm:text-[1.4rem] text-brand-red tracking-tight leading-none">
              UONotes
            </span>
            <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-gray-400 font-bold hidden sm:block mt-0.5">
              // uOttawa
            </span>
          </div>
        </Link>

        {/* 2. Desktop Layout Right-Side Container (Navigation Capsule + Profile Controls) */}
        <div className="hidden sm:flex items-center gap-6">
          
          {/* Fully See-Through Pill Navigation */}
          <div className="flex items-center bg-white/10 backdrop-blur-md border border-brand-red/15 rounded-full p-1.5 shadow-[0_4px_16px_rgba(0,0,0,0.02)] relative">
            {navLinks.map((link) => {
              const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`relative px-6 py-2.5 font-logo text-xs font-bold uppercase tracking-wider transition-colors duration-200 z-10 ${
                    isActive ? "text-white" : "text-brand-body hover:text-brand-red"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="true-ios-glass-nav-pill"
                      className="absolute inset-0 bg-brand-red rounded-full shadow-none -z-10"
                      transition={{ type: "spring", stiffness: 500, damping: 40, mass: 0.5 }}
                    />
                  )}
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* Desktop Actions (Sign in or Account Menu) */}
          <div className="flex items-center">
            {isLoggedIn ? (
               <AccountMenu 
                 lang={lang} 
                 toggleLang={() => setLang((prev) => (prev === "EN" ? "FR" : "EN"))} 
                 onSignOut={handleSignOut}
                 isAdmin={isAdmin}
               />
            ) : (
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href={signInHref}
                  className="flex h-10 min-w-[100px] items-center justify-center rounded-full border border-brand-red/20 bg-brand-red px-6 font-logo text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-brand-red-hover shadow-xs"
                >
                  Sign in
                </Link>
              </motion.div>
            )}
          </div>
        </div>

        {/* 3. Mobile Actions & Trigger Container */}
        <div className="flex sm:hidden items-center gap-2 ml-auto">
          {isLoggedIn && (
            <div className="scale-90">
              <AccountMenu 
                lang={lang} 
                toggleLang={() => setLang((prev) => (prev === "EN" ? "FR" : "EN"))} 
                onSignOut={handleSignOut}
                isAdmin={isAdmin}
              />
            </div>
          )}

          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-brand-red p-2.5 min-h-[42px] min-w-[42px] flex items-center justify-center bg-white/10 backdrop-blur-md rounded-full border border-brand-red/15 shadow-xs active:scale-95 transition-transform"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-brand-red" />
            ) : (
              <Menu className="w-5 h-5 text-brand-red" />
            )}
          </button>
        </div>
      </nav>

      {/* 4. Fully Optimized Mobile Dropdown Sheet */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="sm:hidden overflow-hidden bg-[#fdfafb]/90 backdrop-blur-xl border-t border-brand-red/15 absolute w-full left-0 top-full shadow-2xl"
          >
            <div className="flex flex-col py-6 px-6 gap-3">
              
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 px-2 pb-1">
                // NAVIGATION
              </span>

              {navLinks.map((link) => {
                const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`w-full py-3 px-4 rounded-2xl font-logo text-sm font-bold uppercase tracking-wider transition-all duration-200 flex items-center justify-between ${
                      isActive 
                        ? "bg-brand-red text-white shadow-xs" 
                        : "text-brand-body bg-white/30 border border-brand-red/10 hover:bg-brand-red/5 hover:text-brand-red"
                    }`}
                  >
                    <span>{link.name}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-white" : "bg-brand-red/30"}`} />
                  </Link>
                );
              })}

              {isLoggedIn && (
                <>
                  <div className="w-full h-px bg-brand-red/15 my-2" />
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 px-2 pb-1">
                    // WORKSPACE
                  </span>
                  
                  <Link 
                    href="/dashboard" 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    className="w-full py-3 px-4 rounded-2xl font-logo text-sm font-bold uppercase tracking-wider text-brand-red bg-brand-red/5 border border-brand-red/15 flex items-center justify-between"
                  >
                    <span>My Dashboard</span>
                  </Link>
                  <Link 
                    href="/submit" 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    className="w-full py-3 px-4 rounded-2xl font-logo text-sm font-bold uppercase tracking-wider text-brand-body bg-white/30 border border-brand-red/10 flex items-center justify-between"
                  >
                    <span>Submit Notes</span>
                  </Link>
                  <Link 
                    href="/settings" 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    className="w-full py-3 px-4 rounded-2xl font-logo text-sm font-bold uppercase tracking-wider text-brand-body bg-white/30 border border-brand-red/10 flex items-center justify-between"
                  >
                    <span>Settings</span>
                  </Link>
                  
                  {isAdmin && (
                    <Link 
                      href="/admin" 
                      onClick={() => setIsMobileMenuOpen(false)} 
                      className="flex items-center justify-center gap-2 w-full py-3.5 mt-1 bg-gray-900 text-white rounded-2xl font-logo text-xs font-bold uppercase tracking-wider shadow-xs"
                    >
                      <ShieldAlert className="w-4 h-4 text-brand-red" />
                      Admin Console
                    </Link>
                  )}
                </>
              )}
              
              {!isLoggedIn && (
                <div className="pt-2 w-full">
                  <Link
                    href={signInHref}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full h-12 flex items-center justify-center rounded-2xl bg-brand-red font-logo text-xs font-bold uppercase tracking-widest text-white shadow-xs"
                  >
                    Sign in to Account
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  ); 
}