"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export type LightboxState = { title: string; photos: string[]; index: number } | null;

const ChevronLeft = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
);
const ChevronRight = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
);

function LightboxView({ state, onClose, onChange }: { state: NonNullable<LightboxState>; onClose: () => void; onChange: (index: number) => void }) {
  const { title, photos, index } = state;
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Move focus into the viewer on open and give it back to the photo that opened it on close
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => opener?.focus?.();
  }, []);

  const go = useCallback(
    (delta: number) => onChange((index + delta + photos.length) % photos.length),
    [index, photos.length, onChange]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Keep Tab cycling inside the viewer instead of reaching the page behind it
      if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>("button:not([disabled]), [href]");
        const visible = Array.from(focusables).filter((el) => el.offsetParent !== null);
        if (visible.length === 0) return;
        const first = visible[0];
        const last = visible[visible.length - 1];
        if (e.shiftKey && (document.activeElement === first || !dialogRef.current.contains(document.activeElement))) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && (document.activeElement === last || !dialogRef.current.contains(document.activeElement))) {
          e.preventDefault();
          first.focus();
        }
        return;
      }
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
      ref={dialogRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] h-[100dvh] bg-black/95 flex flex-col overscroll-contain"
      role="dialog"
      aria-modal="true"
      aria-label={`${title} photos`}
      onClick={onClose}
    >
      <div className="flex items-center justify-between gap-4 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] text-white shrink-0">
        <div className="min-w-0">
          <p className="text-sm font-bold truncate">{title}</p>
          <p className="text-[11px] font-mono text-white/60">{index + 1} / {photos.length}</p>
        </div>
        <button
          ref={closeRef}
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
            alt={`${title} - photo ${index + 1}`}
            fill
            sizes="100vw"
            className="object-contain pointer-events-none select-none"
            priority
          />
        </motion.div>

        {/* Preload neighbours so swiping doesn't flash blank. Same sizes = same URLs as the main image */}
        {photos.length > 1 &&
          [...new Set([(index + 1) % photos.length, (index - 1 + photos.length) % photos.length])].map((i) => (
            <Image
              key={photos[i]}
              src={photos[i]}
              alt=""
              fill
              sizes="100vw"
              loading="eager"
              aria-hidden="true"
              className="object-contain opacity-0 pointer-events-none"
            />
          ))}

        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); go(-1); }}
              aria-label="Previous photo"
              className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-brand-red transition-colors cursor-pointer"
            >
              <ChevronLeft />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); go(1); }}
              aria-label="Next photo"
              className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-brand-red transition-colors cursor-pointer"
            >
              <ChevronRight />
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

/** Full-screen photo viewer, portaled to <body> so page transforms can't clip it. */
export function PhotoLightbox({ state, onClose, onChange }: { state: LightboxState; onClose: () => void; onChange: (index: number) => void }) {
  // true on the client only, so the portal never renders during SSR
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {state && <LightboxView state={state} onClose={onClose} onChange={onChange} />}
    </AnimatePresence>,
    document.body
  );
}
