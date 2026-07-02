"use client";

// app/page.tsx — UONotes Homepage (Next.js 15 App Router)

import Image from "next/image";
import Link from "next/link";
import Marquee from "react-fast-marquee";

// ─── Inline SVG helpers ───────────────────────────────────────────────────────

function FileTextIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 87 87" fill="none" aria-hidden>
      <path d="M72.5 29L50.75 7.25H21.75C19.8272 7.25 17.9831 8.01384 16.6235 9.37348C15.2638 10.7331 14.5 12.5772 14.5 14.5V72.5C14.5 74.4228 15.2638 76.2669 16.6235 77.6265C17.9831 78.9862 19.8272 79.75 21.75 79.75H65.25C67.1728 79.75 69.0169 78.9862 70.3765 77.6265C71.7362 76.2669 72.5 74.4228 72.5 72.5V29ZM50.75 7.25V29H72.5M58 47.125H29M58 61.625H29M36.25 32.625H29"
        stroke="#8F0018" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 87 87" fill="none" aria-hidden>
      <path d="M43.5 72.5H76.125M59.8125 12.6875C61.2546 11.2454 63.2105 10.4352 65.25 10.4352C66.2598 10.4352 67.2598 10.6341 68.1928 11.0206C69.1257 11.407 69.9734 11.9735 70.6875 12.6875C71.4016 13.4016 71.968 14.2493 72.3544 15.1823C72.7409 16.1152 72.9398 17.1152 72.9398 18.125C72.9398 19.1349 72.7409 20.1348 72.3544 21.0678C71.968 22.0007 71.4016 22.8485 70.6875 23.5625L25.375 68.875L10.875 72.5L14.5 58L59.8125 12.6875Z"
        stroke="#8F0018" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 87 87" fill="none" aria-hidden>
      <path d="M43.5 7.25L54.7013 29.9425L79.75 33.6038L61.625 51.2575L65.9025 76.1975L43.5 64.4163L21.0975 76.1975L25.375 51.2575L7.25 33.6038L32.2987 29.9425L43.5 7.25Z"
        stroke="#8F0018" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="120" height="15" viewBox="0 0 182 15" fill="none" aria-hidden className="step-arrow">
      <path d="M1 6.364H0V8.364H1V7.364V6.364ZM181.707 8.071C182.098 7.681 182.098 7.047 181.707 6.657L175.343 0.293C174.953-0.098 174.319-0.098 173.929 0.293C173.538 0.683 173.538 1.317 173.929 1.707L179.586 7.364L173.929 13.021C173.538 13.411 173.538 14.045 173.929 14.435C174.319 14.826 174.953 14.826 175.343 14.435L181.707 8.071ZM1 7.364V8.364H181V7.364V6.364H1V7.364Z"
        fill="#8F0018" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <g clipPath="url(#eye-clip)">
        <path d="M0.667 8C0.667 8 3.333 2.667 8 2.667C12.667 2.667 15.333 8 15.333 8C15.333 8 12.667 13.333 8 13.333C3.333 13.333 0.667 8 0.667 8Z"
          stroke="#2A2A2A" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 10C9.105 10 10 9.105 10 8C10 6.895 9.105 6 8 6C6.895 6 6 6.895 6 8C6 9.105 6.895 10 8 10Z"
          stroke="#2A2A2A" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <defs><clipPath id="eye-clip"><rect width="16" height="16" fill="white" /></clipPath></defs>
    </svg>
  );
}

function BookmarkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M12.667 14L8 10.667L3.333 14V3.333C3.333 2.98 3.474 2.641 3.724 2.391C3.974 2.14 4.313 2 4.667 2H11.333C11.687 2 12.026 2.14 12.276 2.391C12.526 2.641 12.667 2.98 12.667 3.333V14Z"
        stroke="#1E1E1E" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BookOpenIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 60 60" fill="none" aria-hidden>
      <path d="M30 17.5C30 14.848 28.946 12.304 27.071 10.429C25.196 8.554 22.652 7.5 20 7.5H5V45H22.5C24.489 45 26.397 45.79 27.803 47.197C29.21 48.603 30 50.511 30 52.5M30 17.5V52.5M30 17.5C30 14.848 31.054 12.304 32.929 10.429C34.804 8.554 37.348 7.5 40 7.5H55V45H37.5C35.511 45 33.603 45.79 32.197 47.197C30.79 48.603 30 50.511 30 52.5"
        stroke="#8F0018" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="48" height="32" viewBox="0 0 60 60" fill="none" aria-hidden>
      <path d="M42.5 52.5V47.5C42.5 44.848 41.446 42.304 39.571 40.429C37.696 38.554 35.152 37.5 32.5 37.5H12.5C9.848 37.5 7.304 38.554 5.429 40.429C3.554 42.304 2.5 44.848 2.5 47.5V52.5M57.5 52.5V47.5C57.498 45.284 56.761 43.132 55.403 41.381C54.046 39.63 52.145 38.379 50 37.825M40 7.825C42.151 8.376 44.058 9.627 45.419 11.381C46.781 13.135 47.52 15.292 47.52 17.513C47.52 19.733 46.781 21.89 45.419 23.644C44.058 25.398 42.151 26.649 40 27.2M32.5 17.5C32.5 23.023 28.023 27.5 22.5 27.5C16.977 27.5 12.5 23.023 12.5 17.5C12.5 11.977 16.977 7.5 22.5 7.5C28.023 7.5 32.5 11.977 32.5 17.5Z"
        stroke="#8F0018" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrendingUpIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 60 60" fill="none" aria-hidden>
      <path d="M57.5 15L33.75 38.75L21.25 26.25L2.5 45M57.5 30V15H42.5"
        stroke="#8F0018" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar() {
  return (
    <nav className="navbar">
      <Link href="/" className="nav-logo">
        <Image src="/logo.png" alt="" width={44} height={44} style={{ objectFit: "contain", width: "auto", height: "clamp(28px, 4vw, 44px)" }} />
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
        <button className="lang-toggle">EN / FR</button>
        <Link href="/signin" className="btn-primary">Sign in</Link>
      </div>
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="hero">
      <h1 className="hero-title">Welcome to UONotes</h1>
      <p className="hero-subtitle">Notes made by students, for students.</p>
      <div className="hero-actions">
        <Link href="/submit" className="btn-primary">Submit notes</Link>
        <Link href="/notes" className="btn-primary">View notes</Link>
        <Link href="/dashboard" className="btn-primary">My dashboard</Link>
      </div>
      <p className="hero-description">
        A student-driven platform making academic resources more accessible across
        all faculties at the University of Ottawa.
      </p>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────

function HowItWorks() {
  return (
    <section className="section how-it-works">
      <h2 className="section-title">How it works</h2>
      <div className="steps-row">
        <div className="step">
          <FileTextIcon />
          <p className="step-label">Upload your notes</p>
        </div>
        <ArrowIcon />
        <div className="step">
          <EditIcon />
          <p className="step-label">Get reviewed by our team</p>
        </div>
        <ArrowIcon />
        <div className="step">
          <StarIcon />
          <p className="step-label">Earn volunteer hours</p>
        </div>
      </div>
    </section>
  );
}

// ─── Note Card ────────────────────────────────────────────────────────────────

type NoteCardProps = {
  title?: string;
  course?: string;
  thumb?: string;
};

function NoteCard({ title = "Note title", course = "Course title and code", thumb }: NoteCardProps) {
  return (
    <div className="note-card">
      <div className="note-thumb">
        {thumb ? (
          <Image src={thumb} alt={title} fill style={{ objectFit: "cover" }} />
        ) : (
          <Image src="/images/placeholder.png" alt="" fill style={{ objectFit: "cover" }} />
        )}
      </div>
      <div className="note-info">
        <p className="note-title">{title}</p>
        <p className="note-course">{course}</p>
        <div className="note-actions">
          <button className="btn-tag">
            <EyeIcon /> View PDF
          </button>
          <button className="btn-tag">
            <BookmarkIcon /> Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Featured Notes ───────────────────────────────────────────────────────────

function FeaturedNotes() {
  const notes = [
    { title: "Note title", course: "Course title and code" },
    { title: "Note title", course: "Course title and code" },
    { title: "Note title", course: "Course title and code" },
    { title: "Note title", course: "Course title and code" },
  ];

  return (
    <section className="section featured-notes">
      <div className="section-header-row">
        <Image src="/images/Notebook.png" alt="" width={28} height={28} />
        <h2 className="section-title inline">Featured notes</h2>
      </div>
      <div className="notes-grid">
        {notes.map((n, i) => (
          <NoteCard key={i} title={n.title} course={n.course} />
        ))}
      </div>
      <div className="center-action">
        <Link href="/notes" className="btn-primary">View all notes</Link>
      </div>
    </section>
  );
}

// ─── Events ───────────────────────────────────────────────────────────────────

type EventCardProps = {
  title: string;
  date: string;
  imageSrc: string;
};

function EventCard({ title, date, imageSrc }: EventCardProps) {
  return (
    <div className="event-card">
      <div className="event-thumb">
        <Image src={imageSrc} alt={title} fill style={{ objectFit: "cover" }} />
      </div>
      <div className="event-info">
        <p className="event-title">{title}</p>
        <p className="event-date">{date}</p>
        <button className="btn-outline-sm">Learn more</button>
      </div>
    </div>
  );
}

function Events() {
  return (
    <section className="section events">
      <h2 className="section-title red">Events</h2>
      <div className="events-grid">
        <EventCard
          title="Pathways to Dentistry, Medicine & Law"
          date="June 19th, 2026"
          imageSrc="/images/Image-1.png"
        />
        <EventCard
          title="Trivia Night"
          date="March 19th, 2026"
          imageSrc="/images/Image-2.png"
        />
        <EventCard
          title="F1 Movie Night"
          date="February 27th, 2026"
          imageSrc="/images/event pic.png"
        />
      </div>
    </section>
  );
}

// ─── Sponsors ─────────────────────────────────────────────────────────────────

const SPONSORS = [
  { name: "Pure Yoga", src: "/images/Pure-Yoga-Logo.png" },
  { name: "Pizza Pizza", src: "/images/PizzaPizza-Logo.png" },
  { name: "Crumbl Cookies", src: "/images/Crumbl-Cookies-Logo.png" },
  { name: "Metcalfe", src: "/images/Metcalfe-Logo.png" },
  { name: "Red Bull", src: "/images/RedBull-Logo.png" },
  { name: "Haunted Walk", src: "/images/Haunted-Walk-Logo.png" },
];

function Sponsors() {
  return (
    <section className="section sponsors">
      <h2 className="section-title red">Thank you to our sponsors!</h2>
      <div className="sponsors-marquee-wrapper">
        <Marquee speed={40} gradient={false} pauseOnHover autoFill>
          {SPONSORS.map((s, i) => (
            <div key={i} className="sponsor-logo">
              <Image src={s.src} alt={s.name} fill sizes="200px" style={{ objectFit: "contain" }} />
            </div>
          ))}
        </Marquee>
      </div>
      <div className="sponsor-actions">
        <a href="https://forms.google.com" target="_blank" rel="noopener" className="btn-outline">
          Become a sponsor
        </a>
        <a href="/sponsorship-package.pdf" target="_blank" rel="noopener" className="btn-outline">
          Why sponsor UONotes?
        </a>
      </div>
    </section>
  );
}

// ─── Community ────────────────────────────────────────────────────────────────

function Community() {
  const stats = [
    { icon: <TrendingUpIcon />, value: "100,000+", label: "Interactions" },
    { icon: <UsersIcon />,      value: "100+",     label: "Contributors" },
    { icon: <BookOpenIcon />,   value: "10",        label: "Faculties covered" },
  ];

  return (
    <section className="section community">
      <div className="community-inner">
        <div className="community-stats">
          {stats.map((s) => (
            <div key={s.label} className="stat-row">
              <span className="stat-icon">{s.icon}</span>
              <div>
                <p className="stat-value">{s.value}</p>
                <p className="stat-label">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="community-cta">
          <h2 className="community-heading">
            Join a growing community of students supporting each other academically.
          </h2>
          <div className="community-actions">
            <Link href="/contact" className="btn-outline">Contact us</Link>
            <Link href="/about" className="btn-outline">Meet the team</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Link href="/" className="nav-logo">
            <Image src="/logo.png" alt="" width={44} height={44} style={{ objectFit: "contain", width: "auto", height: "clamp(24px, 3vw, 36px)" }} />
            <span className="nav-logo-text" style={{ fontSize: "clamp(0.9rem, 2vw, 1.25rem)" }}>UONotes</span>
          </Link>
        </div>
        <div className="footer-cols">
          <div className="footer-col">
            <Link href="/">Home</Link>
            <Link href="/notes">View notes</Link>
            <Link href="/dashboard">My dashboard</Link>
            <Link href="/submit">Submit notes</Link>
          </div>
          <div className="footer-col">
            <Link href="/about">About</Link>
            <Link href="/events">Events</Link>
            <Link href="/sponsors">Sponsors</Link>
            <Link href="/contact">Contact us</Link>
          </div>
          <div className="footer-col footer-contact">
            <p>75 Laurier Ave E</p>
            <p>Ottawa, ON, K1N 6N5</p>
            <a href="mailto:uofnotes@gmail.com">uofnotes@gmail.com</a>
            <div className="footer-socials">
              <a href="#" aria-label="Instagram">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M16.2 2C19.4 2 22 4.6 22 7.8V16.2C22 19.4 19.4 22 16.2 22H7.8C4.6 22 2 19.4 2 16.2V7.8C2 4.6 4.6 2 7.8 2H16.2ZM7.6 4C6.645 4 5.73 4.38 5.055 5.055C4.38 5.73 4 6.645 4 7.6V16.4C4 18.39 5.61 20 7.6 20H16.4C17.355 20 18.27 19.62 18.945 18.945C19.62 18.27 20 17.355 20 16.4V7.6C20 5.61 18.39 4 16.4 4H7.6ZM12 7C14.761 7 17 9.239 17 12C17 14.761 14.761 17 12 17C9.239 17 7 14.761 7 12C7 9.239 9.239 7 12 7ZM12 9C10.343 9 9 10.343 9 12C9 13.657 10.343 15 12 15C13.657 15 15 13.657 15 12C15 10.343 13.657 9 12 9ZM17.25 5.5C17.94 5.5 18.5 6.06 18.5 6.75C18.5 7.44 17.94 8 17.25 8C16.56 8 16 7.44 16 6.75C16 6.06 16.56 5.5 17.25 5.5Z"
                    fill="#454545" />
                </svg>
              </a>
              <a href="#" aria-label="TikTok">
                <Image src="/images/tiktok.png" alt="TikTok" width={18} height={18} />
              </a>
              <a href="#" aria-label="LinkedIn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M19 3C19.53 3 20.04 3.211 20.414 3.586C20.789 3.961 21 4.47 21 5V19C21 19.53 20.789 20.04 20.414 20.414C20.04 20.789 19.53 21 19 21H5C4.47 21 3.96 20.789 3.586 20.414C3.211 20.04 3 19.53 3 19V5C3 4.47 3.211 3.96 3.586 3.586C3.96 3.211 4.47 3 5 3H19ZM5.5 18.5H8.27V10.13H5.5V18.5ZM15.24 9.94C14.39 9.94 13.4 10.46 12.92 11.24V10.13H10.13V18.5H12.92V13.57C12.92 12.8 13.54 12.17 14.31 12.17C14.681 12.17 15.037 12.318 15.3 12.58C15.562 12.843 15.71 13.199 15.71 13.57V18.5H18.5V13.2C18.5 12.336 18.156 11.506 17.545 10.895C16.934 10.283 16.104 9.94 15.24 9.94ZM6.88 5.19C6.432 5.19 6.001 5.368 5.685 5.685C5.368 6.001 5.19 6.432 5.19 6.88C5.19 7.81 5.95 8.56 6.88 8.56C7.325 8.56 7.753 8.383 8.068 8.068C8.383 7.753 8.56 7.325 8.56 6.88C8.56 5.95 7.81 5.19 6.88 5.19Z"
                    fill="#454545" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <FeaturedNotes />
        <Events />
        <Sponsors />
        <Community />
      </main>
      <Footer />
    </>
  );
}