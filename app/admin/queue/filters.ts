// Queue filter options. Kept in their own plain file (no "use client") so both the server page
// and the client QueueView can import the real list.
export type QueueFilter = "all" | "pending" | "flagged" | "in_revision" | "fix_review" | "locked";
export const QUEUE_FILTERS: QueueFilter[] = ["all", "pending", "flagged", "in_revision", "fix_review", "locked"];