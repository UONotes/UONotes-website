"use server";

import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function reviewNoteAction(
  noteId: string,
  status: "approved" | "rejected" | "changes_requested",
  reason: string
) {
  const supabase = await createServerClient();
  const { data: { user: caller }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !caller) throw new Error("Unauthorized access attempt.");

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", caller.id)
    .single();

  if (!callerProfile?.is_admin) throw new Error("Insufficient privileges.");

  const { error: updateError } = await supabaseAdmin
    .from("notes")
    .update({
      status: status,
      reviewed_by: null,
      reviewed_at: new Date().toISOString(),
      flag_reason: status === "approved" ? null : reason, 
    })
    .eq("id", noteId);

  if (updateError) {
    console.error("Failed to update note status:", updateError);
    throw new Error(`Database update failed: ${updateError.message}`);
  }

  const actionString = 
    status === "approved" ? "NOTE_APPROVED" : 
    status === "rejected" ? "NOTE_REJECTED" : "NOTE_CHANGES_REQUESTED";

  await supabaseAdmin.from("audit_logs").insert({
    target_user_id: caller.id, 
    action_by_admin_id: caller.id,
    action_type: actionString,
    reasons: [reason || "No reason provided"],
    custom_note: `Moderated note ID ${noteId} with decision: ${status.toUpperCase()}. Feedback: ${reason}`,
  });

  revalidatePath("/admin/queue");
  return { success: true };
}

export async function releaseNoteLockAction(noteId: string) {
  const supabase = await createServerClient();
  const { data: { user: caller } } = await supabase.auth.getUser();
  
  if (!caller) throw new Error("Unauthorized");

  const { error: releaseError } = await supabaseAdmin
    .from("notes")
    .update({ reviewed_by: null })
    .eq("id", noteId);

  if (releaseError) {
    console.error("Failed to release note lock:", releaseError);
    throw new Error("Failed to unlock document in database.");
  }

  revalidatePath("/admin/queue");
  return { success: true };
}