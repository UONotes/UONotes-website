"use server";

import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createR2Client, R2_BUCKET_NAME } from "@/lib/r2";

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

// Lets a student push a corrected file onto a note that's sitting at
// "changes_requested". Reuses the existing note row (same id, same
// listing once approved) rather than creating a duplicate submission.
// The actual file bytes are uploaded to R2 client-side beforehand via
// the same presigned-URL flow /api/notes/upload-url already exposes —
// this action only ever touches the database row, and only if the
// caller owns it and it's still genuinely awaiting their fixes.
export async function resubmitNoteAction(
  noteId: string,
  fileKey: string,
  fileSize: number,
  fileType: string
) {
  const supabase = await createServerClient();
  const { data: { user: caller }, error: authError } = await supabase.auth.getUser();

  if (authError || !caller) {
    throw new Error("You must be signed in to resubmit a document.");
  }

  if (!fileKey || typeof fileSize !== "number" || !fileType) {
    throw new Error("Missing file details for resubmission.");
  }

  const { data: updatedNote, error: updateError } = await supabaseAdmin
    .from("notes")
    .update({
      file_key: fileKey,
      file_size: fileSize,
      file_type: fileType,
      status: "pending",
      reviewed_by: null,
      // Deliberately NOT clearing flag_reason / reviewed_at here. The
      // previous "changes requested" note stays attached to the row so
      // the next reviewer can see this was already bounced back once —
      // it only gets overwritten once a new decision (approve/reject/
      // changes_requested again) is made in reviewNoteAction.
    })
    .eq("id", noteId)
    .eq("uploader_id", caller.id)
    .eq("status", "changes_requested")
    .select("id")
    .single();

  if (updateError || !updatedNote) {
    console.error("Failed to resubmit note:", updateError);
    throw new Error(
      "Could not resubmit your document. It may have already been updated elsewhere — refresh and try again."
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/admin/queue");
  return { success: true };
}

// Generates a short-lived download link for the optional document a
// reviewer attached to their "changes requested" feedback. Only the
// note's own uploader can fetch it — this keeps R2 credentials
// server-side while still letting the student view what the admin
// attached.
export async function getFeedbackAttachmentUrlAction(noteId: string): Promise<string> {
  const supabase = await createServerClient();
  const { data: { user: caller }, error: authError } = await supabase.auth.getUser();

  if (authError || !caller) {
    throw new Error("You must be signed in to view this attachment.");
  }

  const { data: note, error: noteError } = await supabaseAdmin
    .from("notes")
    .select("uploader_id, feedback_attachment_key")
    .eq("id", noteId)
    .single();

  if (noteError || !note || note.uploader_id !== caller.id) {
    throw new Error("Could not find that attachment.");
  }

  if (!note.feedback_attachment_key) {
    throw new Error("No attachment is available for this submission.");
  }

  const r2 = createR2Client();
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: note.feedback_attachment_key,
  });

  return getSignedUrl(r2, command, { expiresIn: 3600 });
}