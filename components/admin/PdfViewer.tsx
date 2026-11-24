"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowDown, Loader2 } from "lucide-react";
import { releaseNoteLockAction } from "@/app/admin/queue/actions";
import { DocumentPreview } from "@/components/admin/DocumentPreview";

export function PdfViewer({
  documentId,
  title,
  fileUrl,
  fileType,
  fileKey,
  downloadUrl,
  isBeingFixed = false,
  isFinalCheck = false,
  comparison = null,
  claimedByCaller = false,
  claimedByOtherEmail = null,
}: {
  documentId: string;
  title: string;
  fileUrl: string;
  fileType: string | null;
  fileKey: string | null;
  downloadUrl?: string | null;
  isBeingFixed?: boolean;
  isFinalCheck?: boolean;
  // Final check of a fix: the main file is shown as the original, next to
  // the director's corrected version.
  comparison?: { fileUrl: string; fileType: string | null; fileKey: string | null; downloadUrl?: string | null } | null;
  // Whether the CURRENT admin has this note claimed. Only they can
  // release the lock — viewing the note never claims it, so this has to
  // be passed in explicitly rather than assumed.
  claimedByCaller?: boolean;
  // Set when someone else has an active claim, so we can say who
  // without blocking the view itself.
  claimedByOtherEmail?: string | null;
}) {
  const [isReleasing, setIsReleasing] = useState(false);
  // Below desktop width only one document fits at a time.
  const [mobilePane, setMobilePane] = useState<"original" | "fixed">("fixed");
  const router = useRouter();

  // A note being fixed stays claimed when you leave the page — fixing
  // happens offline, and is only given up via "Stop fixing".
  const canRelease = claimedByCaller && !isBeingFixed;

  const handleRelease = async () => {
    if (isReleasing) return;
    setIsReleasing(true);

    try {
      await releaseNoteLockAction(documentId);
      router.push("/admin/queue");
      router.refresh();
    } catch (err) {
      console.error("Failed to release lock:", err);
      setIsReleasing(false);
    }
  };

  const backClass =
    "inline-flex items-center gap-2 py-1 text-xs font-medium text-gray-300 hover:text-white transition-colors group cursor-pointer border-0 bg-transparent disabled:opacity-50 shrink-0";
  const badgeClass = "text-[11px] font-medium px-2.5 py-1 rounded-full truncate max-w-[45vw] sm:max-w-xs";

  return (
    <div className="flex flex-col h-full bg-[#262626] text-white overflow-hidden select-none">
      <div className="px-4 sm:px-5 py-3 border-b border-white/10 flex items-center justify-between gap-3 bg-[#1C1C1C] z-10 shrink-0">
        {canRelease ? (
          <button type="button" disabled={isReleasing} onClick={handleRelease} className={backClass}>
            {isReleasing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            )}
            <span className="hidden sm:inline">{isReleasing ? "Releasing…" : "Release & return to queue"}</span>
            <span className="sm:hidden">{isReleasing ? "Releasing…" : "Release"}</span>
          </button>
        ) : (
          <Link href="/admin/queue" className={backClass}>
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span className="hidden sm:inline">Back to queue</span>
            <span className="sm:hidden">Queue</span>
          </Link>
        )}
        <div className="flex items-center gap-2 min-w-0">
          {isFinalCheck || comparison ? (
            <span className={`${badgeClass} text-stone-300 bg-stone-600/10`}>
              Final check{claimedByOtherEmail ? ` · ${claimedByOtherEmail}` : ""}
            </span>
          ) : isBeingFixed && claimedByCaller ? (
            <span className={`${badgeClass} text-amber-300 bg-amber-500/10`}>
              You&apos;re fixing this
            </span>
          ) : isBeingFixed && claimedByOtherEmail ? (
            <span className={`${badgeClass} text-amber-300 bg-amber-500/10`}>
              Being fixed by {claimedByOtherEmail}
            </span>
          ) : claimedByCaller ? (
            <span className={`${badgeClass} text-slate-300 bg-slate-500/10`}>
              Claimed for review
            </span>
          ) : claimedByOtherEmail ? (
            <span className={`${badgeClass} text-amber-300 bg-amber-500/10`}>
              Claimed by {claimedByOtherEmail}
            </span>
          ) : (
            <span className={`${badgeClass} text-gray-300 bg-white/5`}>
              Viewing · not claimed
            </span>
          )}
          {/* On phones and tablets the decision panel sits below the document. */}
          <a
            href="#review-actions"
            className="lg:hidden inline-flex items-center gap-1 shrink-0 rounded-full bg-brand-red px-3 py-1 text-[11px] font-semibold text-white"
          >
            Decide <ArrowDown className="w-3 h-3" />
          </a>
        </div>
      </div>

      {comparison ? (
        <>
          <div className="xl:hidden flex gap-1 p-1.5 bg-[#1C1C1C] border-b border-white/10">
            {(["original", "fixed"] as const).map((pane) => (
              <button
                key={pane}
                onClick={() => setMobilePane(pane)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  mobilePane === pane ? "bg-white/10 text-white" : "text-gray-400 hover:text-gray-200"
                }`}
              >
                {pane === "original" ? "Original submission" : "Fixed version"}
              </button>
            ))}
          </div>
          <div className="flex-1 w-full h-full flex min-h-0">
            <ComparePane
              label="Original submission"
              hidden={mobilePane !== "original"}
            >
              <DocumentPreview title={`${title} (original)`} fileUrl={fileUrl} fileType={fileType} fileKey={fileKey} downloadUrl={downloadUrl} />
            </ComparePane>
            <ComparePane label="Fixed version" hidden={mobilePane !== "fixed"} accent>
              <DocumentPreview
                title={`${title} (fixed)`}
                fileUrl={comparison.fileUrl}
                fileType={comparison.fileType}
                fileKey={comparison.fileKey}
                downloadUrl={comparison.downloadUrl}
              />
            </ComparePane>
          </div>
        </>
      ) : (
        <div className="flex-1 w-full h-full relative bg-[#262626]">
          <DocumentPreview
            title={title}
            fileUrl={fileUrl}
            fileType={fileType}
            fileKey={fileKey}
            downloadUrl={downloadUrl}
          />
        </div>
      )}
    </div>
  );
}

function ComparePane({
  label,
  hidden,
  accent = false,
  children,
}: {
  label: string;
  hidden: boolean;
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`${hidden ? "hidden" : "flex"} xl:flex flex-1 flex-col min-w-0 xl:border-r last:border-r-0 border-white/10`}>
      <div
        className={`hidden xl:block shrink-0 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide border-b border-white/10 ${
          accent ? "text-stone-300 bg-stone-600/5" : "text-gray-400 bg-black/10"
        }`}
      >
        {label}
      </div>
      <div className="flex-1 relative">{children}</div>
    </div>
  );
}
