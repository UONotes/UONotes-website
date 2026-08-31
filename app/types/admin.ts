export type QueueItem = {
  id: string;
  title: string;
  courseCode: string;
  status: string;
  submittedAt: string;
  uploaderEmail: string;
  claimedBy: string | null;
  flagReason?: string | null;
};