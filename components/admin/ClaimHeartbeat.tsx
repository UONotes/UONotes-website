"use client";

import { useEffect } from "react";
import { refreshClaimAction } from "@/app/admin/queue/actions";
import { CLAIM_HEARTBEAT_MS } from "@/lib/review";

// Keeps the caller's claim fresh while they have the review page open.
// Once they close the tab the claim stops being refreshed and lapses on
// its own (see lib/review.ts), freeing the note for other directors.
export function ClaimHeartbeat({ noteId }: { noteId: string }) {
  useEffect(() => {
    const beat = () => {
      if (document.visibilityState === "visible") {
        refreshClaimAction(noteId).catch(() => {});
      }
    };
    const timer = window.setInterval(beat, CLAIM_HEARTBEAT_MS);
    document.addEventListener("visibilitychange", beat);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", beat);
    };
  }, [noteId]);

  return null;
}
