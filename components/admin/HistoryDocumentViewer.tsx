"use client";

import Link from "next/link";
import { ArrowLeft, FileX } from "lucide-react";
import { DocumentPreview } from "@/components/admin/DocumentPreview";

export function HistoryDocumentViewer({
  title,
  fileUrl,
  fileType,
  fileKey,
}: {
  title: string;
  fileUrl: string | null;
  fileType: string | null;
  fileKey: string | null;
}) {
  return (
    <div className="flex flex-col h-full bg-[#262626] text-white overflow-hidden select-none">
      <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between bg-[#1C1C1C]/90 backdrop-blur-md z-10">
        <Link
          href="/admin/history"
          className="inline-flex items-center gap-2 text-xs font-medium text-gray-300 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          Back to history
        </Link>

        <span className="text-[11px] font-medium text-gray-300 bg-white/5 px-2.5 py-1 rounded-full">
          Read-only · past decision
        </span>
      </div>

      <div className="flex-1 w-full h-full relative bg-[#262626]">
        {fileUrl ? (
          <DocumentPreview title={title} fileUrl={fileUrl} fileType={fileType} fileKey={fileKey} />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray-400 px-6 text-center">
            <FileX className="w-8 h-8" />
            <p className="text-sm">This file is no longer available to preview.</p>
            <p className="text-xs text-gray-500 max-w-xs">
              The decision details are still shown alongside this panel.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
