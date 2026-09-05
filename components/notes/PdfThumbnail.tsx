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
 * this should never be the thing that breaks a page. */
export function PdfThumbnail({ fileUrl, className, fallback }: PdfThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;

    async function renderThumbnail() {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url
        ).toString();

        const pdf = await pdfjsLib.getDocument({ url: fileUrl }).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1.2 });

        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const context = canvas.getContext("2d");
        if (!context) return;

        await page.render({ canvasContext: context, viewport, canvas }).promise;

        if (!cancelled) setStatus("ready");
      } catch (err) {
        console.error("PDF thumbnail render failed:", err);
        if (!cancelled) setStatus("error");
      }
    }

    renderThumbnail();
    return () => { cancelled = true; };
  }, [fileUrl]);

  if (status === "error") {
    return <>{fallback}</>;
  }

  return (
    <div className={`relative ${className ?? ""}`}>
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 animate-pulse" />
      )}
      <canvas ref={canvasRef} className="w-full h-full object-cover object-top" />
    </div>
  );
}