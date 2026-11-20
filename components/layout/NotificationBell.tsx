"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCircle2, XCircle, Wrench, CheckCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Notification = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

const KIND_ICON: Record<string, { icon: typeof Bell; color: string }> = {
  note_approved: { icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
  note_approved_with_fixes: { icon: CheckCheck, color: "text-emerald-600 bg-emerald-50" },
  note_in_revision: { icon: Wrench, color: "text-orange-600 bg-orange-50" },
  note_rejected: { icon: XCircle, color: "text-rose-600 bg-rose-50" },
  note_removed: { icon: XCircle, color: "text-rose-600 bg-rose-50" },
  sent_back: { icon: Wrench, color: "text-orange-600 bg-orange-50" },
  fix_sent_back: { icon: Wrench, color: "text-orange-600 bg-orange-50" },
};

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function NotificationBell() {
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Refetch on navigation so a decision made while the student browses
  // shows up without a full reload.
  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("notifications")
      .select("id, kind, title, body, link, read_at, created_at")
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (!cancelled && data) setItems(data);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, [open]);

  const unread = items.filter((n) => !n.read_at);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unread.length > 0) {
      const now = new Date().toISOString();
      const ids = unread.map((n) => n.id);
      setItems((prev) => prev.map((n) => (ids.includes(n.id) ? { ...n, read_at: now } : n)));
      await createClient().from("notifications").update({ read_at: now }).in("id", ids);
    }
  }

  return (
    // Not positioned below laptop width, so the dropdown lines up with the
    // navbar's edges instead of hanging off the bell.
    <div className="lg:relative" ref={menuRef}>
      <button
        onClick={toggle}
        className="relative flex items-center justify-center h-11 w-11 border-2 border-dashed border-brand-red/40 text-brand-red transition-colors hover:border-solid hover:border-brand-red hover:bg-brand-red/5 active:scale-95"
        aria-label={unread.length > 0 ? `Notifications (${unread.length} unread)` : "Notifications"}
      >
        <Bell className="w-4 h-4 text-brand-red" />
        {unread.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-brand-red text-white text-[10px] font-bold flex items-center justify-center">
            {unread.length > 9 ? "9+" : unread.length}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-x-4 top-full z-50 mt-2 min-[380px]:inset-x-6 sm:left-auto sm:right-10 sm:w-[22rem] lg:right-0 lg:mt-4 origin-top overflow-hidden bg-white py-2 shadow-[0_20px_34px_-18px_rgba(0,0,0,0.4)] border-t-2 border-[#e39aa1]"
          >
            <div className="px-4 py-2 border-b border-brand-red/10">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-500 font-bold">
                {"// NOTIFICATIONS"}
              </span>
            </div>

            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-gray-400">
                Nothing yet. You&apos;ll hear from us here when your notes are reviewed.
              </p>
            ) : (
              <ul className="max-h-96 overflow-y-auto divide-y divide-gray-100">
                {items.map((n) => {
                  const meta = KIND_ICON[n.kind] ?? { icon: Bell, color: "text-gray-500 bg-gray-50" };
                  const Icon = meta.icon;
                  return (
                    <li key={n.id}>
                      <Link
                        href={n.link || "/dashboard"}
                        onClick={() => setOpen(false)}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-brand-red/5 transition-colors"
                      >
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${meta.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-xs font-bold text-gray-900">{n.title}</span>
                          {n.body && <span className="block text-xs text-gray-600 leading-relaxed mt-0.5">{n.body}</span>}
                          <span className="block text-[10px] text-gray-400 mt-1">{timeAgo(n.created_at)}</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
