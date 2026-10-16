"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

// ─── Footer content (edit here) ──────────────────────────────────────────────
const EXPLORE_LINKS = [
  { name: "Home", href: "/" },
  { name: "View notes", href: "/notes" },
  { name: "My dashboard", href: "/dashboard" },
  { name: "Submit notes", href: "/submit" },
];
const CLUB_LINKS = [
  { name: "About", href: "/about" },
  { name: "Events", href: "/events" },
  { name: "Contact us", href: "/contact" },
];
const EMAIL = "uofonotes@gmail.com";
const ADDRESS = ["75 Laurier Ave E", "Ottawa, ON, K1N 6N5"];
const SOCIALS = [
  {
    name: "Instagram",
    href: "https://www.instagram.com/uonotes/",
    path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z",
  },
  {
    name: "TikTok",
    href: "https://www.tiktok.com/@uo_notes",
    path: "M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z",
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/company/uonotes/",
    path: "M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z",
  },
];
// ─────────────────────────────────────────────────────────────────────────────

// Same typewriter-capitals lettering as the navbar
const HEADING = "mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-brand-red";
const LINK = "w-fit text-sm text-brand-body transition-colors hover:text-brand-red";

export function Footer() {
  const pathname = usePathname();

  // Hide the footer on these routes (and anything under them)
  const hiddenRoutes = ["/admin", "/contact", "/signin", "/signup", "/forgot-password"];
  if (hiddenRoutes.some((route) => pathname.startsWith(route))) {
    return null;
  }

  return (
    // Even space on both sides; on wide screens it also clears the binder edge (red margin line) from globals.css
    <footer className="shrink-0 border-t border-brand-red/25 px-6 pb-8 pt-12 sm:px-10 lg:px-16 min-[1360px]:px-[var(--content-left,4rem)]">
      <div className="mx-auto grid max-w-site grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,1.3fr)] md:gap-8">
        {/* Logo + tagline */}
        <div className="col-span-2 md:col-span-1">
          <Link href="/" className="flex w-fit items-center gap-3">
            <Image src="/logo.png" alt="" width={160} height={160} sizes="96px" quality={95} className="h-10 w-auto object-contain" />
            <span className="flex flex-col">
              <span className="font-logo text-[1.4rem] font-black leading-none tracking-tight text-brand-red">UONotes</span>
              <span className="mt-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">{"// uOttawa"}</span>
            </span>
          </Link>
          <p className="mt-4 max-w-[16rem] text-sm leading-relaxed text-brand-body">Notes made by students, for students.</p>
        </div>

        {/* Explore */}
        <nav aria-label="Explore">
          <p className={HEADING}>Explore</p>
          <ul className="flex flex-col gap-2.5">
            {EXPLORE_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={LINK}>
                  {l.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Club */}
        <nav aria-label="The club">
          <p className={HEADING}>The club</p>
          <ul className="flex flex-col gap-2.5">
            {CLUB_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={LINK}>
                  {l.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Find us */}
        <div className="col-span-2 md:col-span-1">
          <p className={HEADING}>Find us</p>
          <address className="flex flex-col gap-2.5 not-italic">
            <span className="text-sm leading-relaxed text-brand-body">
              {ADDRESS[0]}
              <br />
              {ADDRESS[1]}
            </span>
            <a href={`mailto:${EMAIL}`} className={LINK}>
              {/* If it has to wrap on a narrow column, break after the @ rather than mid-word */}
              {EMAIL.split("@")[0]}@<wbr />
              {EMAIL.split("@")[1]}
            </a>
          </address>
          {/* Socials as little dashed stamps */}
          <div className="mt-4 flex gap-2">
            {SOCIALS.map((s) => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`UONotes on ${s.name}`}
                title={s.name}
                className="flex h-9 w-9 items-center justify-center border-2 border-dashed border-brand-red/40 text-brand-red transition-colors hover:border-solid hover:border-brand-red hover:bg-brand-red hover:text-white"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                  <path d={s.path} />
                </svg>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom line */}
      <div className="mx-auto mt-10 flex max-w-site flex-col gap-2 border-t border-dashed border-brand-red/20 pt-5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 sm:flex-row sm:items-center sm:justify-between">
        <span>&copy; {new Date().getFullYear()} UONotes</span>
        <span>Built by the UONotes team</span>
      </div>
    </footer>
  );
}