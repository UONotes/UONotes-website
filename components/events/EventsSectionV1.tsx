"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { pastEvents, type EventItem } from "@/lib/events-data";

const notebookStyle = {
  backgroundImage: `
    linear-gradient(90deg, transparent 40px, rgba(168, 49, 66, 0.2) 40px, rgba(168, 49, 66, 0.2) 42px, transparent 42px),
    linear-gradient(transparent 26px, #e5e7eb 27px)
  `,
  backgroundSize: "100% 100%, 100% 27px",
};

// Most recent first
const sortedEvents = [...pastEvents].sort(
  (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
);

function getPhotos(event: EventItem) {
  return event.images && event.images.length > 0 ? event.images : event.image ? [event.image] : [];
}

const ChevronLeft = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
);
const ChevronRight = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
);

type LightboxState = { event: EventItem; index: number } | null;

function Lightbox({ state, onClose, onChange }: { state: NonNullable<LightboxState>; onClose: () => void; onChange: (index: number) => void }) {
  const photos = getPhotos(state.event);
  const { index } = state;

  const go = useCallback(
    (delta: number) => onChange((index + delta + photos.length) % photos.length),
    [index, photos.length, onChange]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [go, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] h-[100dvh] bg-black/95 flex flex-col overscroll-contain"
      role="dialog"
      aria-modal="true"
      aria-label={`${state.event.title} photos`}
      onClick={onClose}
    >
      <div className="flex items-center justify-between gap-4 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] text-white shrink-0">
        <div className="min-w-0">
          <p className="text-sm font-bold truncate">{state.event.title}</p>
          <p className="text-[11px] font-mono text-white/60">{index + 1} / {photos.length}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="relative flex-1 min-h-0">
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0"
          drag={photos.length > 1 ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.3}
          onDragEnd={(_, info) => {
            if (info.offset.x < -60) go(1);
            else if (info.offset.x > 60) go(-1);
          }}
        >
          <Image
            src={photos[index]}
            alt={`${state.event.title} - photo ${index + 1}`}
            fill
            sizes="100vw"
            className="object-contain pointer-events-none select-none"
            priority
          />
        </motion.div>

        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); go(-1); }}
              aria-label="Previous photo"
              className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-brand-red transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); go(1); }}
              aria-label="Next photo"
              className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-brand-red transition-colors cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {photos.length > 1 && (
        <div className="shrink-0 flex gap-2 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] overflow-x-auto justify-start sm:justify-center" onClick={(e) => e.stopPropagation()}>
          {photos.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => onChange(i)}
              aria-label={`Show photo ${i + 1}`}
              className={`relative w-14 h-10 shrink-0 rounded-md overflow-hidden transition-all cursor-pointer ${i === index ? "ring-2 ring-white opacity-100" : "opacity-40 hover:opacity-80"}`}
            >
              <Image src={src} alt="" fill sizes="56px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export function EventsSectionV1() {
  const [slideIndices, setSlideIndices] = useState<Record<string, number>>({});
  const [lightbox, setLightbox] = useState<LightboxState>(null);
  // true on the client only, so the lightbox portal never renders during SSR
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  // Swipe tracking for card photos; a swipe shouldn't also open the lightbox
  const touchStartX = useRef<number | null>(null);
  const swiped = useRef(false);

  const setSlide = (eventId: string, index: number) =>
    setSlideIndices((prev) => ({ ...prev, [eventId]: index }));

  const closeLightbox = useCallback(() => setLightbox(null), []);
  const changeLightbox = useCallback(
    (index: number) => setLightbox((prev) => (prev ? { ...prev, index } : prev)),
    []
  );

  return (
    <section className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-12 flex flex-col">
      <div
        className="w-full bg-white px-3 py-6 sm:p-10 md:p-14 rounded-2xl sm:rounded-3xl shadow-2xl border border-brand-red/15 relative overflow-hidden"
        style={notebookStyle}
      >
        {/* Notebook red margin line */}
        <div className="absolute top-0 bottom-0 left-4 sm:left-16 w-[2px] bg-[#a83142]/25 pointer-events-none z-0" />

        {/* Left gutter shadow gradient */}
        <div className="absolute top-0 left-0 bottom-0 w-4 sm:w-14 bg-gradient-to-r from-black/[0.03] to-transparent pointer-events-none z-10" />

        <div className="relative z-20 pl-4 sm:pl-12 pr-0 sm:pr-2">
          <div className="mb-6 sm:mb-10 border-b border-gray-200/80 pb-4">
            <span className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.3em] text-brand-red font-bold">
              uOttawa // Archive
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight font-sans text-gray-900 mt-1">
              Past Events
            </h2>
          </div>

          {sortedEvents.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-500">No past events yet — check back soon.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">
              {sortedEvents.map((event, i) => {
                const photos = getPhotos(event);
                const currentIndex = slideIndices[event.id] || 0;

                return (
                  <motion.article
                    key={event.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.06 }}
                    className="bg-white/90 border border-gray-200 rounded-2xl overflow-hidden shadow-xs hover:border-brand-red/40 hover:shadow-md transition-all flex flex-col group"
                  >
                    <div
                      className="aspect-[4/3] overflow-hidden relative bg-gray-900 touch-pan-y"
                      onTouchStart={(e) => {
                        touchStartX.current = e.touches[0].clientX;
                        swiped.current = false;
                      }}
                      onTouchEnd={(e) => {
                        if (touchStartX.current === null || photos.length < 2) return;
                        const dx = e.changedTouches[0].clientX - touchStartX.current;
                        touchStartX.current = null;
                        if (Math.abs(dx) < 40) return;
                        swiped.current = true;
                        setSlide(event.id, (currentIndex + (dx < 0 ? 1 : -1) + photos.length) % photos.length);
                      }}
                    >
                      {photos.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (swiped.current) {
                              swiped.current = false;
                              return;
                            }
                            setLightbox({ event, index: currentIndex });
                          }}
                          aria-label={`View ${event.title} photos full size`}
                          className="absolute inset-0 cursor-zoom-in"
                        >
                          <Image
                            src={photos[currentIndex]}
                            alt={`${event.title} - photo ${currentIndex + 1}`}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 420px"
                            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          />
                        </button>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm font-mono">
                          No image available
                        </div>
                      )}

                      <span className="absolute top-3 right-3 bg-gray-900/80 backdrop-blur-xs text-white text-[11px] font-mono px-2.5 py-1 rounded-md uppercase tracking-wider z-10 pointer-events-none">
                        {event.date}
                      </span>

                      {photos.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={() => setSlide(event.id, (currentIndex - 1 + photos.length) % photos.length)}
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-black/50 sm:bg-black/40 text-white hover:bg-brand-red transition-colors cursor-pointer backdrop-blur-xs sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 z-10"
                            aria-label="Previous photo"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSlide(event.id, (currentIndex + 1) % photos.length)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-black/50 sm:bg-black/40 text-white hover:bg-brand-red transition-colors cursor-pointer backdrop-blur-xs sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 z-10"
                            aria-label="Next photo"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>

                          <span className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-xs text-white text-[11px] font-mono px-2 py-0.5 rounded-full z-10 pointer-events-none">
                            {currentIndex + 1}/{photos.length}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="p-5 sm:p-6 flex flex-col flex-1">
                      <span className="text-[11px] font-mono text-brand-red font-bold uppercase tracking-widest mb-1.5">
                        {event.location} • {event.time}
                      </span>
                      <h3 className="font-bold text-gray-900 text-lg sm:text-xl leading-snug">{event.title}</h3>
                      {photos.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setLightbox({ event, index: 0 })}
                          className="mt-auto pt-4 self-start text-xs sm:text-sm font-mono font-bold text-brand-red hover:text-brand-red-hover uppercase tracking-wider cursor-pointer"
                        >
                          View gallery &rarr;
                        </button>
                      )}
                    </div>
                  </motion.article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {lightbox && <Lightbox state={lightbox} onClose={closeLightbox} onChange={changeLightbox} />}
          </AnimatePresence>,
          document.body
        )}
    </section>
  );
}
