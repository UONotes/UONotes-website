"use server";

import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function reportNoteAction(noteId: string, reason: string) {
  const supabase = await createServerClient();
  const { data: { user: caller }, error: authError } = await supabase.auth.getUser();

  if (authError || !caller) {
    throw new Error("You must be signed in to report a document.");
  }

  if (!reason || reason.trim().length === 0) {
    throw new Error("Please select a reason for the report.");
  }

  const { error: updateError } = await supabaseAdmin
    .from("notes")
    .update({
      status: "flagged",
      flag_reason: reason.trim(),
      flagged_by: caller.id,
    })
    .eq("id", noteId);

  if (updateError) {
    console.error("Failed to flag note:", updateError);
    throw new Error("Could not submit your report. Please try again.");
  }

  revalidatePath("/admin/queue");
  return { success: true };
}