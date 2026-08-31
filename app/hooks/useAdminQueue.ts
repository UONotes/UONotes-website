"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { QueueItem } from "@/app/types/admin";

export function useAdminQueue() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchQueue() {
      try {
        setLoading(true);
        const { data: notes, error } = await supabase
          .from("notes")
          .select(`
            id,
            title,
            course_code,
            status,
            created_at,
            flag_reason,
            uploader:profiles!notes_uploader_id_fkey(email),
            reviewer:profiles!notes_reviewed_by_fkey(email)
          `)
          .or("status.in.(pending,flagged),reviewed_by.not.is.null")
          .order("created_at", { ascending: true });

        if (error) throw error;

        const formatted: QueueItem[] = (notes || []).map((note: any) => ({
          id: note.id,
          title: note.title,
          courseCode: note.course_code || "N/A",
          status: note.status,
          submittedAt: note.created_at || new Date().toISOString(),
          uploaderEmail: note.uploader?.email || "Unknown User",
          claimedBy: note.reviewer?.email?.trim() || null,
          flagReason: note.flag_reason || null,
        }));

        setQueue(formatted);
      } catch (err) {
        console.error("Queue fetch exception:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchQueue();
  }, [supabase]);

  return { queue, loading };
}