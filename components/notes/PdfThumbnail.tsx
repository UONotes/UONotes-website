"use client";

import type { PDFDocumentLoadingTask } from "pdfjs-dist";
import { useEffect, useRef, useState } from "react";

// Copied from node_modules/pdfjs-dist into public/pdfjs. Copy them again when
// pdfjs-dist is upgraded.
const PDFJS_ASSETS = "/pdfjs";

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
    let loadingTask: PDFDocumentLoadingTask | undefined;

    async function renderThumbnail() {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url
        ).toString();

        if (cancelled) return;
        loadingTask = pdfjsLib.getDocument({
          url: fileUrl,
          cMapUrl: `${PDFJS_ASSETS}/cmaps/`,
          cMapPacked: true,
          standardFontDataUrl: `${PDFJS_ASSETS}/standard_fonts/`,
          wasmUrl: `${PDFJS_ASSETS}/wasm/`,
        });
        const pdf = await loadingTask.promise;
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
        if (cancelled) return;
        // A file missing from storage just shows the fallback. Anything else
        // is logged without the signed part of the URL.
        if ((err as { status?: number })?.status !== 404) {
          const message = err instanceof Error ? err.message : String(err);
          console.error("PDF thumbnail render failed:", message.replace(/[?]X-Amz-[^" ]*/g, ""));
        }
        setStatus("error");
      }
    }

    renderThumbnail();
    return () => {
      cancelled = true;
      void loadingTask?.destroy();
    };
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