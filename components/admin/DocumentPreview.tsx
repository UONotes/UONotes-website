"use client";

import { useState } from "react";
import { Download, ExternalLink, FileQuestion } from "lucide-react";
import { previewKindFor } from "@/lib/review";

// Renders whatever was uploaded: PDFs natively, images directly, and
// Word/PowerPoint through Microsoft's Office Online viewer (which fetches
// the short-lived signed URL itself). A download link is always on hand
// in case the Office viewer can't open a particular file.
export function DocumentPreview({
  title,
  fileUrl,
  fileType,
  fileKey,
  downloadUrl,
}: {
  title: string;
  fileUrl: string;
  fileType: string | null;
  fileKey: string | null;
  downloadUrl?: string | null;
}) {
  const kind = previewKindFor(fileType, fileKey);
  const [officeLoaded, setOfficeLoaded] = useState(false);

  // iPhone and iPad Safari only render the first page of a PDF inside a
  // frame, so there's always a way to open it in the browser's own viewer.
  const openButton = (
    <a
      href={fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 rounded-md bg-black/60 px-2.5 py-1.5 text-xs font-medium text-white backdrop-blur hover:bg-black/75"
    >
      <ExternalLink className="w-3.5 h-3.5" /> Open
    </a>
  );

  if (kind === "image") {
    return (
      <div className="absolute inset-0 overflow-auto flex items-start justify-center p-3 sm:p-6">
        {openButton}
        {/* eslint-disable-next-line @next/next/no-img-element -- signed R2 URL, not an optimisable asset */}
        <img src={fileUrl} alt={title} className="max-w-full h-auto rounded-md shadow-lg bg-white" />
      </div>
    );
  }

  if (kind === "office") {
    const viewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
    return (
      <div className="absolute inset-0 flex flex-col">
        <div className="flex-1 relative">
          {!officeLoaded && (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
              Loading preview…
            </div>
          )}
          <iframe
            src={viewerUrl}
            className="w-full h-full border-0 absolute inset-0 bg-white"
            title={title}
            onLoad={() => setOfficeLoaded(true)}
          />
        </div>
        <div className="shrink-0 px-5 py-2 bg-[#1C1C1C] border-t border-white/10 flex items-center justify-between gap-3 text-[11px] text-gray-400">
          <span className="hidden sm:inline">Previewing with Office Online. Formatting may differ slightly from the original.</span>
          <span className="sm:hidden">Office Online preview</span>
          <a
            href={downloadUrl || fileUrl}
            className="inline-flex items-center gap-1.5 text-gray-200 hover:text-white font-medium shrink-0"
          >
            <Download className="w-3 h-3" /> Download
          </a>
        </div>
      </div>
    );
  }

  if (kind === "pdf") {
    return (
      <>
        {openButton}
        <iframe
          src={`${fileUrl}#view=FitH`}
          className="w-full h-full border-0 absolute inset-0"
          title={title}
          allow="autoplay; fullscreen"
        />
      </>
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray-400 px-6 text-center">
      <FileQuestion className="w-8 h-8" />
      <p className="text-sm">This file type can&apos;t be previewed here.</p>
      <a
        href={downloadUrl || fileUrl}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-gray-100 text-xs font-medium hover:bg-white/20"
      >
        <Download className="w-3.5 h-3.5" /> Download file
      </a>
    </div>
  );
}
