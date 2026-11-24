export type AdminNote = {
    id: string;
    title: string;
    courseCode: string;
    uploaderEmail: string;
    submittedAt: string;
    status: "pending" | "approved" | "rejected" | "flagged" | "in_revision" | "fix_review";
    claimedBy?: string;
  };

export type AdminRole = "SUPER_ADMIN" | "VP_NOTES" | "ADMIN" | "STUDENT";

// Highest role wins: a super admin who is also flagged VP Notes shows as
// super admin.
export function roleOf(profile: {
  is_admin?: boolean | null;
  is_super_admin?: boolean | null;
  is_vp_notes?: boolean | null;
}): AdminRole {
  if (profile.is_super_admin) return "SUPER_ADMIN";
  if (profile.is_vp_notes) return "VP_NOTES";
  if (profile.is_admin) return "ADMIN";
  return "STUDENT";
}

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  submissionCount: number;
  joinedAt: string;
  status: "ACTIVE" | "BANNED";
};
// Anyone on the review team. The database keeps is_admin true for VP Notes
// and super admins (see the role-ladder migration); checking all three
// just means a missed migration can't lock a VP out of the console.
export function isStaff(profile: {
  is_admin?: boolean | null;
  is_super_admin?: boolean | null;
  is_vp_notes?: boolean | null;
} | null): boolean {
  return Boolean(profile?.is_admin || profile?.is_vp_notes || profile?.is_super_admin);
}

export const ROLE_LABEL: Record<AdminRole, string> = {
  SUPER_ADMIN: "Super admin",
  VP_NOTES: "VP Notes",
  ADMIN: "Notes Director",
  STUDENT: "Student",
};
