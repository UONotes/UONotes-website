"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

/**
 * Live "who's on the admin desk right now", via Supabase Realtime Presence.
 *
 * The channel is private: only admins can join it, enforced by RLS policies
 * on realtime.messages (see the SQL in the analytics PR / setup notes).
 * Without those policies the join fails and everything here quietly
 * reports "not connected" — pages keep working, just without presence.
 */
export const ADMIN_PRESENCE_CHANNEL = "admin-presence";

const IDLE_AFTER_MS = 2 * 60 * 1000;

export type PresenceStatus = "active" | "idle";

type PresencePayload = {
  name: string;
  page: string;
  label: string;
  status: PresenceStatus;
  /** When this admin's page or status last changed. */
  since: string;
};

export type OnlineAdmin = PresencePayload & { userId: string; tabs: number };

type PresenceContextValue = {
  online: Map<string, OnlineAdmin>;
  connected: boolean;
  selfId: string | null;
};

const PresenceContext = createContext<PresenceContextValue>({ online: new Map(), connected: false, selfId: null });

export function useAdminPresence() {
  return useContext(PresenceContext);
}

/** Human label for where an admin is. */
export function pageLabel(pathname: string) {
  if (pathname.startsWith("/admin/review/")) return "Reviewing a note";
  if (pathname.startsWith("/admin/queue")) return "Review queue";
  if (pathname.startsWith("/admin/history")) return "Decision history";
  if (pathname.startsWith("/admin/users")) return "Users";
  if (pathname.startsWith("/admin/analytics")) return "Analytics";
  if (pathname.startsWith("/admin/guidelines")) return "Guidelines";
  if (pathname.startsWith("/admin/settings")) return "Settings";
  return "Overview";
}

/** Active while the tab is visible and the admin has interacted in the last 2 minutes. */
function useActivityStatus(): PresenceStatus {
  const [status, setStatus] = useState<PresenceStatus>("active");
  const lastInput = useRef(0);

  useEffect(() => {
    lastInput.current = Date.now();
    const evaluate = () => {
      const idle = document.visibilityState === "hidden" || Date.now() - lastInput.current > IDLE_AFTER_MS;
      setStatus(idle ? "idle" : "active");
    };
    const onInput = () => {
      lastInput.current = Date.now();
      if (document.visibilityState === "visible") setStatus("active");
    };
    const events = ["pointerdown", "keydown", "wheel", "touchstart", "mousemove"] as const;
    events.forEach((e) => window.addEventListener(e, onInput, { passive: true }));
    document.addEventListener("visibilitychange", evaluate);
    const timer = setInterval(evaluate, 15_000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, onInput));
      document.removeEventListener("visibilitychange", evaluate);
      clearInterval(timer);
    };
  }, []);

  return status;
}

export function AdminPresenceProvider({
  user,
  pathname,
  children,
}: {
  user: { id: string; name: string } | null;
  pathname: string;
  children: React.ReactNode;
}) {
  const status = useActivityStatus();
  const [online, setOnline] = useState<Map<string, OnlineAdmin>>(new Map());
  const [connected, setConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const payloadRef = useRef<PresencePayload | null>(null);

  // What we broadcast about ourselves
  const label = pageLabel(pathname);
  useEffect(() => {
    if (!user) return;
    payloadRef.current = { name: user.name, page: pathname, label, status, since: new Date().toISOString() };
    if (channelRef.current && connected) channelRef.current.track(payloadRef.current);
  }, [user, pathname, label, status, connected]);

  // One channel per admin session, shared by every admin page
  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    let channel: RealtimeChannel | null = null;
    let cancelled = false;

    (async () => {
      // Private channels authorise with the user's JWT
      await supabase.realtime.setAuth();
      if (cancelled) return;
      channel = supabase.channel(ADMIN_PRESENCE_CHANNEL, {
        config: { private: true, presence: { key: user.id } },
      });
      channelRef.current = channel;

      channel
        .on("presence", { event: "sync" }, () => {
          const state = channel!.presenceState<PresencePayload>();
          const next = new Map<string, OnlineAdmin>();
          for (const [userId, tabs] of Object.entries(state)) {
            if (!tabs.length) continue;
            // Several tabs: show the most recently changed active one, else the latest idle one
            const best = [...tabs].sort((a, b) => {
              if (a.status !== b.status) return a.status === "active" ? -1 : 1;
              return new Date(b.since).getTime() - new Date(a.since).getTime();
            })[0];
            next.set(userId, { ...best, userId, tabs: tabs.length });
          }
          setOnline(next);
        })
        .subscribe((s) => {
          const ok = s === "SUBSCRIBED";
          setConnected(ok);
          if (ok && payloadRef.current) channel!.track(payloadRef.current);
        });
    })();

    return () => {
      cancelled = true;
      channelRef.current = null;
      setConnected(false);
      if (channel) supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <PresenceContext.Provider value={{ online, connected, selfId: user?.id ?? null }}>
      {children}
    </PresenceContext.Provider>
  );
}
