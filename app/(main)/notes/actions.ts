"use server";

import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Each reporter gets their own row in note_reports, so a second report
// adds to the pile instead of overwriting the first reporter's reason
// and identity. Reporting the same note again just updates your own
// open report.
export async function reportNoteAction(noteId: string, reason: string) {
  const supabase = await createServerClient();
  const { data: { user: caller }, error: authError } = await supabase.auth.getUser();

  if (authError || !caller) {
    throw new Error("You must be signed in to report a document.");
  }

  if (!reason || reason.trim().length === 0) {
    throw new Error("Please select a reason for the report.");
  }

  const { data: note } = await supabaseAdmin
    .from("notes")
    .select("status")
    .eq("id", noteId)
    .single();

  // Only published notes (or ones already under report) can be reported.
  if (!note || (note.status !== "approved" && note.status !== "flagged")) {
    throw new Error("This document can't be reported right now.");
  }

  const { data: existing } = await supabaseAdmin
    .from("note_reports")
    .select("id")
    .eq("note_id", noteId)
    .eq("reporter_id", caller.id)
    .is("resolved_at", null)
    .maybeSingle();

  const { error: reportError } = existing
    ? await supabaseAdmin
        .from("note_reports")
        .update({ reason: reason.trim(), created_at: new Date().toISOString() })
        .eq("id", existing.id)
    : await supabaseAdmin
        .from("note_reports")
        .insert({ note_id: noteId, reporter_id: caller.id, reason: reason.trim() });

  if (reportError) {
    console.error("Failed to save report:", reportError);
    throw new Error("Could not submit your report. Please try again.");
  }

  // First report pulls the note into the review queue. Later reports
  // just add to it.
  if (note.status === "approved") {
    const { error: updateError } = await supabaseAdmin
      .from("notes")
      .update({ status: "flagged" })
      .eq("id", noteId)
      .eq("status", "approved");

    if (updateError) {
      console.error("Failed to flag note:", updateError);
      throw new Error("Could not submit your report. Please try again.");
    }
  }

  revalidatePath("/admin/queue");
  return { success: true };
}
