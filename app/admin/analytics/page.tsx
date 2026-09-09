import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Users, FileStack, Clock, Award, ArrowRight } from "lucide-react";

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const diffInSec = Math.floor((Date.now() - date.getTime()) / 1000);

  if (diffInSec < 60) return `${diffInSec}s ago`;
  if (diffInSec < 3600) return `${Math.floor(diffInSec / 60)}m ago`;
  if (diffInSec < 86400) return `${Math.floor(diffInSec / 3600)}h ago`;
  return `${Math.floor(diffInSec / 86400)}d ago`;
}

type AdminInfo = { full_name: string | null; email: string | null } | null;

type AuditRow = {
  admin_id: string | null;
  action_type: string;
  created_at: string;
  admin: AdminInfo | AdminInfo[];
};

type AdminAgg = {
  id: string;
  name: string;
  email: string;
  approved: number;
  rejected: number;
  changesRequested: number;
  total: number;
  lastActive: string;
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
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: totalUsers },
    { count: newUsersWeek },
    { count: newUsersMonth },
    { count: totalNotes },
    { count: notesLast30 },
    { count: pendingCount },
    { count: approvedCount },
    { count: rejectedCount },
    { count: flaggedCount },
    { count: changesRequestedCount },
    { data: hoursData },
    { data: auditRows },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
    supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", monthAgo),
    supabase.from("notes").select("*", { count: "exact", head: true }),
    supabase.from("notes").select("*", { count: "exact", head: true }).gte("created_at", monthAgo),
    supabase.from("notes").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("notes").select("*", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("notes").select("*", { count: "exact", head: true }).eq("status", "rejected"),
    supabase.from("notes").select("*", { count: "exact", head: true }).eq("status", "flagged"),
    supabase.from("notes").select("*", { count: "exact", head: true }).eq("status", "changes_requested"),
    supabase.from("notes").select("hours_awarded").eq("status", "approved"),
    supabase
      .from("admin_audit_log")
      .select("admin_id, action_type, created_at, admin:profiles(full_name, email)")
      .eq("target_type", "note")
      .order("created_at", { ascending: false })
      .limit(2000),
  ]);

  const totalHoursAwarded = (hoursData || []).reduce((sum, n) => sum + (n.hours_awarded || 0), 0);
  const avgDailySubmissions = ((notesLast30 ?? 0) / 30).toFixed(1);

  const adminMap = new Map<string, AdminAgg>();
  for (const row of (auditRows as AuditRow[] | null) || []) {
    if (!row.admin_id) continue;
    const adminInfo = Array.isArray(row.admin) ? row.admin[0] : row.admin;
    const existing = adminMap.get(row.admin_id) ?? {
      id: row.admin_id,
      name: adminInfo?.full_name || adminInfo?.email?.split("@")[0] || "Unknown",
      email: adminInfo?.email || "",
      approved: 0,
      rejected: 0,
      changesRequested: 0,
      total: 0,
      lastActive: row.created_at,
    };
    existing.total += 1;
    if (row.action_type === "NOTE_APPROVED") existing.approved += 1;
    if (row.action_type === "NOTE_REJECTED") existing.rejected += 1;
    if (row.action_type === "NOTE_CHANGES_REQUESTED") existing.changesRequested += 1;
    if (row.created_at > existing.lastActive) existing.lastActive = row.created_at;
    adminMap.set(row.admin_id, existing);
  }
  const adminStats = Array.from(adminMap.values()).sort((a, b) => b.total - a.total);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">

      <div>
        <h1 className="font-logo text-3xl font-bold text-[#23201D] tracking-tight">Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">
          Visible to super admins only.
        </p>
      </div>

      {/* Top-level stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCell icon={Users} label="Total users" value={totalUsers ?? 0} sub={`+${newUsersWeek ?? 0} this week`} color="blue" />
        <StatCell icon={FileStack} label="Total submissions" value={totalNotes ?? 0} sub={`${avgDailySubmissions}/day avg, last 30d`} color="orange" />
        <StatCell icon={Clock} label="Pending review" value={pendingCount ?? 0} sub={`${flaggedCount ?? 0} flagged`} color="purple" />
        <StatCell icon={Award} label="Hours awarded" value={totalHoursAwarded} sub={`${approvedCount ?? 0} approved notes`} color="red" />
      </div>

      {/* Signup & submission detail */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-black/5 rounded-2xl p-6">
          <h2 className="font-logo text-lg font-bold text-[#23201D] mb-4">Signups</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">New this week</span>
              <span className="font-semibold text-gray-900">{newUsersWeek ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">New this month</span>
              <span className="font-semibold text-gray-900">{newUsersMonth ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Total registered</span>
              <span className="font-semibold text-gray-900">{totalUsers ?? 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-black/5 rounded-2xl p-6">
          <h2 className="font-logo text-lg font-bold text-[#23201D] mb-4">Submission status breakdown</h2>
          <div className="space-y-2.5">
            <StatusBar label="Approved" count={approvedCount ?? 0} total={totalNotes ?? 0} color="bg-emerald-500" />
            <StatusBar label="Pending" count={pendingCount ?? 0} total={totalNotes ?? 0} color="bg-blue-500" />
            <StatusBar label="Awaiting fixes" count={changesRequestedCount ?? 0} total={totalNotes ?? 0} color="bg-orange-500" />
            <StatusBar label="Flagged" count={flaggedCount ?? 0} total={totalNotes ?? 0} color="bg-purple-500" />
            <StatusBar label="Rejected" count={rejectedCount ?? 0} total={totalNotes ?? 0} color="bg-rose-500" />
          </div>
        </div>
      </div>

      {/* Per-admin leaderboard */}
      <div className="bg-white border border-black/5 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-black/5">
          <h2 className="font-logo text-lg font-bold text-[#23201D]">Admin activity</h2>
          <p className="text-xs text-gray-400 mt-0.5">Based on the last 2,000 logged decisions. Click an admin to see their full history.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-gray-50/60 border-b border-black/5 text-xs text-gray-400">
                <th className="px-5 py-3 font-medium">Admin</th>
                <th className="px-5 py-3 font-medium text-center">Approved</th>
                <th className="px-5 py-3 font-medium text-center">Rejected</th>
                <th className="px-5 py-3 font-medium text-center">Fixes requested</th>
                <th className="px-5 py-3 font-medium text-center">Total</th>
                <th className="px-5 py-3 font-medium text-right">Last active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 text-sm">
              {adminStats.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-gray-400 text-sm">
                    No review activity logged yet.
                  </td>
                </tr>
              ) : (
                adminStats.map((admin) => (
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
                    <td className="px-5 py-3.5 text-center font-semibold text-gray-900">{admin.total}</td>
                    <td className="px-5 py-3.5 text-right">
                      <Link href={`/admin/analytics/${admin.id}`} className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-brand-red transition-colors">
                        {formatRelativeTime(admin.lastActive)} <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

const STAT_COLORS = {
  blue: { bg: "bg-blue-50", icon: "text-blue-600", bar: "bg-blue-500" },
  orange: { bg: "bg-orange-50", icon: "text-orange-600", bar: "bg-orange-500" },
  purple: { bg: "bg-purple-50", icon: "text-purple-600", bar: "bg-purple-500" },
  red: { bg: "bg-red-50", icon: "text-brand-red", bar: "bg-brand-red" },
} as const;

function StatCell({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  sub: string;
  icon: typeof Users;
  color: keyof typeof STAT_COLORS;
}) {
  const c = STAT_COLORS[color];
  return (
    <div className="relative bg-white border border-black/5 rounded-2xl p-4 overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-1 ${c.bar}`} />
      <div className={`w-9 h-9 rounded-xl ${c.bg} flex items-center justify-center mb-3`}>
        <Icon className={`w-4.5 h-4.5 ${c.icon}`} />
      </div>
      <p className="text-2xl font-bold font-logo text-[#23201D]">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      <p className="text-[11px] text-gray-400 mt-1">{sub}</p>
    </div>
  );
}

function StatusBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="text-gray-400">{count} ({pct}%)</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}