import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, Shield, Ban, CheckCircle2, Award, FileStack, CalendarDays } from "lucide-react";
import { UserSubmissionsList, type UserSubmission, type SubmissionStatus } from "@/components/admin/users/UserSubmissionsList";
import { formatDate } from "@/lib/dateFormat";

const DECISION_ACTIONS = ["NOTE_APPROVED", "NOTE_REJECTED", "NOTE_CHANGES_REQUESTED"] as const;

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
    .select("is_admin")
    .eq("id", caller.id)
    .single();

  if (!callerProfile?.is_admin) redirect("/");

  const { data: targetUser } = await supabase
    .from("profiles")
    .select("id, full_name, email, is_admin, is_super_admin, status, created_at")
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
    const isActive = note.status === "pending" || note.status === "flagged" || note.status === "changes_requested";

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
    changesRequested: submissions.filter((s) => s.status === "changes_requested").length,
    flagged: submissions.filter((s) => s.status === "flagged").length,
    totalHours: submissions.reduce((sum, s) => sum + (s.hoursAwarded || 0), 0),
  };

  const name = targetUser.full_name || targetUser.email?.split("@")[0] || "Unknown";
  const isBanned = targetUser.status === "BANNED";
  const isSuperAdmin = targetUser.is_super_admin;
  const isAdmin = targetUser.is_admin;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <Link href="/admin/users" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-brand-red transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to users
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-6 border-b border-black/5">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-semibold text-xl shrink-0 ${
          isSuperAdmin ? "bg-purple-600 text-white" : isBanned ? "bg-gray-100 text-gray-400" : "bg-red-50 text-brand-red"
        }`}>
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-logo text-2xl font-bold text-[#23201D] tracking-tight">{name}</h1>
            {isSuperAdmin ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full">
                <Shield className="w-3 h-3" /> Super admin
              </span>
            ) : isAdmin ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-red bg-red-50 px-2.5 py-1 rounded-full">
                <Shield className="w-3 h-3" /> Admin
              </span>
            ) : null}
            {isBanned && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 text-xs font-semibold">
                <Ban className="w-3 h-3" /> Banned
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{targetUser.email}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-gray-400 flex items-center gap-1 justify-end">
            <CalendarDays className="w-3.5 h-3.5" /> Joined
          </p>
          <p className="text-sm font-semibold text-gray-900">
            {formatDate(targetUser.created_at)}
          </p>
        </div>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-black/5 border border-black/5 rounded-2xl bg-white overflow-hidden">
        <StatCell label="Submissions" value={stats.total} icon={FileStack} accent="text-gray-700" />
        <StatCell label="Approved" value={stats.approved} icon={CheckCircle2} accent="text-emerald-600" />
        <StatCell label="Rejected" value={stats.rejected} icon={Ban} accent="text-rose-600" />
        <StatCell label="Hours earned" value={stats.totalHours} icon={Award} accent="text-amber-600" />
      </div>

      <UserSubmissionsList submissions={submissions} />
    </div>
  );
}

function StatCell({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: typeof FileStack;
  accent: string;
}) {
  return (
    <div className="p-5 flex items-center gap-3">
      <Icon className={`w-4 h-4 ${accent} shrink-0`} />
      <div>
        <p className={`text-xl font-bold font-logo ${accent}`}>{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}