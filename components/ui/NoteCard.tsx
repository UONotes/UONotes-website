"use client";

import Image from "next/image";
import Link from "next/link";
import { Bookmark, Flag } from "lucide-react";
import { PdfThumbnail } from "@/components/notes/PdfThumbnail";
import { SaveNoteButton } from "@/components/notes/SaveNoteButton";
import { formatShortDate } from "@/lib/dateFormat";

// Same "rubber stamp" lettering as the navbar
const STAMP_TEXT = "font-mono font-bold uppercase tracking-[0.16em]";
const STAMP_INK = "bg-brand-red shadow-[inset_0_0_0_2px_rgba(255,240,240,0.35)]";

type NoteCardProps = {
  id?: string;
  title?: string;
  course?: string;
  thumb?: string;
  fileUrl?: string;
  author?: string | null;
  date?: string | null;
  // Hide the bookmark for signed-out visitors (saving needs an account)
  canSave?: boolean;
  // Shows a small flag button when provided
  onReport?: () => void;
};

// Shown while there's no real PDF preview: a plain sheet with grey "text" lines
function PaperFallback() {
  return (
    <div aria-hidden="true" className="h-full w-full bg-white px-3 pt-3.5">
      <div className="mb-2 h-2 w-3/5 bg-gray-800/80" />
      <div className="mb-3.5 h-1.5 w-2/5 bg-gray-400/70" />
      {[88, 80, 92, 70, 85, 62, 90, 76].map((w, i) => (
        <div key={i} className="mb-1.5 h-1 bg-gray-200" style={{ width: `${w}%` }} />
      ))}
    </div>
  );
}

/** A note "handout": first page of the PDF on top, course stamp + title underneath.
 * The whole card links to the note; the save/report buttons sit above that link. */
export function NoteCard({
  id = "1",
  title = "Note title",
  course = "COURSE",
  thumb,
  fileUrl,
  author,
  date,
  canSave = true,
  onReport,
}: NoteCardProps) {
  const href = `/notes/view/${id}`;
  const meta = [author, date ? formatShortDate(date) : null].filter(Boolean).join(" · ");

  return (
    <article className="group relative flex h-full flex-col border border-black/[0.06] bg-white shadow-[0_14px_24px_-18px_rgba(0,0,0,0.45)] transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-[0_22px_30px_-18px_rgba(0,0,0,0.45)]">
      {/* Preview: the first page sitting on a little tray */}
      <div className="border-b border-black/[0.06] bg-[#f7f3f0] px-2.5 pt-2.5 sm:px-4 sm:pt-4">
        <div className="relative h-32 overflow-hidden bg-white shadow-[0_-1px_0_#e7e2df,0_2px_6px_rgba(0,0,0,0.06)] sm:h-52">
          {thumb ? (
            <Image src={thumb} alt="" fill sizes="(min-width: 1280px) 300px, 50vw" className="object-cover object-top" />
          ) : fileUrl ? (
            <PdfThumbnail fileUrl={fileUrl} className="h-full w-full" fallback={<PaperFallback />} />
          ) : (
            <PaperFallback />
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <span className={`self-start px-1.5 py-1 text-[9px] text-white sm:px-2 sm:text-[11px] ${STAMP_TEXT} ${STAMP_INK}`}>{course}</span>

        <h3 className="mt-2 line-clamp-2 text-[13px] font-bold leading-snug text-gray-900 transition-colors group-hover:text-brand-red sm:mt-2.5 sm:text-[17px]">
          {/* The ::after stretches this link over the whole card */}
          <Link href={href} className="after:absolute after:inset-0 after:content-[''] focus:outline-none">
            {title}
          </Link>
        </h3>

        <div className="mt-auto flex items-center justify-between gap-2 pt-2.5">
          <span className="min-w-0 truncate text-[10px] text-gray-500 sm:text-[13px]">
            {meta || <span className={`text-[9px] text-brand-red sm:text-[10px] ${STAMP_TEXT}`}>Open note &rarr;</span>}
          </span>

          <div className="relative z-10 flex shrink-0 items-center gap-0.5">
            {onReport && (
              <button
                type="button"
                onClick={onReport}
                className="p-1.5 text-gray-300 transition-colors hover:text-brand-red"
                title="Report this note"
                aria-label="Report this note"
              >
                <Flag className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            )}
            {canSave && (
              <SaveNoteButton
                noteId={id}
                render={({ isSaved, isToggling, toggle }) => (
                  <button
                    type="button"
                    onClick={toggle}
                    disabled={isToggling}
                    aria-pressed={isSaved}
                    className={`p-1.5 transition-colors disabled:opacity-50 ${isSaved ? "text-brand-red" : "text-gray-300 hover:text-brand-red"}`}
                    title={isSaved ? "Remove from saved" : "Save note"}
                    aria-label={isSaved ? "Remove from saved" : "Save note"}
                  >
                    <Bookmark className="h-3.5 w-3.5 sm:h-4 sm:w-4" style={{ fill: isSaved ? "currentColor" : "none" }} />
                  </button>
                )}
              />
            )}
          </div>
        </div>
      </div>
    </article>
  );
}