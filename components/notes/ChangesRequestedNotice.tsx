"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { RotateCcw, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const SEEN_STORAGE_KEY = "uonotes:seenChangesRequested";

type FlaggedNote = {
  id: string;
  title: string;
  course_code: string;
  reviewed_at: string | null;
};

function readSeenMap(): Record<string, string> {
  try {
    const raw = window.localStorage.getItem(SEEN_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeSeenMap(map: Record<string, string>) {
  try {
    window.localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Private browsing / storage disabled — the popup will just
    // reappear next visit, which is an acceptable fallback.
  }
}

export function ChangesRequestedNotice() {
  const [notes, setNotes] = useState<FlaggedNote[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const { data, error } = await supabase
        .from("notes")
        .select("id, title, course_code, reviewed_at")
        .eq("uploader_id", user.id)
        .eq("status", "changes_requested");

      if (error || !data || data.length === 0 || cancelled) return;

      const seen = readSeenMap();
      const unseen = data.filter((note) => seen[note.id] !== (note.reviewed_at ?? ""));

      if (unseen.length > 0 && !cancelled) {
        setNotes(data);
        setVisible(true);
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, []);

  function acknowledge() {
    const seen = readSeenMap();
    notes.forEach((note) => {
      seen[note.id] = note.reviewed_at ?? "";
    });
    writeSeenMap(seen);
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full border border-orange-200 relative overflow-hidden"
          >
            <div className="flex justify-between items-start mb-5">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                <RotateCcw className="w-6 h-6" />
              </div>
              <button
                onClick={acknowledge}
                className="p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors cursor-pointer"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h3 className="text-xl font-black text-gray-900 tracking-tight mb-2">
              {notes.length === 1 ? "A submission needs a fix" : `${notes.length} submissions need fixes`}
            </h3>
            <p className="text-sm text-gray-500 mb-5 leading-relaxed">
              A reviewer asked for changes before {notes.length === 1 ? "it" : "they"} can be published:
            </p>

            <ul className="mb-6 space-y-2 max-h-40 overflow-y-auto">
              {notes.map((note) => (
                <li
                  key={note.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-orange-50/60 border border-orange-100 text-sm"
                >
                  <span className="font-mono text-[10px] font-bold text-orange-600 uppercase shrink-0">
                    {note.course_code}
                  </span>
                  <span className="font-semibold text-gray-800 truncate">{note.title}</span>
                </li>
              ))}
            </ul>

            <div className="flex gap-3">
              <button
                onClick={acknowledge}
                className="flex-1 py-3 bg-white border border-gray-200 text-gray-600 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Later
              </button>
              <Link
                href="/dashboard"
                onClick={acknowledge}
                className="flex-1 py-3 bg-orange-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-orange-700 transition-colors text-center shadow-sm"
              >
                View & Fix
              </Link>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}