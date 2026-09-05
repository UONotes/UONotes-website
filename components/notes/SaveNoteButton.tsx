"use client";

import { useState, useEffect, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

interface SaveNoteButtonProps {
  noteId: string;
  render: (state: { isSaved: boolean; isToggling: boolean; toggle: () => void }) => ReactNode;
}

/** Shares the "is this note saved, and toggle it" logic across every
 * place a save/bookmark button appears, so each usage site only needs
 * to supply its own visual style via the render prop. */
export function SaveNoteButton({ noteId, render }: SaveNoteButtonProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function checkSaved() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const { data } = await supabase
        .from("saved_notes")
        .select("id")
        .eq("user_id", user.id)
        .eq("note_id", noteId)
        .maybeSingle();

      if (!cancelled) setIsSaved(!!data);
    }

    checkSaved();
    return () => { cancelled = true; };
  }, [noteId]);

  async function toggle() {
    if (isToggling) return;
    setIsToggling(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setIsToggling(false);
      return;
    }

    if (isSaved) {
      await supabase.from("saved_notes").delete().eq("user_id", user.id).eq("note_id", noteId);
      setIsSaved(false);
    } else {
      await supabase.from("saved_notes").insert({ user_id: user.id, note_id: noteId });
      setIsSaved(true);
    }

    setIsToggling(false);
  }

  return <>{render({ isSaved, isToggling, toggle })}</>;
}