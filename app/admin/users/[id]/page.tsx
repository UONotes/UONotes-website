import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, Ban, CheckCircle2, Award, FileStack, CalendarDays } from "lucide-react";
import { UserSubmissionsList, type UserSubmission, type SubmissionStatus } from "@/components/admin/users/UserSubmissionsList";
import { formatDate } from "@/lib/dateFormat";
import { RoleControls } from "@/components/admin/users/RoleControls";
import { RoleBadge } from "@/components/admin/users/RoleBadge";
import { roleOf } from "@/lib/admin";

import { DECISION_ACTIONS } from "@/lib/review";

type NoteRow = {
  id: string;
  title: string;
  course_code: string;
  status: string;
  hours_awarded: number | null;
  created_at: string;
  reviewed_at: string | null;
  flag_reason: string | null;
};

type ReviewerJoin = { id: string; full_name: string | null; email: string | null };

type AuditRow = {
  target_id: string | null;
  action_type: string;
  created_at: string;
  details: { reason?: string | null } | null;
  admin: ReviewerJoin | ReviewerJoin[] | null;
};

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user: caller } } = await supabase.auth.getUser();
  if (!caller) redirect("/signin");

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("is_admin, is_super_admin")
    .eq("id", caller.id)
    .single();

  if (!callerProfile?.is_admin) redirect("/");

  const { data: targetUser } = await supabase
    .from("profiles")
    .select("id, full_name, email, is_admin, is_super_admin, is_vp_notes, status, created_at")
    .eq("id", id)
    .single();

  if (!targetUser) notFound();

  const { data: noteRows } = await supabase
    .from("notes")
    .select("id, title, course_code, status, hours_awarded, created_at, reviewed_at, flag_reason")
    .eq("uploader_id", id)
    .order("created_at", { ascending: false });

  const notes = (noteRows || []) as NoteRow[];

  // Grab the most recent decision logged for each of this user's notes,
  // so we can show who reviewed it and link straight to that decision's
  // history entry instead of just the bare note.
  const noteIds = notes.map((n) => n.id);
  const latestDecisionByNote = new Map<string, { auditId: string; reviewerName: string }>();

  if (noteIds.length > 0) {
    const { data: auditRows } = await supabase
      .from("admin_audit_log")
      .select("id, target_id, action_type, created_at, details, admin:profiles(id, full_name, email)")
      .eq("target_type", "note")
      .in("target_id", noteIds)
      .in("action_type", DECISION_ACTIONS)
      .order("created_at", { ascending: false });

    ((auditRows || []) as unknown as (AuditRow & { id: string })[]).forEach((row) => {
      if (!row.target_id || latestDecisionByNote.has(row.target_id)) return;
      const reviewer = Array.isArray(row.admin) ? row.admin[0] : row.admin;
      latestDecisionByNote.set(row.target_id, {
        auditId: row.id,
        reviewerName: reviewer?.full_name || reviewer?.email?.split("@")[0] || "Unknown reviewer",
      });
    });
  }

  const submissions: UserSubmission[] = notes.map((note) => {
    const decision = latestDecisionByNote.get(note.id);
    const isActive = note.status === "pending" || note.status === "flagged" || note.status === "in_revision" || note.status === "fix_review";

    return {
      id: note.id,
      title: note.title,
      courseCode: note.course_code,
      status: note.status as SubmissionStatus,
      hoursAwarded: note.hours_awarded,
      createdAt: note.created_at,
      reviewedAt: note.reviewed_at,
      reason: note.flag_reason,
      reviewerName: decision?.reviewerName ?? null,
      linkHref: isActive
        ? `/admin/review/${note.id}`
        : decision
          ? `/admin/history/${decision.auditId}`
          : null,
    };
  });

  const stats = {
    total: submissions.length,
    approved: submissions.filter((s) => s.status === "approved").length,
    rejected: submissions.filter((s) => s.status === "rejected").length,
    pending: submissions.filter((s) => s.status === "pending").length,
    beingFixed: submissions.filter((s) => s.status === "in_revision").length,
    flagged: submissions.filter((s) => s.status === "flagged").length,
    totalHours: submissions.reduce((sum, s) => sum + (s.hoursAwarded || 0), 0),
  };

  const name = targetUser.full_name || targetUser.email?.split("@")[0] || "Unknown";
  const isBanned = targetUser.status === "BANNED";
  const isSuperAdmin = targetUser.is_super_admin;
  // Only super admins manage roles, and never their own or another super admin's.
  const canManageRoles = Boolean(callerProfile.is_super_admin) && !isSuperAdmin && !isBanned && targetUser.id !== caller.id;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <Link href="/admin/users" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-brand-red transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to users
      </Link>

      <header className="rounded-lg border border-brand-border-light bg-white p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center font-semibold text-xl shrink-0 ${
                isBanned ? "bg-gray-100 text-gray-400" : "bg-brand-pink text-brand-red"
              }`}
            >
              {name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h1 className="font-logo text-2xl font-bold text-brand-dark tracking-tight truncate">{name}</h1>
              <p className="text-sm text-brand-muted truncate">{targetUser.email}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <RoleBadge role={roleOf(targetUser)} />
                {isBanned && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600">
                    <Ban className="w-3 h-3" /> Banned
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-xs text-brand-muted">
                  <CalendarDays className="w-3.5 h-3.5" /> Joined {formatDate(targetUser.created_at)}
                </span>
              </div>
            </div>
          </div>
          {canManageRoles && <RoleControls userId={targetUser.id} role={roleOf(targetUser)} userName={name} />}
        </div>
      </header>

      {/* Stat strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCell label="Submissions" value={stats.total} icon={FileStack} />
        <StatCell label="Approved" value={stats.approved} icon={CheckCircle2} />
        <StatCell label="Rejected" value={stats.rejected} icon={Ban} />
        <StatCell label="Hours earned" value={stats.totalHours} icon={Award} />
      </div>

      <UserSubmissionsList submissions={submissions} />
    </div>
  );
}

function StatCell({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof FileStack;
}) {
  return (
    <div className="rounded-lg border border-brand-border-light bg-white p-4">
      <p className="flex items-center gap-1.5 text-xs font-medium text-brand-muted">
        <Icon className="w-3.5 h-3.5" /> {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-brand-dark tabular-nums">{value}</p>
    </div>
  );
}