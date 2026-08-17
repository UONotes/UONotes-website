"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export function Navbar() {
  const [lang, setLang] = useState<"EN" | "FR">("EN");

  const toggleLang = () =>
    setLang(prev => prev === "EN" ? "FR" : "EN");

  const pathname = usePathname();

  const signInHref = pathname === "/signin"
    ? "/signin"
    : `/signin?from=${encodeURIComponent(pathname)}`;

  const navLinkClass = (href: string) => {
    const isActive =
      href === "/"
        ? pathname === "/"
        : pathname.startsWith(href);

    return `font-logo text-[17px] font-semibold transition-colors hover:text-brand-red ${
      isActive
        ? "text-brand-red italic"
        : "text-brand-body"
    }`;
  };

  return (
    <header className="w-full border-b-2 border-white">
      <nav className="flex max-w-site items-center mx-auto px-6 py-4">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2"
        >
          <Image
            src="/logo.png"
            alt=""
            width={44}
            height={44}
            className="object-contain w-auto h-[clamp(28px,4vw,44px)]"
          />

          <span className="font-logo font-semibold text-[clamp(1rem,2.5vw,1.5rem)] text-brand-red leading-relaxed">
            UONotes
          </span>
        </Link>

        <div className="hidden sm:flex items-center gap-10 ml-auto">
          <Link href="/" className={navLinkClass("/")}>
            Home
          </Link>

          <Link href="/notes" className={navLinkClass("/notes")}>
            Notes
          </Link>

          <Link href="/about" className={navLinkClass("/about")}>
            About
          </Link>

          <Link
            href="/sponsors"
            className={navLinkClass("/sponsors")}
          >
            Sponsors
          </Link>

          <Link
            href="/contact"
            className={navLinkClass("/contact")}
          >
            Contact
          </Link>
        </div>

        <div className="flex items-center gap-2 ml-10">
          <button
            onClick={toggleLang}
            className="flex h-9 min-w-[92px] items-center justify-center rounded border border-brand-red bg-transparent px-4 font-logo text-sm font-semibold text-brand-red transition-colors hover:bg-white/40"
          >
            {lang} / {lang === "EN" ? "FR" : "EN"}
          </button>

          <Link
            href={signInHref}
            className="flex h-9 min-w-[92px] items-center justify-center rounded bg-brand-red px-4 font-logo text-sm font-semibold text-white transition-colors hover:bg-brand-red-hover"
          >
            Sign in
          </Link>
        </div>
      </nav>
    </header>
  );
}