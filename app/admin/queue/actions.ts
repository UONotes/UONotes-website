"use server";

import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

export async function claimNoteAction(noteId: string) {
  const supabase = await createServerClient();
  const { data: { user: caller } } = await supabase.auth.getUser();

  if (!caller) throw new Error("Unauthorized");

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", caller.id)
    .single();

  if (!callerProfile?.is_admin) throw new Error("Insufficient privileges.");

  const { data: targetNote } = await supabaseAdmin
    .from("notes")
    .select("status")
    .eq("id", noteId)
    .single();

  if (targetNote?.status === "changes_requested") {
    throw new Error(
      "This document is awaiting fixes from the student and can't be claimed for review until they resubmit."
    );
  }

  const { error: claimError } = await supabaseAdmin
    .from("notes")
    .update({ reviewed_by: caller.id })
    .eq("id", noteId)
    .is("reviewed_by", null);

  if (claimError) {
    throw new Error("Failed to claim document for review.");
  }

  return { success: true };
}

export async function reviewNoteAction(
  noteId: string,
  status: "approved" | "rejected" | "changes_requested",
  reason: string,
  hoursAwarded?: number,
  attachmentKey?: string
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

  const { data: existingNote } = await supabaseAdmin
    .from("notes")
    .select("status")
    .eq("id", noteId)
    .single();

  if (existingNote?.status === "changes_requested") {
    throw new Error(
      "This document is awaiting fixes from the student and can't be reviewed again until they resubmit."
    );
  }

  const { data: updatedNote, error: updateError } = await supabaseAdmin
    .from("notes")
    .update({
      status: status,
      reviewed_by: null,
      reviewed_at: new Date().toISOString(),
      flag_reason: status === "approved" ? null : reason,
      flagged_by: status === "approved" ? null : undefined,
      hours_awarded: status === "approved" ? (hoursAwarded ?? 1) : null,
      // Only "changes requested" decisions carry a reviewer attachment.
      // A fresh decision always replaces (or clears) whatever attachment
      // was left from a previous round, same as flag_reason above.
      feedback_attachment_key: status === "changes_requested" ? (attachmentKey || null) : null,
    })
    .eq("id", noteId)
    .select("uploader_id, title, course_code, author_email")
    .single();

  if (updateError) {
    console.error("Failed to update note status:", updateError);
    throw new Error(`Database update failed: ${updateError.message}`);
  }

  const actionString = 
  status === "approved" ? "NOTE_APPROVED" : 
  status === "rejected" ? "NOTE_REJECTED" : "NOTE_CHANGES_REQUESTED";

await supabaseAdmin.from("admin_audit_log").insert({
  admin_id: caller.id,
  target_type: "note",
  target_id: noteId,
  action_type: actionString,
  details: {
    note_owner_id: updatedNote?.uploader_id ?? null,
    note_title: updatedNote?.title ?? null,
    course_code: updatedNote?.course_code ?? null,
    decision: status,
    reason: reason || null,
    attachment_key: status === "changes_requested" ? (attachmentKey || null) : null,
  },
});

  if (status === "changes_requested" && updatedNote?.author_email) {
    try {
      const attachmentLine = attachmentKey
        ? "\n\nThe reviewer also attached a document to help explain the requested fixes — you'll find it on your dashboard alongside the feedback."
        : "";
      await resend.emails.send({
        from: "UONotes <noreply@uonotes.ca>",
        to: updatedNote.author_email,
        subject: `Changes requested on "${updatedNote.title}"`,
        text: `Hi,\n\nA reviewer looked at your submission "${updatedNote.title}" (${updatedNote.course_code}) and asked for a few fixes before it can be published:\n\n"${reason}"${attachmentLine}\n\nHead to your UONotes dashboard to see the full note and upload a corrected file:\nhttps://uo-notes-website.vercel.app/dashboard\n\n— UONotes`,
      });
    } catch (emailError) {
      // Don't fail the review action over a flaky email send — the
      // in-app notice on next login still covers this.
      console.error("Failed to send changes_requested email:", emailError);
    }
  }

  revalidatePath("/admin/queue");
  return { success: true };
}

export async function releaseNoteLockAction(noteId: string) {
  console.log("[releaseNoteLockAction] called with noteId:", JSON.stringify(noteId));

  const supabase = await createServerClient();
  const { data: { user: caller } } = await supabase.auth.getUser();

  if (!caller) throw new Error("Unauthorized");

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", caller.id)
    .single();

  if (!callerProfile?.is_admin) throw new Error("Insufficient privileges.");

  const { data: released, error: releaseError } = await supabaseAdmin
    .from("notes")
    .update({ reviewed_by: null })
    .eq("id", noteId)
    .select("id, reviewed_by");

  console.log("[releaseNoteLockAction] update result:", { released, releaseError });

  if (releaseError) {
    console.error("Failed to release note lock:", releaseError);
    throw new Error("Failed to unlock document in database.");
  }

  if (!released || released.length === 0) {
    throw new Error(`Release matched zero rows for noteId ${noteId} — check the ID being passed in.`);
  }

  revalidatePath("/admin/queue");
  return { success: true };
}