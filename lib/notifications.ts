import type { SupabaseClient } from "@supabase/supabase-js";
import { Resend } from "resend";

// SERVER-ONLY. Tells a submitter what happened to their note, both in
// the in-app notification bell and by email. Neither channel failing
// should ever undo a review decision, so errors are logged, not thrown.

const resend = new Resend(process.env.RESEND_API_KEY);
const DASHBOARD_URL = "https://uonotes.ca/dashboard";

export type NoteNotificationKind =
  | "note_approved"
  | "note_approved_with_fixes"
  | "note_rejected"
  | "note_removed"
  | "note_in_revision";

type NoteInfo = {
  id: string;
  title: string;
  course_code: string;
  uploader_id: string | null;
  author_email: string | null;
};

function compose(kind: NoteNotificationKind, note: NoteInfo, message: string | null, hours: number | null) {
  const label = `"${note.title}" (${note.course_code})`;
  const hoursLine = hours != null ? ` You've been awarded ${hours} volunteer hour${hours === 1 ? "" : "s"}.` : "";
  const messageBlock = message ? `\n\nNote from the reviewer:\n"${message}"` : "";

  switch (kind) {
    case "note_approved":
      return {
        title: "Your note was accepted",
        body: `${label} is now published on UONotes.${hoursLine}`,
        subject: `Accepted: "${note.title}"`,
        text: `Good news — your submission ${label} was accepted and is now published on UONotes.${hoursLine}${messageBlock}`,
      };
    case "note_approved_with_fixes":
      return {
        title: "Your note was accepted with fixes",
        body: `A director made some corrections to ${label} and published it.${hoursLine}`,
        subject: `Accepted with fixes: "${note.title}"`,
        text: `Your submission ${label} was accepted. A member of the notes team made a few corrections before publishing it, so the live version may differ slightly from what you uploaded.${hoursLine}${messageBlock}`,
      };
    case "note_in_revision":
      return {
        title: "Your note is being fixed",
        body: `A director is making a few corrections to ${label} before publishing it. You don't need to do anything.`,
        subject: `Undergoing fixes: "${note.title}"`,
        text: `A member of the notes team is making a few corrections to your submission ${label} before it's published. You don't need to do anything — we'll let you know once it's live.${messageBlock}`,
      };
    case "note_rejected":
      return {
        title: "Your note wasn't accepted",
        body: `${label} wasn't accepted.${message ? ` Reason: ${message}` : ""}`,
        subject: `Not accepted: "${note.title}"`,
        text: `Thanks for submitting ${label}. Unfortunately it wasn't accepted this time.${messageBlock}`,
      };
    case "note_removed":
      return {
        title: "Your note was removed",
        body: `${label} was removed after a review of a community report.${message ? ` Reason: ${message}` : ""}`,
        subject: `Removed: "${note.title}"`,
        text: `Your published note ${label} was reviewed after a community report and has been removed from UONotes.${messageBlock}`,
      };
  }
}

export async function notifyNoteOwner(
  supabaseAdmin: SupabaseClient,
  kind: NoteNotificationKind,
  note: NoteInfo,
  { message = null, hours = null }: { message?: string | null; hours?: number | null } = {}
) {
  const content = compose(kind, note, message?.trim() || null, hours);

  if (note.uploader_id) {
    const { error } = await supabaseAdmin.from("notifications").insert({
      user_id: note.uploader_id,
      kind,
      title: content.title,
      body: content.body,
      note_id: note.id,
      link: "/dashboard",
    });
    if (error) console.error(`Failed to store ${kind} notification:`, error);
  }

  if (note.author_email) {
    try {
      await resend.emails.send({
        from: "UONotes <noreply@uonotes.ca>",
        to: note.author_email,
        subject: content.subject,
        text: `Hi,\n\n${content.text}\n\nSee all your submissions on your dashboard:\n${DASHBOARD_URL}\n\n— UONotes`,
      });
    } catch (emailError) {
      console.error(`Failed to send ${kind} email:`, emailError);
    }
  }
}

// In-app only: tells the director who sent a note to final check that
// VP Notes sent it back to pending.
export async function notifySentBack(
  supabaseAdmin: SupabaseClient,
  directorId: string,
  note: { id: string; title: string; course_code: string },
  reason: string
) {
  const { error } = await supabaseAdmin.from("notifications").insert({
    user_id: directorId,
    kind: "sent_back",
    title: "A note you reviewed was sent back",
    body: `VP Notes sent "${note.title}" (${note.course_code}) back to pending: ${reason}`,
    note_id: note.id,
    link: `/admin/review/${note.id}`,
  });
  if (error) console.error("Failed to store sent_back notification:", error);
}
