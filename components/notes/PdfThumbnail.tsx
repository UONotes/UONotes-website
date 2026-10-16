"use client";

import { useEffect, useRef, useState } from "react";

interface PdfThumbnailProps {
  fileUrl: string;
  className?: string;
  fallback: React.ReactNode;
}

/** Renders the first page of a PDF into a canvas, client-side, using
 * pdf.js. Falls back to whatever's passed as `fallback` if rendering
 * fails for any reason (a corrupt file, a network hiccup, etc.) —
 * this should never be the thing that breaks a page.
 *
 * It waits until the card is near the screen before downloading anything,
 * so a page full of notes doesn't fetch every PDF at once. */
export function PdfThumbnail({ fileUrl, className, fallback }: PdfThumbnailProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isNear, setIsNear] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  // 1. Start once the thumbnail is within ~300px of the screen
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setIsNear(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setIsNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // 2. Render page 1, sized to the box it's shown in (sharp on retina screens too)
  useEffect(() => {
    if (!isNear) return;
    let cancelled = false;
    let destroy: (() => void) | undefined;

    async function renderThumbnail() {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

        const task = pdfjsLib.getDocument({ url: fileUrl });
        destroy = () => void task.destroy();
        const pdf = await task.promise;
        const page = await pdf.getPage(1);

        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;

        const boxWidth = wrapperRef.current?.clientWidth || 300;
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        const baseWidth = page.getViewport({ scale: 1 }).width;
        const scale = Math.min(Math.max((boxWidth * pixelRatio) / baseWidth, 0.5), 2.5);
        const viewport = page.getViewport({ scale });

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const context = canvas.getContext("2d");
        if (!context) return;

        await page.render({ canvasContext: context, viewport, canvas }).promise;

        if (!cancelled) setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        // A missing file (404) or a destroyed load isn't a bug in the page, so it just shows the
        // fallback sheet quietly. console.warn (not console.error) also keeps Next's red error
        // overlay from popping up in development.
        const name = err instanceof Error ? err.name : "";
        const quiet = ["MissingPDFException", "UnexpectedResponseException", "ResponseException", "AbortException"].includes(name);
        if (!quiet) console.warn("PDF thumbnail couldn't be rendered:", err);
        setStatus("error");
      }
    }

    renderThumbnail();
    return () => {
      cancelled = true;
      destroy?.();
    };
  }, [fileUrl, isNear]);

  if (status === "error") {
    return <>{fallback}</>;
  }

  return (
    <div ref={wrapperRef} className={`relative ${className ?? ""}`}>
      {status === "loading" && <div className="absolute inset-0 animate-pulse bg-[#f6f2ef]" />}
      <canvas ref={canvasRef} className="h-full w-full object-cover object-top" />
    </div>
  );
}