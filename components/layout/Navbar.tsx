"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AccountMenu } from "@/components/layout/AccountMenu";
import { createClient } from "@/lib/supabase/client";
import { ShieldAlert, X, Menu } from "lucide-react";

// ─── "Rubber stamp" styles ───────────────────────────────────────────────────
// Every link is set in typewriter capitals; the current page is stamped in solid red.
const STAMP_TEXT = "font-mono font-bold uppercase tracking-[0.16em]";
// The red stamp itself (with a faint inner rim, like the edge of a rubber stamp)
const STAMP_INK = "bg-brand-red shadow-[inset_0_0_0_2px_rgba(255,240,240,0.35)]";

export function Navbar() {
  const pathname = usePathname();

  const isAdminOrStandalone = pathname.startsWith("/admin");

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

      const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", userId).single();

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

  const signInHref = pathname === "/signin" ? "/signin" : `/signin?from=${encodeURIComponent(pathname)}`;

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Notes", href: "/notes" },
    { name: "About", href: "/about" },
    { name: "Events", href: "/events" },
    { name: "Contact", href: "/contact" },
  ];

  const isActiveLink = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const toggleLang = () => setLang((prev) => (prev === "EN" ? "FR" : "EN"));
  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-50 w-full shrink-0 border-b border-brand-red/25 bg-transparent"
    >
      {/* Even space on both sides; on wide screens it also clears the binder edge (red margin line) from globals.css */}
      <nav className="flex w-full items-center justify-between px-6 py-4 sm:px-10 sm:py-6 lg:px-16 min-[1360px]:px-[var(--content-left,4rem)]">
        {/* 1. Logo */}
        <Link href="/" className="group flex shrink-0 items-center gap-3" onClick={closeMenu}>
          <motion.div whileHover={{ rotate: -5, scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
            <Image
              src="/logo.png"
              alt="UONotes Logo"
              width={160}
              height={160}
              sizes="96px"
              quality={95}
              className="h-[42px] w-auto object-contain sm:h-[54px]"
              priority
            />
          </motion.div>
          <div className="flex flex-col">
            <span className="font-logo text-[1.3rem] font-black leading-none tracking-tight text-brand-red sm:text-[1.8rem]">UONotes</span>
            <span className="mt-1 hidden font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 sm:block">
              {"// uOttawa"}
            </span>
          </div>
        </Link>

        {/* 2. Laptop/desktop (1024px+): stamped links + sign in / account */}
        <div className="hidden items-center gap-6 lg:flex xl:gap-10">
          <div className="flex items-center gap-1 xl:gap-2">
            {navLinks.map((link) => {
              const isActive = isActiveLink(link.href);
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`group relative px-3 py-3 text-[13px] transition-colors duration-200 xl:px-[18px] xl:text-[15px] ${STAMP_TEXT} ${
                    isActive ? "text-white" : "text-[#1f2a44] hover:text-brand-red"
                  }`}
                >
                  {/* The red stamp slides to whichever page you're on */}
                  {isActive && (
                    <motion.span
                      layoutId="nav-stamp"
                      className={`absolute inset-0 -z-10 ${STAMP_INK}`}
                      transition={{ type: "spring", stiffness: 500, damping: 32, mass: 0.6 }}
                    />
                  )}
                  {/* Dashed outline on hover for the other pages */}
                  {!isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 -z-10 border-2 border-dashed border-brand-red/0 transition-colors duration-200 group-hover:border-brand-red/35"
                    />
                  )}
                  <span className="relative">{link.name}</span>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center">
            {isLoggedIn ? (
              <AccountMenu lang={lang} toggleLang={toggleLang} onSignOut={handleSignOut} isAdmin={isAdmin} />
            ) : (
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href={signInHref}
                  className={`flex items-center justify-center whitespace-nowrap border-2 border-dashed border-brand-red px-4 py-2.5 text-[13px] xl:px-5 xl:text-[15px] text-brand-red transition-colors hover:border-solid hover:bg-brand-red hover:text-white ${STAMP_TEXT}`}
                >
                  Sign in &rarr;
                </Link>
              </motion.div>
            )}
          </div>
        </div>

        {/* 3. Phones & tablets: account + menu button */}
        <div className="ml-auto flex items-center gap-2 lg:hidden">
          {isLoggedIn && (
            <div className="scale-90">
              <AccountMenu lang={lang} toggleLang={toggleLang} onSignOut={handleSignOut} isAdmin={isAdmin} />
            </div>
          )}

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex min-h-[46px] min-w-[46px] items-center justify-center border-2 border-dashed border-brand-red/40 p-2.5 text-brand-red transition-transform active:scale-95"
            aria-label="Toggle mobile menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* 4. Phone/tablet menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-0 top-full w-full overflow-hidden border-b border-brand-red/25 bg-[#fffdf8] shadow-2xl lg:hidden"
          >
            <div className="flex flex-col px-6 py-5 sm:px-10">
              <span className="px-1 pb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-gray-400">{"// NAVIGATION"}</span>

              {navLinks.map((link) => {
                const isActive = isActiveLink(link.href);
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={closeMenu}
                    aria-current={isActive ? "page" : undefined}
                    className="flex items-center justify-between border-b border-dashed border-brand-red/20 py-2.5"
                  >
                    <span
                      className={`inline-block px-3.5 py-2.5 text-base ${STAMP_TEXT} ${isActive ? `text-white ${STAMP_INK}` : "text-[#1f2a44]"}`}
                    >
                      {link.name}
                    </span>
                    <span aria-hidden="true" className={`text-sm ${isActive ? "text-brand-red" : "text-brand-red/30"}`}>
                      &rarr;
                    </span>
                  </Link>
                );
              })}

              {isLoggedIn && (
                <>
                  <span className="px-1 pb-2 pt-5 font-mono text-[10px] uppercase tracking-[0.2em] text-gray-400">{"// WORKSPACE"}</span>
                  {[
                    { name: "My Dashboard", href: "/dashboard" },
                    { name: "Submit Notes", href: "/submit" },
                    { name: "Settings", href: "/settings" },
                  ].map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={closeMenu}
                      className="flex items-center justify-between border-b border-dashed border-brand-red/20 py-2.5"
                    >
                      <span className={`inline-block px-3.5 py-2.5 text-base text-[#1f2a44] ${STAMP_TEXT}`}>{link.name}</span>
                      <span aria-hidden="true" className="text-sm text-brand-red/30">
                        &rarr;
                      </span>
                    </Link>
                  ))}

                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={closeMenu}
                      className={`mt-4 flex w-full items-center justify-center gap-2 bg-gray-900 py-3.5 text-xs text-white shadow-[inset_0_0_0_2px_rgba(255,255,255,0.15)] ${STAMP_TEXT}`}
                    >
                      <ShieldAlert className="h-4 w-4 text-brand-red" />
                      Admin Console
                    </Link>
                  )}
                </>
              )}

              {!isLoggedIn && (
                <Link
                  href={signInHref}
                  onClick={closeMenu}
                  className={`mt-5 flex h-12 w-full items-center justify-center border-2 border-dashed border-brand-red text-xs text-brand-red transition-colors active:bg-brand-red active:text-white ${STAMP_TEXT}`}
                >
                  Sign in to account &rarr;
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}