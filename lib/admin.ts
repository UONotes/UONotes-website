export type AdminNote = {
    id: string;
    title: string;
    courseCode: string;
    uploaderEmail: string;
    submittedAt: string;
    status: "pending" | "approved" | "rejected" | "flagged" | "changes_requested";
    claimedBy?: string;
  };

export type AdminRole = "SUPER_ADMIN" | "ADMIN" | "STUDENT";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  submissionCount: number;
  joinedAt: string;
  status: "ACTIVE" | "BANNED";
};