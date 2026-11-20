"use server";

import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { HeadObjectCommand } from "@aws-sdk/client-s3";
import { createR2Client, R2_BUCKET_NAME } from "@/lib/r2";
import { isAllowedFileType, isAllowedFileSize } from "@/lib/fileValidation";
import { canFinalCheck, lockDurationFor, REQUIRE_SECOND_REVIEWER } from "@/lib/review";
import { notifyNoteOwner, notifySentBack } from "@/lib/notifications";
import { isStaff } from "@/lib/admin";

// Review chain:
//   pending / flagged ──(director)──► fix_review ("Final check")
//        │                                  │
//        └─(director: fix it)─► in_revision ┘
//   fix_review ──(VP Notes / super admin)──► approved | rejected | back to pending
// Directors only ever recommend; VP Notes is the only one who publishes or
// denies.

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const NOTE_FIELDS =
  "id, status, reviewed_by, claimed_at, uploader_id, title, course_code, author_email, hours_awarded, file_key, original_file_key, " +
  "corrected_file_key, corrected_file_size, corrected_file_type, fix_message, fixed_by, " +
  "checked_by, recommendation, recommendation_note, recommended_hours";

type NoteRow = {
  id: string;
  status: string;
  reviewed_by: string | null;
  claimed_at: string | null;
  uploader_id: string | null;
  title: string;
  course_code: string;
  author_email: string | null;
  hours_awarded: number | null;
  file_key: string;
  original_file_key: string | null;
  corrected_file_key: string | null;
  corrected_file_size: number | null;
  corrected_file_type: string | null;
  fix_message: string | null;
  fixed_by: string | null;
  checked_by: string | null;
  recommendation: "approve" | "reject" | null;
  recommendation_note: string | null;
  recommended_hours: number | null;
};

// Wipes an in-progress fix off the note once it's decided or abandoned.
const CLEARED_FIX = {
  corrected_file_key: null,
  corrected_file_size: null,
  corrected_file_type: null,
  fix_message: null,
  fixed_by: null,
  fix_return_note: null,
};

// Wipes the director's recommendation once VP Notes has acted on it.
const CLEARED_CHECK = {
  checked_by: null,
  checked_at: null,
  recommendation: null,
  recommendation_note: null,
  recommended_hours: null,
};

// Clears the "sent back by VP Notes" marker once the note is decided.
const CLEARED_RETURN = {
  returned_by: null,
  returned_at: null,
  return_note: null,
};

async function requireAdmin() {
  const supabase = await createServerClient();
  const { data: { user: caller }, error: authError } = await supabase.auth.getUser();
  if (authError || !caller) throw new Error("Unauthorized");

  const { data: callerProfile } = await supabase
    .from("profiles")
    // "*" rather than named columns, so a missing role column (e.g. a
    // migration not run yet) can't make the whole lookup fail and
    // silently strip someone's permissions.
    .select("*")
    .eq("id", caller.id)
    .single();

  if (!isStaff(callerProfile)) throw new Error("Insufficient privileges.");
  return {
    caller,
    isFinalChecker: canFinalCheck(callerProfile),
    isSuperAdmin: Boolean(callerProfile.is_super_admin),
  };
}

async function requireFinalChecker() {
  const { caller, isFinalChecker, isSuperAdmin } = await requireAdmin();
  if (!isFinalChecker) throw new Error("Only VP Notes or a super admin can do the final check.");
  return { caller, isSuperAdmin };
}

async function loadNote(noteId: string): Promise<NoteRow> {
  const { data: note } = await supabaseAdmin.from("notes").select(NOTE_FIELDS).eq("id", noteId).single();
  if (!note) throw new Error("That note no longer exists.");
  return note as unknown as NoteRow;
}

// Every decision requires the caller to hold the claim. If their claim
// lapsed but nobody else picked the note up, it's still theirs — the
// conditional updates below (.eq("reviewed_by", caller.id)) are what
// actually guarantees nobody else snuck in.
function assertHoldsClaim(note: NoteRow, callerId: string) {
  if (note.reviewed_by !== callerId) {
    throw new Error("You no longer have this note claimed. Refresh to see who has it.");
  }
}

// Super admins can always sign off, even on notes they sent up themselves.
function assertNotOwnCheck(note: NoteRow, callerId: string, isSuperAdmin: boolean) {
  if (REQUIRE_SECOND_REVIEWER && !isSuperAdmin && note.checked_by === callerId) {
    throw new Error("You sent this note to final check, so someone else has to do the final check.");
  }
}

async function hasOpenReports(noteId: string) {
  const { count } = await supabaseAdmin
    .from("note_reports")
    .select("id", { count: "exact", head: true })
    .eq("note_id", noteId)
    .is("resolved_at", null);
  return (count ?? 0) > 0;
}

async function resolveReports(noteId: string, callerId: string, resolution: "dismissed" | "upheld" | "fixed") {
  const { error } = await supabaseAdmin
    .from("note_reports")
    .update({ resolved_at: new Date().toISOString(), resolved_by: callerId, resolution })
    .eq("note_id", noteId)
    .is("resolved_at", null);
  if (error) console.error("Failed to resolve reports:", error);
}

async function logAction(
  callerId: string,
  note: NoteRow,
  actionType: string,
  extra: Record<string, unknown> = {}
) {
  await supabaseAdmin.from("admin_audit_log").insert({
    admin_id: callerId,
    target_type: "note",
    target_id: note.id,
    action_type: actionType,
    details: {
      note_owner_id: note.uploader_id ?? null,
      note_title: note.title ?? null,
      course_code: note.course_code ?? null,
      ...extra,
    },
  });
}

function revalidateReviewPaths(noteId: string) {
  revalidatePath("/admin/queue");
  revalidatePath(`/admin/review/${noteId}`);
  revalidatePath("/dashboard");
}

// Runs a status change that only applies if the caller still holds the
// claim and the status hasn't moved since we read it.
async function updateClaimedNote(note: NoteRow, callerId: string, changes: Record<string, unknown>, failMessage: string) {
  const { data: updatedRows, error } = await supabaseAdmin
    .from("notes")
    .update(changes)
    .eq("id", note.id)
    .eq("reviewed_by", callerId)
    .eq("status", note.status)
    .select("id");

  if (error || !updatedRows || updatedRows.length === 0) {
    console.error(failMessage, error);
    throw new Error(`${failMessage} Refresh and try again.`);
  }
}

export async function claimNoteAction(noteId: string) {
  const { caller, isFinalChecker, isSuperAdmin } = await requireAdmin();
  const note = await loadNote(noteId);

  if (!["pending", "flagged", "in_revision", "fix_review"].includes(note.status)) {
    throw new Error("This note has already been decided.");
  }
  if (note.status === "fix_review") {
    if (!isFinalChecker) throw new Error("Only VP Notes or a super admin can do the final check.");
    assertNotOwnCheck(note, caller.id, isSuperAdmin);
  }

  // Claims expire (see lib/review.ts), so a note held by a director who
  // went inactive can be picked up. The filter keeps this atomic: the
  // row only changes if it's unclaimed, already ours, or its claim has
  // lapsed — and only if its status hasn't moved under us.
  const cutoff = new Date(Date.now() - lockDurationFor(note.status)).toISOString();
  const { data: claimedRows, error: claimError } = await supabaseAdmin
    .from("notes")
    .update({ reviewed_by: caller.id, claimed_at: new Date().toISOString() })
    .eq("id", noteId)
    .eq("status", note.status)
    .or(`reviewed_by.is.null,reviewed_by.eq.${caller.id},claimed_at.is.null,claimed_at.lt."${cutoff}"`)
    .select("id");

  if (claimError) {
    console.error("Failed to claim note:", claimError);
    throw new Error("Failed to claim document for review.");
  }

  if (!claimedRows || claimedRows.length === 0) {
    throw new Error("Someone else has this note claimed. Refresh to see who has it.");
  }

  if (note.status === "in_revision" && note.reviewed_by && note.reviewed_by !== caller.id) {
    await logAction(caller.id, note, "NOTE_FIXES_TAKEN_OVER", { previous_reviewer: note.reviewed_by });
  }

  revalidatePath("/admin/queue");
  return { success: true };
}

// Called periodically while the review page is open so an active
// director's claim never lapses mid-review.
export async function refreshClaimAction(noteId: string) {
  const { caller } = await requireAdmin();
  await supabaseAdmin
    .from("notes")
    .update({ claimed_at: new Date().toISOString() })
    .eq("id", noteId)
    .eq("reviewed_by", caller.id);
  return { success: true };
}

export async function releaseNoteLockAction(noteId: string) {
  const { caller } = await requireAdmin();

  // Only your own claim can be released, and notes being fixed are let
  // go through cancelFixesAction instead, so walking away from the page
  // never silently drops a fix in progress.
  const { error: releaseError } = await supabaseAdmin
    .from("notes")
    .update({ reviewed_by: null, claimed_at: null })
    .eq("id", noteId)
    .eq("reviewed_by", caller.id)
    .neq("status", "in_revision");

  if (releaseError) {
    console.error("Failed to release note lock:", releaseError);
    throw new Error("Failed to unlock document in database.");
  }

  revalidatePath("/admin/queue");
  return { success: true };
}

// A director's verdict on a pending or reported note. Nothing is
// published or rejected here: the note goes to final check with the
// recommendation attached, for VP Notes to act on.
export async function sendToFinalCheckAction(
  noteId: string,
  recommendation: "approve" | "reject",
  note_: string,
  hoursAwarded?: number
) {
  const { caller } = await requireAdmin();
  const note = await loadNote(noteId);
  assertHoldsClaim(note, caller.id);

  if (!["pending", "flagged", "in_revision"].includes(note.status)) {
    throw new Error("This note isn't waiting on a review.");
  }
  if (recommendation === "approve" && note.status === "in_revision") {
    throw new Error("Upload the corrected file, or stop fixing to recommend the original.");
  }
  if (recommendation === "reject" && note_.trim().length < 10) {
    throw new Error("Add a brief explanation (10+ characters) for recommending rejection.");
  }

  const wasPublished = note.status === "flagged" || (await hasOpenReports(noteId));
  const hours = recommendation === "approve"
    ? (wasPublished ? (note.hours_awarded ?? 1) : Math.max(1, hoursAwarded ?? 1))
    : null;

  await updateClaimedNote(
    note,
    caller.id,
    {
      status: "fix_review",
      reviewed_by: null,
      claimed_at: null,
      checked_by: caller.id,
      checked_at: new Date().toISOString(),
      recommendation,
      recommendation_note: note_.trim() || null,
      recommended_hours: hours,
      // A rejection recommendation drops any half-finished fix.
      ...(note.status === "in_revision" ? CLEARED_FIX : {}),
    },
    "Couldn't send this note to final check."
  );

  await logAction(caller.id, note, "NOTE_SENT_TO_FINAL_CHECK", {
    recommendation,
    reason: note_.trim() || null,
    from_status: note.status,
  });

  revalidateReviewPaths(noteId);
  return { success: true };
}

// Director takes on fixing the note themselves. It stays claimed to them
// (with a much longer lock, since the fixing happens offline) and the
// submitter is told it's being worked on.
export async function startFixesAction(noteId: string, message: string) {
  const { caller } = await requireAdmin();
  const note = await loadNote(noteId);
  assertHoldsClaim(note, caller.id);

  if (note.status !== "pending" && note.status !== "flagged") {
    throw new Error("Only pending or reported notes can be sent for fixes.");
  }

  await updateClaimedNote(
    note,
    caller.id,
    { status: "in_revision", claimed_at: new Date().toISOString() },
    "Couldn't mark this note as being fixed."
  );

  await logAction(caller.id, note, "NOTE_FIXES_STARTED", { reason: message.trim() || null, from_status: note.status });
  await notifyNoteOwner(supabaseAdmin, "note_in_revision", note, { message });

  revalidateReviewPaths(noteId);
  return { success: true };
}

// Backs out of fixing: the note returns to the queue unclaimed, as a
// report again if it came from one.
export async function cancelFixesAction(noteId: string) {
  const { caller } = await requireAdmin();
  const note = await loadNote(noteId);
  assertHoldsClaim(note, caller.id);

  if (note.status !== "in_revision") throw new Error("This note isn't being fixed.");

  const backTo = (await hasOpenReports(noteId)) ? "flagged" : "pending";
  await updateClaimedNote(
    note,
    caller.id,
    { status: backTo, reviewed_by: null, claimed_at: null, ...CLEARED_FIX },
    "Couldn't stop fixing this note."
  );

  await logAction(caller.id, note, "NOTE_FIXES_CANCELLED", { to_status: backTo });

  revalidateReviewPaths(noteId);
  return { success: true };
}

// The fixing director hands in their corrected file. Nothing is
// published yet: the note goes to final check, where VP Notes compares
// it with the original.
export async function submitFixAction(noteId: string, correctedFileKey: string, message: string, hoursAwarded: number) {
  const { caller } = await requireAdmin();
  const note = await loadNote(noteId);
  assertHoldsClaim(note, caller.id);

  if (note.status !== "in_revision") throw new Error("This note isn't being fixed.");
  if (message.trim().length < 10) {
    throw new Error("Describe what you fixed (10+ characters).");
  }
  if (!correctedFileKey.startsWith("notes/")) throw new Error("Invalid corrected file.");

  // Trust what actually landed in storage, not what the browser claims.
  let head;
  try {
    head = await createR2Client().send(new HeadObjectCommand({ Bucket: R2_BUCKET_NAME, Key: correctedFileKey }));
  } catch {
    throw new Error("The corrected file didn't finish uploading. Please try again.");
  }
  const fileSize = head.ContentLength ?? 0;
  const fileType = head.ContentType ?? "";
  if (!isAllowedFileType(fileType) || !isAllowedFileSize(fileSize)) {
    throw new Error("The corrected file must be a PDF, DOCX, PPTX, PNG or JPG under 25MB.");
  }

  const wasPublished = await hasOpenReports(noteId);

  await updateClaimedNote(
    note,
    caller.id,
    {
      status: "fix_review",
      reviewed_by: null,
      claimed_at: null,
      corrected_file_key: correctedFileKey,
      corrected_file_size: fileSize,
      corrected_file_type: fileType,
      fix_message: message.trim(),
      fixed_by: caller.id,
      fix_return_note: null,
      checked_by: caller.id,
      checked_at: new Date().toISOString(),
      recommendation: "approve",
      recommendation_note: message.trim(),
      recommended_hours: wasPublished ? (note.hours_awarded ?? 1) : Math.max(1, hoursAwarded || 1),
    },
    "Couldn't submit your fix."
  );

  await logAction(caller.id, note, "NOTE_FIX_SUBMITTED", {
    reason: message.trim(),
    corrected_file_key: correctedFileKey,
  });

  revalidateReviewPaths(noteId);
  return { success: true };
}

// VP Notes publishes the note — the director's corrected file if there
// is one (the submitter's upload is kept in original_file_key).
export async function finalApproveAction(noteId: string, message: string, hoursAwarded: number) {
  const { caller, isSuperAdmin } = await requireFinalChecker();
  const note = await loadNote(noteId);
  assertHoldsClaim(note, caller.id);
  assertNotOwnCheck(note, caller.id, isSuperAdmin);

  if (note.status !== "fix_review") throw new Error("This note isn't waiting on a final check.");

  const isFix = Boolean(note.corrected_file_key);
  if (isFix && message.trim().length < 10) {
    throw new Error("Tell the submitter what was fixed (10+ characters).");
  }

  const wasPublished = await hasOpenReports(noteId);
  const hours = wasPublished ? (note.hours_awarded ?? 1) : Math.max(1, hoursAwarded || 1);

  await updateClaimedNote(
    note,
    caller.id,
    {
      ...(isFix
        ? {
            file_key: note.corrected_file_key,
            file_size: note.corrected_file_size,
            file_type: note.corrected_file_type,
            original_file_key: note.original_file_key ?? note.file_key,
          }
        : {}),
      status: "approved",
      reviewed_by: null,
      claimed_at: null,
      reviewed_at: new Date().toISOString(),
      // Shown to the submitter on their dashboard as the reviewer's note.
      flag_reason: message.trim() || null,
      flagged_by: null,
      hours_awarded: hours,
      feedback_attachment_key: null,
      ...CLEARED_FIX,
      ...CLEARED_CHECK,
      ...CLEARED_RETURN,
    },
    "Couldn't publish this note."
  );

  if (wasPublished) await resolveReports(noteId, caller.id, isFix ? "fixed" : "dismissed");

  await logAction(caller.id, note, isFix ? "NOTE_APPROVED_WITH_FIXES" : "NOTE_APPROVED", {
    decision: isFix ? "approved_with_fixes" : "approved",
    reason: message.trim() || null,
    checked_by: note.checked_by,
    recommendation: note.recommendation,
    recommendation_note: note.recommendation_note,
    resolved_reports: wasPublished,
    ...(isFix ? { fixed_by: note.fixed_by, original_file_key: note.file_key, corrected_file_key: note.corrected_file_key } : {}),
  });

  // Restoring a reported note unchanged just puts it back how it was —
  // the submitter never heard about the report, so there's nothing to say.
  if (isFix || !wasPublished) {
    await notifyNoteOwner(supabaseAdmin, isFix ? "note_approved_with_fixes" : "note_approved", note, { message, hours });
  }

  revalidateReviewPaths(noteId);
  return { success: true };
}

// VP Notes denies the note outright.
export async function finalRejectAction(noteId: string, reason: string) {
  const { caller, isSuperAdmin } = await requireFinalChecker();
  const note = await loadNote(noteId);
  assertHoldsClaim(note, caller.id);
  assertNotOwnCheck(note, caller.id, isSuperAdmin);

  if (note.status !== "fix_review") throw new Error("This note isn't waiting on a final check.");
  if (reason.trim().length < 10) throw new Error("Add a brief explanation (10+ characters) for denying it.");

  const wasPublished = await hasOpenReports(noteId);

  await updateClaimedNote(
    note,
    caller.id,
    {
      status: "rejected",
      reviewed_by: null,
      claimed_at: null,
      reviewed_at: new Date().toISOString(),
      flag_reason: reason.trim(),
      flagged_by: null,
      hours_awarded: null,
      feedback_attachment_key: null,
      ...CLEARED_FIX,
      ...CLEARED_CHECK,
      ...CLEARED_RETURN,
    },
    "Couldn't deny this note."
  );

  if (wasPublished) await resolveReports(noteId, caller.id, "upheld");

  await logAction(caller.id, note, "NOTE_REJECTED", {
    decision: "rejected",
    reason: reason.trim(),
    checked_by: note.checked_by,
    recommendation: note.recommendation,
    recommendation_note: note.recommendation_note,
    resolved_reports: wasPublished,
  });

  await notifyNoteOwner(supabaseAdmin, wasPublished ? "note_removed" : "note_rejected", note, { message: reason });

  revalidateReviewPaths(noteId);
  return { success: true };
}

// VP Notes isn't satisfied: the note goes back to Pending, unclaimed and
// marked as sent back, for any director to review or fix again. Any
// half-accepted fix is dropped (it's still in the audit log).
export async function sendBackToPendingAction(noteId: string, reason: string) {
  const { caller } = await requireFinalChecker();
  const note = await loadNote(noteId);
  assertHoldsClaim(note, caller.id);

  if (note.status !== "fix_review") throw new Error("This note isn't waiting on a final check.");
  if (reason.trim().length < 10) throw new Error("Explain what still needs work (10+ characters).");

  await updateClaimedNote(
    note,
    caller.id,
    {
      status: "pending",
      reviewed_by: null,
      claimed_at: null,
      returned_by: caller.id,
      returned_at: new Date().toISOString(),
      return_note: reason.trim(),
      ...CLEARED_FIX,
      ...CLEARED_CHECK,
    },
    "Couldn't send this note back."
  );

  await logAction(caller.id, note, "NOTE_SENT_BACK_TO_PENDING", {
    reason: reason.trim(),
    checked_by: note.checked_by,
    recommendation: note.recommendation,
    corrected_file_key: note.corrected_file_key,
  });
  if (note.checked_by) await notifySentBack(supabaseAdmin, note.checked_by, note, reason.trim());

  revalidateReviewPaths(noteId);
  return { success: true };
}
