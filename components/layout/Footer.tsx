"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();

  // Automatically hide the global footer on admin pages
  const isAdminRoute = pathname.startsWith("/admin");

  if (isAdminRoute) {
    return null;
  }

  return (
    <footer className="px-6 py-10 shrink-0">
      <div className="max-w-site mx-auto py-10 border-t-2 border-brand-red grid grid-cols-1 md:grid-cols-[160px_1fr] gap-12 items-start">
        
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="" width={44} height={44} className="object-contain w-auto h-[clamp(24px,3vw,36px)]" />
          <span className="font-logo font-semibold text-[clamp(0.9rem,2vw,1.25rem)] text-brand-red">UONotes</span>
        </Link>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          <div className="flex flex-col gap-2">
            <Link href="/" className="text-sm text-brand-body hover:text-brand-red transition-colors">Home</Link>
            <Link href="/notes" className="text-sm text-brand-body hover:text-brand-red transition-colors">View notes</Link>
            <Link href="/dashboard" className="text-sm text-brand-body hover:text-brand-red transition-colors">My dashboard</Link>
            <Link href="/submit" className="text-sm text-brand-body hover:text-brand-red transition-colors">Submit notes</Link>
          </div>
          
          <div className="flex flex-col gap-2">
            <Link href="/about" className="text-sm text-brand-body hover:text-brand-red transition-colors">About</Link>
            <Link href="/events" className="text-sm text-brand-body hover:text-brand-red transition-colors">Events</Link>
            <Link href="/contact" className="text-sm text-brand-body hover:text-brand-red transition-colors">Contact us</Link>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm text-brand-body leading-relaxed">75 Laurier Ave E<br/>Ottawa, ON, K1N 6N5</p>
            <a href="mailto:uofonotes@gmail.com" className="text-sm text-brand-body hover:text-brand-red transition-colors">uofonotes@gmail.com</a>
            <div className="flex gap-3 mt-1.5">
              <a 
                href="https://www.instagram.com/uonotes/?hl=en" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-xs font-semibold text-brand-muted hover:text-brand-red transition-colors"
              >
                Instagram
              </a>
              <a 
                href="https://www.tiktok.com/@uo_notes" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-xs font-semibold text-brand-muted hover:text-brand-red transition-colors"
              >
                TikTok
              </a>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}