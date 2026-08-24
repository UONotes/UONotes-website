"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function PdfViewer({ documentId, title }: { documentId: string, title: string }) {
  return (
    <>
      <div className="p-3 sm:p-4 border-b border-white/10 flex items-center justify-between bg-gray-950">
        <Link href="/admin/queue" className="inline-flex items-center gap-2 text-[11px] font-mono font-bold text-gray-400 hover:text-white transition-colors uppercase">
          <ArrowLeft className="w-3.5 h-3.5" /> Release & Return
        </Link>
        <span className="text-[10px] font-mono text-gray-500 uppercase">ID: {documentId}</span>
      </div>
      
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 relative">
        <div className="w-full h-full bg-white rounded shadow-2xl flex items-center justify-center text-gray-400 font-mono text-sm border border-gray-200">
          [ Canvas: {title} ]
        </div>
      </div>
    </>
  );
}