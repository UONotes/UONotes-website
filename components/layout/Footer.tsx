import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="px-6 py-10">
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
            <Link href="/sponsors" className="text-sm text-brand-body hover:text-brand-red transition-colors">Sponsors</Link>
            <Link href="/contact" className="text-sm text-brand-body hover:text-brand-red transition-colors">Contact us</Link>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm text-brand-body leading-relaxed">75 Laurier Ave E<br/>Ottawa, ON, K1N 6N5</p>
            <a href="mailto:uofnotes@gmail.com" className="text-sm text-brand-red font-medium hover:text-brand-red-hover transition-colors">uofnotes@gmail.com</a>
            <div className="flex items-center gap-3 mt-1.5">
              <a href="#" aria-label="Instagram" className="opacity-80 hover:opacity-100 transition-opacity">
                <Image src="/icons/Icon.svg" alt="" width={20} height={20} />
              </a>
              <a href="#" aria-label="TikTok" className="opacity-80 hover:opacity-100 transition-opacity">
                <Image src="/images/tiktok.png" alt="" width={18} height={20} />
              </a>
              <a href="#" aria-label="LinkedIn" className="opacity-80 hover:opacity-100 transition-opacity">
                <Image src="/icons/linkedin.svg" alt="" width={20} height={20} />
              </a>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}