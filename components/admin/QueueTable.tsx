"use client";

import Link from "next/link";
import { FileText, Clock, ShieldAlert } from "lucide-react";
import { AdminNote} from "@/lib/admin";

export function QueueTable({ notes }: { notes: AdminNote[] }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[600px]">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-mono uppercase tracking-wider text-gray-500">
            <th className="p-4 font-semibold">Document</th>
            <th className="p-4 font-semibold">Course</th>
            <th className="p-4 font-semibold">Status</th>
            <th className="p-4 font-semibold text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 text-sm">
          {notes.map((note) => (
            <tr key={note.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="p-4">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900 truncate max-w-[200px]">{note.title}</p>
                    <p className="text-[11px] text-gray-500 font-mono mt-0.5">{note.uploaderEmail}</p>
                  </div>
                </div>
              </td>
              <td className="p-4 font-mono font-medium text-brand-red">{note.courseCode}</td>
              <td className="p-4">
                {note.status === "PENDING" ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50 text-amber-700 text-[10px] font-mono font-bold uppercase border border-amber-200/50">
                    <Clock className="w-3 h-3" /> Pending
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-[10px] font-mono font-bold uppercase border border-blue-200/50">
                    <ShieldAlert className="w-3 h-3" /> Locked
                  </span>
                )}
              </td>
              <td className="p-4 text-right">
                {note.status === "PENDING" ? (
                  <Link href={`/admin/review/${note.id}`} className="inline-block px-4 py-2 bg-gray-900 text-white text-[11px] font-bold uppercase rounded-lg hover:bg-gray-800 transition-colors shadow-sm">
                    Claim
                  </Link>
                ) : (
                  <button disabled className="px-4 py-2 bg-gray-100 text-gray-400 text-[11px] font-bold uppercase rounded-lg cursor-not-allowed">
                    Locked
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}