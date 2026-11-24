// Shared review-flow rules. No server-only imports, so both the queue
// (client) and the review actions (server) apply the exact same logic.

export type NoteStatus = "pending" | "approved" | "rejected" | "flagged" | "in_revision" | "fix_review";

// Only VP Notes and super admins can do the final check that publishes
// or denies a note. Everyone else with is_admin reviews, fixes and sends
// notes to final check.
export function canFinalCheck(profile: { is_vp_notes?: boolean | null; is_super_admin?: boolean | null } | null) {
  return Boolean(profile?.is_vp_notes || profile?.is_super_admin);
}

// The person who sent a note to final check can't also be the one who
// approves it (matters when a VP reviews a note themselves). Set to false
// to let them.
export const REQUIRE_SECOND_REVIEWER = true;

// A normal review claim is short: the review page refreshes it every
// few minutes while it's open (see ClaimHeartbeat), so it only lapses
// once the director has actually walked away.
export const REVIEW_LOCK_MS = 30 * 60 * 1000;

// Fixing a note happens offline (download, edit, re-upload), so the
// director keeps it much longer. Past this, another director can take
// the fix over.
export const REVISION_LOCK_MS = 3 * 24 * 60 * 60 * 1000;

export const CLAIM_HEARTBEAT_MS = 5 * 60 * 1000;

export function lockDurationFor(status: string): number {
  return status === "in_revision" ? REVISION_LOCK_MS : REVIEW_LOCK_MS;
}

// A claim counts only while it's fresh. A note claimed by someone who
// has since gone quiet is treated as unclaimed everywhere.
export function isClaimActive(
  note: { reviewed_by: string | null; claimed_at: string | null; status: string },
  now = Date.now()
): boolean {
  if (!note.reviewed_by || !note.claimed_at) return false;
  return now - new Date(note.claimed_at).getTime() < lockDurationFor(note.status);
}

export function claimExpiresAt(note: { claimed_at: string | null; status: string }): Date | null {
  if (!note.claimed_at) return null;
  return new Date(new Date(note.claimed_at).getTime() + lockDurationFor(note.status));
}

// Decision actions as stored in admin_audit_log. NOTE_CHANGES_REQUESTED
// is no longer produced, but old rows still use it.
export const DECISION_ACTIONS = [
  "NOTE_APPROVED",
  "NOTE_APPROVED_WITH_FIXES",
  "NOTE_REJECTED",
  "NOTE_CHANGES_REQUESTED",
] as const;
export type DecisionAction = (typeof DECISION_ACTIONS)[number];

export type PreviewKind = "pdf" | "image" | "office" | "unknown";

const OFFICE_MIME = [
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

export function fileExtension(fileKey: string | null | undefined): string {
  return fileKey?.split(".").pop()?.toLowerCase() ?? "";
}

export function previewKindFor(fileType: string | null | undefined, fileKey: string | null | undefined): PreviewKind {
  const ext = fileExtension(fileKey);
  if (fileType === "application/pdf" || ext === "pdf") return "pdf";
  if (fileType?.startsWith("image/") || ["png", "jpg", "jpeg"].includes(ext)) return "image";
  if ((fileType && OFFICE_MIME.includes(fileType)) || ["docx", "pptx"].includes(ext)) return "office";
  return "unknown";
}
