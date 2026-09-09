import Link from "next/link";
import {
  Clock, ShieldAlert, RotateCcw, Users, ArrowRight,
  CheckCircle2, AlertOctagon, Bell, Check, XCircle, MessageSquareText,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const diffInSec = Math.floor((Date.now() - date.getTime()) / 1000);

  if (diffInSec < 60) return `${diffInSec}s ago`;
  if (diffInSec < 3600) return `${Math.floor(diffInSec / 60)}m ago`;
  if (diffInSec < 86400) return `${Math.floor(diffInSec / 3600)}h ago`;
  return `${Math.floor(diffInSec / 86400)}d ago`;
}

const ACTION_META: Record<string, { label: string; icon: typeof Check; color: string }> = {
  NOTE_APPROVED: { label: "approved", icon: Check, color: "text-emerald-600" },
  NOTE_REJECTED: { label: "rejected", icon: XCircle, color: "text-rose-600" },
  NOTE_CHANGES_REQUESTED: { label: "requested fixes on", icon: MessageSquareText, color: "text-orange-600" },
};

type AuditRow = {
  id: string;
  action_type: string;
  created_at: string;
  details: { reason?: string | null } | null;
  admin: { full_name: string | null; email: string | null } | { full_name: string | null; email: string | null }[] | null;
};

export default async function AdminOverviewPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  let adminName = "Administrator";
  let adminEmail = user?.email || "";

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", user.id)
      .single();

    if (profile?.email) adminEmail = profile.email;

    if (profile?.full_name) {
      adminName = profile.full_name;
    } else if (user.user_metadata?.full_name) {
      adminName = user.user_metadata.full_name;
    } else if (adminEmail) {
      const prefix = adminEmail.split("@")[0];
      adminName = prefix
        .split(/[._-]/)
        .map((chunk: string) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
        .join(" ");
    }
  }

  const [
    { count: pendingCount },
    { count: flaggedCount },
    { count: changesRequestedCount },
    { count: userCount },
    { count: personalReviewedCount },
    { data: queueItems },
    { data: settingsData },
    { data: recentActivity },
  ] = await Promise.all([
    supabase.from("notes").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("notes").select("*", { count: "exact", head: true }).eq("status", "flagged"),
    supabase.from("notes").select("*", { count: "exact", head: true }).eq("status", "changes_requested"),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    user ? supabase.from("notes").select("*", { count: "exact", head: true }).eq("reviewed_by", user.id) : Promise.resolve({ count: 0 }),
    supabase
      .from("notes")
      .select("id, title, course_code, created_at, status, flag_reason")
      .in("status", ["pending", "flagged", "changes_requested"])
      .order("created_at", { ascending: true })
      .limit(6),
    supabase.from("platform_settings").select("announcement_banner").single(),
    supabase
      .from("admin_audit_log")
      .select("id, action_type, created_at, details, admin:profiles(full_name, email)")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const urgentCount = (pendingCount ?? 0) + (flaggedCount ?? 0);
  const isHealthy = urgentCount === 0;
  const activeAnnouncement = settingsData?.announcement_banner;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-10">

      {activeAnnouncement && activeAnnouncement.trim() !== "" && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-amber-950">
          <Bell className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Announcement</p>
            <p className="text-sm mt-0.5">{activeAnnouncement}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-7 border-b border-black/5">
        <div>
          <p className="text-sm text-gray-400 mb-1">{adminEmail}</p>
          <h1 className="font-logo text-3xl font-bold text-[#23201D] tracking-tight">
            Welcome back, {adminName.split(" ")[0]}
          </h1>
        </div>

        <div className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold w-fit ${
          isHealthy ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"
        }`}>
          {isHealthy ? <CheckCircle2 className="w-4 h-4" /> : <AlertOctagon className="w-4 h-4" />}
          {isHealthy ? "Queue is clear" : `${urgentCount} item${urgentCount === 1 ? "" : "s"} need attention`}
        </div>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-black/5 border border-black/5 rounded-2xl bg-white overflow-hidden">
        <StatCell label="Pending" value={pendingCount ?? 0} accent="text-blue-600" />
        <StatCell label="Awaiting fixes" value={changesRequestedCount ?? 0} accent="text-orange-600" />
        <StatCell label="Flagged" value={flaggedCount ?? 0} accent="text-purple-600" />
        <StatCell label="You've reviewed" value={personalReviewedCount ?? 0} accent="text-brand-red" />
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Worklist */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-black/5 overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-black/5 flex items-center justify-between">
            <h2 className="font-logo text-lg font-bold text-[#23201D]">Needs a decision</h2>
            <Link
              href="/admin/queue"
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-red hover:text-brand-red-hover"
            >
              Full queue <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-black/5 flex-1">
            {!queueItems || queueItems.length === 0 ? (
              <div className="py-16 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-900">Nothing waiting on you</p>
                <p className="text-xs text-gray-400 mt-1">Every submission has been triaged.</p>
              </div>
            ) : (
              queueItems.map((item) => {
                const isFlagged = item.status === "flagged";
                const isChangesRequested = item.status === "changes_requested";
                const dotColor = isFlagged ? "bg-purple-500" : isChangesRequested ? "bg-orange-500" : "bg-blue-500";

                return (
                  <Link
                    key={item.id}
                    href={`/admin/review/${item.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-gray-50/80 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-brand-red transition-colors">
                          {item.title}
                        </p>
                        <p className="text-xs text-gray-400">
                          {item.course_code} · {formatRelativeTime(item.created_at)}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-brand-red shrink-0 transition-colors" />
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">

          <div className="bg-white rounded-2xl border border-black/5 p-5">
            <h2 className="font-logo text-lg font-bold text-[#23201D] mb-4">Shortcuts</h2>
            <div className="space-y-1.5">
              <Link
                href="/admin/queue"
                className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 text-sm text-gray-700 transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-purple-500" /> Flagged reports
                </span>
                <span className="text-xs font-semibold text-gray-400">{flaggedCount ?? 0}</span>
              </Link>
              <Link
                href="/admin/queue"
                className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 text-sm text-gray-700 transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <RotateCcw className="w-4 h-4 text-orange-500" /> Awaiting fixes
                </span>
                <span className="text-xs font-semibold text-gray-400">{changesRequestedCount ?? 0}</span>
              </Link>
              <Link
                href="/admin/users"
                className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 text-sm text-gray-700 transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-gray-400" /> Users
                </span>
                <span className="text-xs font-semibold text-gray-400">{userCount ?? 0}</span>
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-black/5 p-5">
            <h2 className="font-logo text-lg font-bold text-[#23201D] mb-4">Recent activity</h2>
            {!recentActivity || recentActivity.length === 0 ? (
              <p className="text-xs text-gray-400">No reviews logged yet.</p>
            ) : (
              <ul className="space-y-3.5">
                {(recentActivity as unknown as AuditRow[]).map((row) => {
                  const meta = ACTION_META[row.action_type] ?? { label: row.action_type, icon: Clock, color: "text-gray-500" };
                  const Icon = meta.icon;
                  const adminInfo = Array.isArray(row.admin) ? row.admin[0] : row.admin;
                  const adminLabel = adminInfo?.full_name || adminInfo?.email?.split("@")[0] || "An admin";

                  return (
                    <li key={row.id} className="flex items-start gap-2.5 text-xs">
                      <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${meta.color}`} />
                      <p className="text-gray-600 leading-relaxed">
                        <span className="font-semibold text-gray-900">{adminLabel}</span> {meta.label} a submission
                        <span className="text-gray-400"> · {formatRelativeTime(row.created_at)}</span>
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

function StatCell({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="p-5">
      <p className={`text-2xl font-bold font-logo ${accent}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}