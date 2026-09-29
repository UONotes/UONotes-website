"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, MotionConfig } from "framer-motion";
import { pastEvents, type EventItem } from "@/lib/events-data";
import { PhotoLightbox, type LightboxState } from "./PhotoLightbox";

function getPhotos(event: EventItem) {
  return event.images && event.images.length > 0 ? event.images : event.image ? [event.image] : [];
}

function shortDate(date: string) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// uOttawa terms: Winter (Jan–Apr), Summer (May–Aug), Fall (Sep–Dec)
function semesterOf(date: string) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "Other";
  const m = d.getMonth();
  const term = m < 4 ? "Winter" : m < 8 ? "Summer" : "Fall";
  return `${term} ${d.getFullYear()}`;
}

type Semester = { label: string; events: EventItem[] };

// Most recent first, grouped by semester
const semesters: Semester[] = [...pastEvents]
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  .reduce<Semester[]>((groups, event) => {
    const label = semesterOf(event.date);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.events.push(event);
    else groups.push({ label, events: [event] });
    return groups;
  }, []);

// Running position of each event across all semesters, used to vary cover tilts
const coverOrder = new Map(semesters.flatMap((s) => s.events).map((e, i) => [e.id, i]));

const semesterId = (label: string) => label.toLowerCase().replace(/\s+/g, "-");

// Hand-placed tilt so the polaroids look pinned up, not generated
const TILTS = [-3, 2.5, -1.5, 3.5, -2.5, 1.5, -3.5, 2];
const TAPE_TILTS = [-6, 4, -2, 7, -5, 3];

// Lines the scroll rows up with the page container, while letting them bleed off the right edge
const ROW_GUTTER = "px-[max(1rem,calc((100vw-72rem)/2+1.5rem))] scroll-px-[max(1rem,calc((100vw-72rem)/2+1.5rem))]";
const HIDE_SCROLLBAR = "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden";
// Sideways-only scrolling. Tilted/lifted polaroids poke past the row's edges, which would otherwise
// make the row scroll vertically and swallow page scrolls. overscroll-x-contain stops trackpad
// swipes at the row's end from triggering browser back/forward.
const X_SCROLL_ONLY = "overflow-x-auto overflow-y-hidden overscroll-x-contain touch-pan-x touch-pan-y";

function Squiggle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 300 24" fill="none" preserveAspectRatio="none" aria-hidden="true">
      <path
        d="M3 15C40 5 70 21 105 12C140 3 170 20 205 11C235 4 265 17 297 9"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Tape({ tilt, className = "" }: { tilt: number; className?: string }) {
  return (
    <span
      className={`absolute -top-3 left-1/2 h-6 bg-brand-red/15 shadow-sm backdrop-blur-[1px] ${className}`}
      style={{ transform: `translateX(-50%) rotate(${tilt}deg)` }}
      aria-hidden="true"
    />
  );
}

function ArrowButton({ dir, disabled, onClick }: { dir: "left" | "right"; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === "left" ? "Scroll photos left" : "Scroll photos right"}
      className="w-12 h-12 rounded-full border-2 border-brand-dark/15 text-brand-dark flex items-center justify-center transition-all cursor-pointer enabled:hover:bg-brand-red enabled:hover:border-brand-red enabled:hover:text-white disabled:opacity-25 disabled:cursor-default"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={dir === "left" ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
      </svg>
    </button>
  );
}

function Polaroid({ src, index, title, onOpen }: { src: string; index: number; title: string; onOpen: () => void }) {
  const tilt = TILTS[index % TILTS.length];

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      aria-label={`Open ${title} photo ${index + 1}`}
      initial={{ opacity: 0, y: 40, rotate: tilt }}
      whileInView={{ opacity: 1, y: 0, rotate: tilt }}
      whileHover={{ rotate: 0, y: -10, scale: 1.04, transition: { type: "spring", stiffness: 300, damping: 20 } }}
      whileTap={{ scale: 0.98 }}
      viewport={{ once: true, margin: "0px -40px" }}
      transition={{ duration: 0.5, delay: Math.min(index, 6) * 0.06, ease: "easeOut" }}
      className="relative shrink-0 snap-start bg-white p-2.5 pb-10 sm:p-3 sm:pb-12 shadow-[0_18px_40px_-16px_rgba(0,0,0,0.45)] cursor-zoom-in hover:z-10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-red/40"
    >
      <Tape tilt={TAPE_TILTS[index % TAPE_TILTS.length]} className="w-16" />
      <div className="relative w-64 sm:w-72 lg:w-80 aspect-[4/3] overflow-hidden bg-gray-200">
        <Image
          src={src}
          alt={`${title} - photo ${index + 1}`}
          fill
          sizes="(max-width: 640px) 256px, (max-width: 1024px) 288px, 320px"
          className="object-cover"
        />
      </div>
    </motion.button>
  );
}

/** Small polaroid "cover" in the top index; jumps to the event. */
function CoverCard({ event, index }: { event: EventItem; index: number }) {
  const cover = getPhotos(event)[0];
  const tilt = TILTS[(index + 3) % TILTS.length];

  return (
    <motion.a
      href={`#${event.id}`}
      initial={{ opacity: 0, y: 24, rotate: tilt }}
      animate={{ opacity: 1, y: 0, rotate: tilt }}
      whileHover={{ rotate: 0, y: -8, scale: 1.05, transition: { type: "spring", stiffness: 300, damping: 20 } }}
      transition={{ duration: 0.5, delay: 0.2 + index * 0.08, ease: "easeOut" }}
      className="group relative shrink-0 snap-start block w-44 sm:w-52 bg-white p-2 pb-3 shadow-[0_14px_30px_-14px_rgba(0,0,0,0.45)] hover:z-10"
    >
      <Tape tilt={TAPE_TILTS[(index + 2) % TAPE_TILTS.length]} className="w-12" />
      <div className="relative aspect-square overflow-hidden bg-gray-200">
        {cover && (
          <Image src={cover} alt="" fill sizes="208px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
        )}
      </div>
      <div className="pt-2.5 px-1">
        <p className="font-bold text-sm leading-tight text-brand-dark group-hover:text-brand-red transition-colors line-clamp-2">
          {event.title}
        </p>
        <p className="text-xs text-brand-body/60 mt-1">{shortDate(event.date)}</p>
      </div>
    </motion.a>
  );
}

function EventChapter({ event, onOpen }: { event: EventItem; onOpen: (index: number) => void }) {
  const photos = getPhotos(event);
  const rowRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateArrows = useCallback(() => {
    const el = rowRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    const observer = new ResizeObserver(updateArrows);
    observer.observe(el);
    return () => observer.disconnect();
  }, [updateArrows]);

  const scrollBy = (dir: 1 | -1) => {
    const el = rowRef.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.75, behavior: "smooth" });
  };

  return (
    <article id={event.id} className="relative scroll-mt-20 py-10 sm:py-14">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-3xl">
            <p className="text-sm sm:text-base font-semibold text-brand-red">{event.date}</p>
            <h3 className="font-logo font-black text-4xl sm:text-5xl lg:text-6xl tracking-tighter leading-[0.95] mt-2 text-gray-900">
              {event.title}
            </h3>
            <p className="mt-4 text-sm sm:text-base text-brand-body/70">
              {event.location}
              <span className="mx-2 opacity-40">/</span>
              {event.time}
              <span className="mx-2 opacity-40">/</span>
              {photos.length} {photos.length === 1 ? "photo" : "photos"}
            </p>
            {event.description && (
              <p className="mt-3 text-base sm:text-lg text-brand-body leading-relaxed max-w-2xl">{event.description}</p>
            )}
          </div>

          {photos.length > 1 && (
            <div className="hidden md:flex items-center gap-3 shrink-0">
              <ArrowButton dir="left" disabled={!canPrev} onClick={() => scrollBy(-1)} />
              <ArrowButton dir="right" disabled={!canNext} onClick={() => scrollBy(1)} />
            </div>
          )}
        </div>
      </div>

      {photos.length > 0 && (
        <div
          ref={rowRef}
          onScroll={updateArrows}
          className={`mt-4 sm:mt-6 flex gap-6 sm:gap-10 ${X_SCROLL_ONLY} snap-x snap-mandatory pt-10 pb-12 ${ROW_GUTTER} ${HIDE_SCROLLBAR}`}
        >
          {photos.map((src, i) => (
            <Polaroid key={src} src={src} index={i} title={event.title} onOpen={() => onOpen(i)} />
          ))}
          {/* Trailing spacer so the last photo can snap clear of the edge */}
          <div className="shrink-0 w-px" aria-hidden="true" />
        </div>
      )}

      {photos.length > 1 && (
        <p className="md:hidden max-w-6xl mx-auto px-4 text-xs text-brand-body/50">Swipe for more &rarr;</p>
      )}
    </article>
  );
}

export function EventsSection() {
  const [lightbox, setLightbox] = useState<LightboxState>(null);

  const closeLightbox = useCallback(() => setLightbox(null), []);
  const changeLightbox = useCallback(
    (index: number) => setLightbox((prev) => (prev ? { ...prev, index } : prev)),
    []
  );

  return (
    // Skip transform animations for visitors who have "reduce motion" turned on
    <MotionConfig reducedMotion="user">
      <section className="w-full overflow-x-clip pb-16 sm:pb-24">
        {/* Masthead */}
        <header className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-12"
          >
            <h1 className="font-logo font-black text-gray-900 tracking-tighter leading-[0.85] text-[4.5rem] sm:text-[7rem] lg:text-[9rem]">
              Past
              <br />
              <span className="relative inline-block text-brand-red">
                events
                <Squiggle className="absolute left-0 -bottom-2 sm:-bottom-3 w-full h-3 sm:h-5 text-brand-dark" />
              </span>
            </h1>
            <p className="text-base sm:text-lg text-brand-body max-w-xs leading-relaxed md:pb-4">
              What we&apos;ve been up to. Tap any photo to see it up close.
            </p>
          </motion.div>
        </header>

        {/* Index: covers grouped by semester */}
        {semesters.length > 0 && (
          <nav aria-label="Jump to event" className={`mt-10 sm:mt-14 flex ${X_SCROLL_ONLY} snap-x pt-6 pb-10 ${ROW_GUTTER} ${HIDE_SCROLLBAR}`}>
            {semesters.map((semester, i) => (
              <div
                key={semester.label}
                className={`shrink-0 flex flex-col ${i > 0 ? "ml-8 sm:ml-12 pl-8 sm:pl-12 border-l-2 border-dashed border-brand-dark/15" : ""}`}
              >
                <a
                  href={`#${semesterId(semester.label)}`}
                  className="group self-start mb-2"
                >
                  <span className="font-logo font-black text-xl sm:text-2xl tracking-tight text-brand-red group-hover:text-brand-red-hover transition-colors">
                    {semester.label}
                  </span>
                </a>
                {/* Bracket spanning every event in this semester */}
                <span className="h-3 mb-6 border-t-2 border-x-2 border-brand-red/40 rounded-t-md" aria-hidden="true" />
                <div className="flex gap-5 sm:gap-6 px-1">
                  {semester.events.map((event) => (
                    <CoverCard key={event.id} event={event} index={coverOrder.get(event.id) ?? 0} />
                  ))}
                </div>
              </div>
            ))}
            <div className="shrink-0 w-px" aria-hidden="true" />
          </nav>
        )}

        {semesters.length === 0 ? (
          <p className="max-w-6xl mx-auto px-4 sm:px-6 py-20 text-brand-body">No past events yet. Check back soon.</p>
        ) : (
          semesters.map((semester) => (
            <Fragment key={semester.label}>
              {/* Semester divider */}
              <div id={semesterId(semester.label)} className="scroll-mt-20 max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16">
                <div className="flex items-center gap-4 sm:gap-6">
                  <h2 className="shrink-0 font-logo font-black text-2xl sm:text-3xl tracking-tight text-brand-dark">
                    {semester.label}
                  </h2>
                  <span className="flex-1 border-t-2 border-dashed border-brand-dark/15" aria-hidden="true" />
                </div>
              </div>

              {semester.events.map((event) => (
                <EventChapter
                  key={event.id}
                  event={event}
                  onOpen={(index) => setLightbox({ title: event.title, photos: getPhotos(event), index })}
                />
              ))}
            </Fragment>
          ))
        )}

        {/* Where to find what's next */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24">
          <div className="relative bg-white p-6 sm:p-10 shadow-[0_18px_40px_-16px_rgba(0,0,0,0.3)] -rotate-1 max-w-2xl">
            <Tape tilt={-4} className="w-20" />
            <p className="font-logo font-black text-3xl sm:text-4xl tracking-tighter text-gray-900 leading-tight">
              Want to be at the <span className="text-brand-red">next one?</span>
            </p>
            <p className="mt-3 text-base text-brand-body">
              We announce new events on Instagram first.
            </p>
            <a
              href="https://www.instagram.com/uonotes"
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-6 inline-flex items-center gap-2 bg-brand-red text-white font-bold px-6 py-3.5 rounded-xl shadow-lg shadow-brand-red/20 hover:bg-brand-red-hover hover:-translate-y-0.5 transition-all active:scale-[0.98]"
            >
              Follow @uonotes
              <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
            </a>
          </div>
        </div>

        <PhotoLightbox state={lightbox} onClose={closeLightbox} onChange={changeLightbox} />
      </section>
    </MotionConfig>
  );
}
