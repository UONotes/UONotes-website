"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AccountMenu } from "./AccountMenu";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/notes", label: "Notes" },
  { href: "/about", label: "About" },
  { href: "/sponsors", label: "Sponsors" },
  { href: "/contact", label: "Contact Us" },
];

export function Navbar() {
  const [lang, setLang] = useState<"EN" | "FR">("EN");
  const toggleLang = () => setLang(prev => prev === "EN" ? "FR" : "EN");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-8 max-w-site mx-auto px-6 py-4">
      <Link href="/" className="flex items-center gap-2">
        <Image src="/logo.png" alt="" width={44} height={44} className="object-contain w-auto h-[clamp(28px,4vw,44px)]" />
        <span className="font-logo font-semibold text-[clamp(1rem,2.5vw,1.5rem)] text-brand-red leading-relaxed">UONotes</span>
      </Link>

      <div className="hidden sm:flex gap-6 flex-1">
        {navLinks.map(({ href, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={
                active
                  ? "font-logo italic font-bold text-base text-brand-red transition-colors"
                  : "font-logo font-bold text-base text-brand-dark hover:text-brand-red transition-colors"
              }
            >
              {label}
            </Link>
          );
        })}
      </div>

      <div className="flex items-center gap-3 ml-auto">
        {isLoggedIn ? (
          <AccountMenu lang={lang} toggleLang={toggleLang} onSignOut={() => setIsLoggedIn(false)} />
        ) : (
          <>
            <button onClick={toggleLang} className="text-sm font-semibold text-brand-red bg-white border border-brand-red rounded-md px-4 py-2 hover:bg-brand-pink transition-colors">
              {lang} / {lang === "EN" ? "FR" : "EN"}
            </button>
            <button onClick={() => setIsLoggedIn(true)} className="btn-primary !text-sm !px-6 !py-2">Sign in</button>
          </>
        )}
      </div>
    </nav>
  );
}