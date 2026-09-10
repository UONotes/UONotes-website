import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildDailyBuckets, computeTrend, pct, type Trend } from "@/lib/analytics";
import { TrendChart } from "@/components/admin/TrendChart";
import { DeltaBadge } from "@/components/admin/DeltaBadge";
import {
  Users,
  FileStack,
  Award,
  ArrowRight,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Gauge,
} from "lucide-react";

function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return "Never";
  const date = new Date(dateString);
  const diffInSec = Math.floor((Date.now() - date.getTime()) / 1000);

  if (diffInSec < 60) return `${diffInSec}s ago`;
  if (diffInSec < 3600) return `${Math.floor(diffInSec / 60)}m ago`;
  if (diffInSec < 86400) return `${Math.floor(diffInSec / 3600)}h ago`;
  return `${Math.floor(diffInSec / 86400)}d ago`;
}

function formatDuration(hours: number | null): string {
  if (hours === null) return "—";
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 48) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}

type AuditRow = {
  admin_id: string | null;
  action_type: string;
  target_type: string | null;
  target_id: string | null;
  created_at: string;
};

type AdminAgg = {
  id: string;
  name: string;
  email: string;
  lastActive: string | null;
  approved: number;
  rejected: number;
  changesRequested: number;
  banned: number;
  unbanned: number;
  total: number;
};

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("is_super_admin")
    .eq("id", user.id)
    .single();

  // Real guard, not just a hidden nav link — anyone who lands here
  // directly still gets bounced if they aren't a super admin.
  if (!callerProfile?.is_super_admin) redirect("/admin");

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: totalUsers },
    { count: newUsersWeek },
    { count: newUsersMonth },
    { count: prevWeekUsers },
    { count: prevMonthUsers },
    { count: totalNotes },
    { count: notesLast30 },
    { count: newNotesWeek },
    { count: prevWeekNotes },
    { count: prevMonthNotes },
    { count: pendingCount },
    { count: approvedCount },
    { count: rejectedCount },
    { count: flaggedCount },
    { count: changesRequestedCount },
    { data: hoursData },
    { data: hoursThisWeekData },
    { data: hoursPrevWeekData },
    { data: adminRoster },
    { data: auditRows },
    { data: submissionDates },
    { data: signupDates },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
    supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", monthAgo),
    supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", twoWeeksAgo).lt("created_at", weekAgo),
    supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", twoMonthsAgo).lt("created_at", monthAgo),
    supabase.from("notes").select("*", { count: "exact", head: true }),
    supabase.from("notes").select("*", { count: "exact", head: true }).gte("created_at", monthAgo),
    supabase.from("notes").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
    supabase.from("notes").select("*", { count: "exact", head: true }).gte("created_at", twoWeeksAgo).lt("created_at", weekAgo),
    supabase.from("notes").select("*", { count: "exact", head: true }).gte("created_at", twoMonthsAgo).lt("created_at", monthAgo),
    supabase.from("notes").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("notes").select("*", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("notes").select("*", { count: "exact", head: true }).eq("status", "rejected"),
    supabase.from("notes").select("*", { count: "exact", head: true }).eq("status", "flagged"),
    supabase.from("notes").select("*", { count: "exact", head: true }).eq("status", "changes_requested"),
    supabase.from("notes").select("hours_awarded").eq("status", "approved"),
    supabase.from("notes").select("hours_awarded").eq("status", "approved").gte("reviewed_at", weekAgo),
    supabase.from("notes").select("hours_awarded").eq("status", "approved").gte("reviewed_at", twoWeeksAgo).lt("reviewed_at", weekAgo),
    // The full admin roster — this is the base of the leaderboard, not
    // the audit log. An admin who's logged in but hasn't reviewed
    // anything yet should still show up with a real last-active time.
    supabase.from("profiles").select("id, full_name, email, last_admin_active_at").eq("is_admin", true),
    supabase
      .from("admin_audit_log")
      .select("admin_id, action_type, target_type, target_id, created_at")
      .in("action_type", ["NOTE_APPROVED", "NOTE_REJECTED", "NOTE_CHANGES_REQUESTED", "BAN", "UNBAN"])
      .order("created_at", { ascending: true })
      .limit(5000),
    supabase.from("notes").select("created_at").gte("created_at", monthAgo),
    supabase.from("profiles").select("created_at").gte("created_at", monthAgo),
  ]);

  const totalHoursAwarded = (hoursData || []).reduce((sum, n) => sum + (n.hours_awarded || 0), 0);
  const hoursThisWeek = (hoursThisWeekData || []).reduce((sum, n) => sum + (n.hours_awarded || 0), 0);
  const hoursPrevWeek = (hoursPrevWeekData || []).reduce((sum, n) => sum + (n.hours_awarded || 0), 0);
  const needsAttention = (pendingCount ?? 0) + (flaggedCount ?? 0);

  // --- Week/month-over-week trends ---
  const usersWeekTrend = computeTrend(newUsersWeek ?? 0, prevWeekUsers ?? 0);
  const usersMonthTrend = computeTrend(newUsersMonth ?? 0, prevMonthUsers ?? 0);
  const notesWeekTrend = computeTrend(newNotesWeek ?? 0, prevWeekNotes ?? 0);
  const notesMonthTrend = computeTrend(notesLast30 ?? 0, prevMonthNotes ?? 0);
  const hoursWeekTrend = computeTrend(hoursThisWeek, hoursPrevWeek);

  // Plain per-day averages for the two Growth charts. A raw % change
  // reads as a meaningless "New" badge when the prior 30-day window had
  // zero activity (very common on a young dataset) — showing both
  // months' daily averages side by side stays informative either way.
  const avgSubmissionsThisMonth = (notesLast30 ?? 0) / 30;
  const avgSubmissionsPrevMonth = (prevMonthNotes ?? 0) / 30;
  const avgSignupsThisMonth = (newUsersMonth ?? 0) / 30;
  const avgSignupsPrevMonth = (prevMonthUsers ?? 0) / 30;
  const submissionsComparisonText = `${avgSubmissionsThisMonth.toFixed(1)}/day this month vs ${avgSubmissionsPrevMonth.toFixed(1)}/day last month`;
  const signupsComparisonText = `${avgSignupsThisMonth.toFixed(1)}/day this month vs ${avgSignupsPrevMonth.toFixed(1)}/day last month`;

  // --- Submission funnel percentages ---
  // "Decided" excludes anything still pending/flagged/awaiting fixes —
  // it's the share of submissions a reviewer has actually ruled on.
  const decidedCount = (approvedCount ?? 0) + (rejectedCount ?? 0);
  const approvalRate = pct(approvedCount ?? 0, decidedCount);
  const rejectionRate = pct(rejectedCount ?? 0, decidedCount);
  // Of everything ever approved, how much later got reported.
  const everApproved = (approvedCount ?? 0) + (flaggedCount ?? 0);
  const flagRate = pct(flaggedCount ?? 0, everApproved);

  const adminMap = new Map<string, AdminAgg>();
  for (const admin of adminRoster || []) {
    adminMap.set(admin.id, {
      id: admin.id,
      name: admin.full_name || admin.email?.split("@")[0] || "Unknown",
      email: admin.email || "",
      lastActive: admin.last_admin_active_at,
      approved: 0,
      rejected: 0,
      changesRequested: 0,
      banned: 0,
      unbanned: 0,
      total: 0,
    });
  }

  for (const row of (auditRows as AuditRow[] | null) || []) {
    if (!row.admin_id) continue;
    const existing = adminMap.get(row.admin_id);
    if (!existing) continue; // admin no longer in the roster (demoted/removed)
    existing.total += 1;
    if (row.action_type === "NOTE_APPROVED") existing.approved += 1;
    if (row.action_type === "NOTE_REJECTED") existing.rejected += 1;
    if (row.action_type === "NOTE_CHANGES_REQUESTED") existing.changesRequested += 1;
    if (row.action_type === "BAN") existing.banned += 1;
    if (row.action_type === "UNBAN") existing.unbanned += 1;
  }

  const adminStats = Array.from(adminMap.values()).sort((a, b) => {
    const aTime = a.lastActive ? new Date(a.lastActive).getTime() : 0;
    const bTime = b.lastActive ? new Date(b.lastActive).getTime() : 0;
    return bTime - aTime;
  });

  // Share of total note decisions each admin handled, and each admin's
  // own approval rate — bans/unbans don't count toward either, since
  // they're a different kind of action.
  const totalNoteDecisions = adminStats.reduce(
    (sum, a) => sum + a.approved + a.rejected + a.changesRequested,
    0
  );

  // --- Review turnaround time & resubmission success rate ---
  // Both are derived from the same audit log rows (sorted ascending
  // above), so a note's *first* decision is just the first time we see
  // its target_id, and "ever sent back for fixes" is any note with a
  // NOTE_CHANGES_REQUESTED entry.
  const noteDecisionRows = ((auditRows as AuditRow[] | null) || []).filter(
    (r) => r.target_type === "note" && r.target_id
  );

  const firstDecisionAt = new Map<string, string>();
  const changesRequestedNoteIds = new Set<string>();
  for (const row of noteDecisionRows) {
    const id = row.target_id as string;
    if (!firstDecisionAt.has(id)) firstDecisionAt.set(id, row.created_at);
    if (row.action_type === "NOTE_CHANGES_REQUESTED") changesRequestedNoteIds.add(id);
  }

  const relevantNoteIds = Array.from(new Set([...firstDecisionAt.keys(), ...changesRequestedNoteIds]));
  const { data: relevantNotes } = relevantNoteIds.length > 0
    ? await supabase.from("notes").select("id, created_at, status").in("id", relevantNoteIds)
    : { data: [] as { id: string; created_at: string; status: string }[] };

  const noteInfoMap = new Map((relevantNotes || []).map((n) => [n.id, n]));

  let turnaroundTotalHours = 0;
  let turnaroundCount = 0;
  for (const [noteId, decisionAt] of firstDecisionAt) {
    const note = noteInfoMap.get(noteId);
    if (!note) continue;
    const hours = (new Date(decisionAt).getTime() - new Date(note.created_at).getTime()) / (1000 * 60 * 60);
    if (hours >= 0) {
      turnaroundTotalHours += hours;
      turnaroundCount += 1;
    }
  }
  const avgTurnaroundHours = turnaroundCount > 0 ? turnaroundTotalHours / turnaroundCount : null;

  let resubmittedApproved = 0;
  let resubmittedRejected = 0;
  let resubmittedInProgress = 0; // back to pending, awaiting a fresh review
  let resubmittedStillStuck = 0; // never resubmitted, or requested again
  for (const noteId of changesRequestedNoteIds) {
    const status = noteInfoMap.get(noteId)?.status;
    if (status === "approved") resubmittedApproved += 1;
    else if (status === "rejected") resubmittedRejected += 1;
    else if (status === "pending") resubmittedInProgress += 1;
    else resubmittedStillStuck += 1; // changes_requested (again) or flagged
  }
  const totalEverChangesRequested = changesRequestedNoteIds.size;
  const resubmissionSuccessRate = totalEverChangesRequested > 0
    ? Math.round((resubmittedApproved / totalEverChangesRequested) * 100)
    : null;

  // --- Daily volume, last 30 days ---
  const submissionBuckets = buildDailyBuckets(submissionDates || [], 30, now);
  const signupBuckets = buildDailyBuckets(signupDates || [], 30, now);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-10">

      <div>
        <h1 className="font-logo text-3xl font-bold text-[#23201D] tracking-tight">Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">
          How the platform is doing, at a glance. Visible to super admins only.
        </p>
      </div>

      {/* ── Overview ─────────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionHeader
          title="This week at a glance"
          description="Headline numbers, compared to the 7 days before."
        />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <StatCell
            icon={Users}
            label="Total users"
            value={totalUsers ?? 0}
            sub={`${newUsersWeek ?? 0} new this week`}
            color="blue"
            trend={usersWeekTrend}
          />
          <StatCell
            icon={FileStack}
            label="Total submissions"
            value={totalNotes ?? 0}
            sub={`${newNotesWeek ?? 0} new this week`}
            color="orange"
            trend={notesWeekTrend}
          />
          <StatCell
            icon={Award}
            label="Hours awarded this week"
            value={hoursThisWeek}
            sub={`${totalHoursAwarded} lifetime total`}
            color="red"
            trend={hoursWeekTrend}
          />
          <StatCell
            icon={CheckCircle2}
            label="Approval rate"
            value={`${approvalRate}%`}
            sub={`${approvedCount ?? 0} of ${decidedCount} decided`}
            color="emerald"
          />
          <StatCell
            icon={ShieldAlert}
            label="Needs attention"
            value={needsAttention}
            sub={`${pendingCount ?? 0} pending · ${flaggedCount ?? 0} flagged`}
            color="purple"
          />
          <StatCell
            icon={Gauge}
            label="Avg. review turnaround"
            value={formatDuration(avgTurnaroundHours)}
            sub={`across ${turnaroundCount} decided submission${turnaroundCount === 1 ? "" : "s"}`}
            color="gray"
          />
        </div>
      </section>

      {/* ── Growth ───────────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionHeader title="Growth" description="Signups and submissions over the last 30 days." />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TrendChart
            title="Submissions"
            description="Daily volume of new note submissions."
            buckets={submissionBuckets}
            total={notesLast30 ?? 0}
            comparisonText={submissionsComparisonText}
          />
          <TrendChart
            title="Signups"
            description="Daily volume of new account registrations."
            buckets={signupBuckets}
            barColor="bg-blue-500/70"
            barHoverColor="hover:bg-blue-500"
            total={newUsersMonth ?? 0}
            comparisonText={signupsComparisonText}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-black/5 rounded-2xl p-6">
            <h3 className="font-logo text-base font-bold text-[#23201D] mb-4">Signups</h3>
            <div className="space-y-3 text-sm">
              <DetailRow label="New this week" value={newUsersWeek ?? 0} trend={usersWeekTrend} />
              <DetailRow label="New this month" value={newUsersMonth ?? 0} trend={usersMonthTrend} />
              <div className="flex items-center justify-between pt-1 border-t border-black/5">
                <span className="text-gray-500">Total registered</span>
                <span className="font-semibold text-gray-900">{totalUsers ?? 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-black/5 rounded-2xl p-6">
            <h3 className="font-logo text-base font-bold text-[#23201D] mb-4">Submissions</h3>
            <div className="space-y-3 text-sm">
              <DetailRow label="New this week" value={newNotesWeek ?? 0} trend={notesWeekTrend} />
              <DetailRow label="New this month" value={notesLast30 ?? 0} trend={notesMonthTrend} />
              <div className="flex items-center justify-between pt-1 border-t border-black/5">
                <span className="text-gray-500">Total all-time</span>
                <span className="font-semibold text-gray-900">{totalNotes ?? 0}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Submission funnel ────────────────────────────────── */}
      <section className="space-y-4">
        <SectionHeader
          title="Submission funnel"
          description="How reviewed submissions turn out, and what's still in the pipeline."
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <RatePill icon={CheckCircle2} label="Approval rate" value={approvalRate} color="emerald" sub={`${approvedCount ?? 0} of ${decidedCount} decided`} />
          <RatePill icon={XCircle} label="Rejection rate" value={rejectionRate} color="rose" sub={`${rejectedCount ?? 0} of ${decidedCount} decided`} />
          <RatePill icon={ShieldAlert} label="Flag rate" value={flagRate} color="purple" sub={`${flaggedCount ?? 0} of ${everApproved} ever approved`} />
        </div>

        <div className="bg-white border border-black/5 rounded-2xl p-6">
          <h3 className="font-logo text-base font-bold text-[#23201D] mb-4">All submissions, by status</h3>
          <div className="space-y-2.5">
            <StatusBar label="Approved" count={approvedCount ?? 0} total={totalNotes ?? 0} color="bg-emerald-500" />
            <StatusBar label="Pending" count={pendingCount ?? 0} total={totalNotes ?? 0} color="bg-blue-500" />
            <StatusBar label="Awaiting fixes" count={changesRequestedCount ?? 0} total={totalNotes ?? 0} color="bg-orange-500" />
            <StatusBar label="Flagged" count={flaggedCount ?? 0} total={totalNotes ?? 0} color="bg-purple-500" />
            <StatusBar label="Rejected" count={rejectedCount ?? 0} total={totalNotes ?? 0} color="bg-rose-500" />
          </div>
        </div>
      </section>

      {/* ── Review performance ───────────────────────────────── */}
      <section className="space-y-4">
        <SectionHeader
          title="Review performance"
          description="How quickly reviews happen, and what becomes of notes sent back for fixes."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-black/5 rounded-2xl p-6">
            <h3 className="font-logo text-base font-bold text-[#23201D]">Review turnaround</h3>
            <p className="text-xs text-gray-400 mt-0.5 mb-4">Time from submission to a note&apos;s first decision.</p>
            <p className="text-3xl font-bold font-logo text-[#23201D]">{formatDuration(avgTurnaroundHours)}</p>
            <p className="text-xs text-gray-500 mt-1">average, across {turnaroundCount} decided submission{turnaroundCount === 1 ? "" : "s"}</p>
          </div>

          <div className="bg-white border border-black/5 rounded-2xl p-6">
            <h3 className="font-logo text-base font-bold text-[#23201D]">Resubmission success rate</h3>
            <p className="text-xs text-gray-400 mt-0.5 mb-4">Of notes ever sent back for fixes, how many ended up approved.</p>
            {totalEverChangesRequested === 0 ? (
              <p className="text-sm text-gray-400">No notes have been sent back for fixes yet.</p>
            ) : (
              <>
                <p className="text-3xl font-bold font-logo text-[#23201D]">{resubmissionSuccessRate}%</p>
                <p className="text-xs text-gray-500 mt-1 mb-3">
                  {resubmittedApproved} of {totalEverChangesRequested} eventually approved
                </p>
                <div className="space-y-2">
                  <StatusBar label="Approved" count={resubmittedApproved} total={totalEverChangesRequested} color="bg-emerald-500" />
                  <StatusBar label="Back in queue" count={resubmittedInProgress} total={totalEverChangesRequested} color="bg-blue-500" />
                  <StatusBar label="Still awaiting fixes" count={resubmittedStillStuck} total={totalEverChangesRequested} color="bg-orange-500" />
                  <StatusBar label="Rejected" count={resubmittedRejected} total={totalEverChangesRequested} color="bg-rose-500" />
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Admin activity ───────────────────────────────────── */}
      <section className="space-y-4">
        <SectionHeader
          title="Admin activity"
          description={'"Last active" is when they last loaded an admin page, not their last review. Click an admin for their full history.'}
        />
        <div className="bg-white border border-black/5 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[820px]">
              <thead>
                <tr className="bg-gray-50/60 border-b border-black/5 text-xs text-gray-400">
                  <th className="px-5 py-3 font-medium">Admin</th>
                  <th className="px-5 py-3 font-medium text-center">Approved</th>
                  <th className="px-5 py-3 font-medium text-center">Rejected</th>
                  <th className="px-5 py-3 font-medium text-center">Fixes requested</th>
                  <th className="px-5 py-3 font-medium text-center">Approval rate</th>
                  <th className="px-5 py-3 font-medium text-center">Share of decisions</th>
                  <th className="px-5 py-3 font-medium text-center">Banned</th>
                  <th className="px-5 py-3 font-medium text-center">Unbanned</th>
                  <th className="px-5 py-3 font-medium text-right">Last active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 text-sm">
                {adminStats.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-10 text-center text-gray-400 text-sm">
                      No admins found.
                    </td>
                  </tr>
                ) : (
                  adminStats.map((admin) => {
                    const adminDecisions = admin.approved + admin.rejected + admin.changesRequested;
                    const adminApprovalRate =
                      admin.approved + admin.rejected > 0
                        ? pct(admin.approved, admin.approved + admin.rejected)
                        : null;
                    const shareOfDecisions = pct(adminDecisions, totalNoteDecisions);

                    return (
                      <tr key={admin.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <Link href={`/admin/analytics/${admin.id}`} className="flex items-center gap-3 group">
                            <div className="w-8 h-8 rounded-full bg-red-50 text-brand-red flex items-center justify-center font-semibold text-xs shrink-0">
                              {admin.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 group-hover:text-brand-red transition-colors">{admin.name}</p>
                              <p className="text-xs text-gray-400">{admin.email}</p>
                            </div>
                          </Link>
                        </td>
                        <td className="px-5 py-3.5 text-center text-emerald-700 font-medium">{admin.approved}</td>
                        <td className="px-5 py-3.5 text-center text-rose-600 font-medium">{admin.rejected}</td>
                        <td className="px-5 py-3.5 text-center text-orange-600 font-medium">{admin.changesRequested}</td>
                        <td className="px-5 py-3.5 text-center text-gray-700 font-medium">
                          {adminApprovalRate === null ? "—" : `${adminApprovalRate}%`}
                        </td>
                        <td className="px-5 py-3.5 text-center text-gray-700 font-medium">
                          {totalNoteDecisions === 0 ? "—" : `${shareOfDecisions}%`}
                        </td>
                        <td className="px-5 py-3.5 text-center text-rose-600 font-medium">{admin.banned}</td>
                        <td className="px-5 py-3.5 text-center text-emerald-700 font-medium">{admin.unbanned}</td>
                        <td className="px-5 py-3.5 text-right">
                          <Link href={`/admin/analytics/${admin.id}`} className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-brand-red transition-colors">
                            {formatRelativeTime(admin.lastActive)} <ArrowRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

    </div>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="font-logo text-xl font-bold text-[#23201D]">{title}</h2>
      <p className="text-sm text-gray-500 mt-0.5">{description}</p>
    </div>
  );
}

const STAT_COLORS = {
  blue: { bg: "bg-blue-50", icon: "text-blue-600", bar: "bg-blue-500" },
  orange: { bg: "bg-orange-50", icon: "text-orange-600", bar: "bg-orange-500" },
  purple: { bg: "bg-purple-50", icon: "text-purple-600", bar: "bg-purple-500" },
  red: { bg: "bg-red-50", icon: "text-brand-red", bar: "bg-brand-red" },
  emerald: { bg: "bg-emerald-50", icon: "text-emerald-600", bar: "bg-emerald-500" },
  gray: { bg: "bg-gray-100", icon: "text-gray-600", bar: "bg-gray-400" },
} as const;

function StatCell({
  label,
  value,
  sub,
  icon: Icon,
  color,
  trend,
}: {
  label: string;
  value: number | string;
  sub: string;
  icon: typeof Users;
  color: keyof typeof STAT_COLORS;
  trend?: Trend;
}) {
  const c = STAT_COLORS[color];
  return (
    <div className="relative bg-white border border-black/5 rounded-2xl p-4 overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-1 ${c.bar}`} />
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl ${c.bg} flex items-center justify-center`}>
          <Icon className={`w-4.5 h-4.5 ${c.icon}`} />
        </div>
        {trend && <DeltaBadge trend={trend} />}
      </div>
      <p className="text-2xl font-bold font-logo text-[#23201D]">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      <p className="text-[11px] text-gray-400 mt-1">{sub}</p>
    </div>
  );
}

function RatePill({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  sub: string;
  icon: typeof CheckCircle2;
  color: "emerald" | "rose" | "purple";
}) {
  const colors = {
    emerald: { bg: "bg-emerald-50", icon: "text-emerald-600", text: "text-emerald-700" },
    rose: { bg: "bg-rose-50", icon: "text-rose-600", text: "text-rose-700" },
    purple: { bg: "bg-purple-50", icon: "text-purple-600", text: "text-purple-700" },
  }[color];

  return (
    <div className="bg-white border border-black/5 rounded-2xl p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl ${colors.bg} flex items-center justify-center shrink-0`}>
        <Icon className={`w-5 h-5 ${colors.icon}`} />
      </div>
      <div className="min-w-0">
        <p className={`text-2xl font-bold font-logo ${colors.text}`}>{value}%</p>
        <p className="text-xs font-medium text-gray-700">{label}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

function DetailRow({ label, value, trend }: { label: string; value: number; trend: Trend }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="flex items-center gap-2">
        <span className="font-semibold text-gray-900">{value}</span>
        <DeltaBadge trend={trend} />
      </span>
    </div>
  );
}

function StatusBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const p = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="text-gray-400">{count} ({p}%)</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${p}%` }} />
      </div>
    </div>
  );
}