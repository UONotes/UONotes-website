import Link from "next/link";
import {
  Clock, RotateCcw, ArrowRight, CheckCircle2, Megaphone, Check, XCircle, MessageSquareText,
  Wrench, CheckCheck, ShieldCheck, Ban, Unlock, UserCog,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { canFinalCheck } from "@/lib/review";
import { roleOf, ROLE_LABEL } from "@/lib/admin";

function formatRelativeTime(dateString: string): string {
  const diffInSec = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (diffInSec < 60) return "just now";
  if (diffInSec < 3600) return `${Math.floor(diffInSec / 60)}m ago`;
  if (diffInSec < 86400) return `${Math.floor(diffInSec / 3600)}h ago`;
  return `${Math.floor(diffInSec / 86400)}d ago`;
}

// How each audit entry reads in the activity feed: "<name> <phrase>".
const ACTION_META: Record<string, { phrase: string; icon: typeof Check }> = {
  NOTE_APPROVED: { phrase: "approved a note", icon: Check },
  NOTE_APPROVED_WITH_FIXES: { phrase: "approved a fixed note", icon: CheckCheck },
  NOTE_REJECTED: { phrase: "denied a note", icon: XCircle },
  NOTE_SENT_TO_FINAL_CHECK: { phrase: "sent a note to final check", icon: ShieldCheck },
  NOTE_SENT_BACK_TO_PENDING: { phrase: "sent a note back to pending", icon: RotateCcw },
  NOTE_FIXES_STARTED: { phrase: "started fixing a note", icon: Wrench },
  NOTE_FIXES_TAKEN_OVER: { phrase: "took over fixing a note", icon: Wrench },
  NOTE_FIXES_CANCELLED: { phrase: "stopped fixing a note", icon: RotateCcw },
  NOTE_FIX_SUBMITTED: { phrase: "submitted a fix", icon: Wrench },
  NOTE_FIX_SENT_BACK: { phrase: "sent back a fix", icon: RotateCcw },
  NOTE_CHANGES_REQUESTED: { phrase: "requested fixes on a note", icon: MessageSquareText },
  BAN: { phrase: "banned a user", icon: Ban },
  UNBAN: { phrase: "unbanned a user", icon: Unlock },
  GRANT_NOTES_DIRECTOR: { phrase: "added a Notes Director", icon: UserCog },
  REVOKE_NOTES_DIRECTOR: { phrase: "removed a Notes Director", icon: UserCog },
  GRANT_VP_NOTES: { phrase: "made someone VP Notes", icon: UserCog },
  REVOKE_VP_NOTES: { phrase: "removed a VP Notes role", icon: UserCog },
};

const STATUS_LABEL: Record<string, { label: string; dot: string }> = {
  pending: { label: "Pending", dot: "bg-slate-400" },
  flagged: { label: "Reported", dot: "bg-brand-red" },
  in_revision: { label: "Being fixed", dot: "bg-amber-500" },
  fix_review: { label: "Final check", dot: "bg-stone-700" },
};

type AuditRow = {
  id: string;
  action_type: string;
  created_at: string;
  admin: { full_name: string | null; email: string | null } | { full_name: string | null; email: string | null }[] | null;
};

function greeting() {
  const hour = Number(
    new Date().toLocaleString("en-US", { timeZone: "America/Toronto", hour: "numeric", hour12: false })
  );
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function AdminOverviewPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("*").eq("id", user.id).single()
    : { data: null };

  const fullName: string =
    profile?.full_name || user?.user_metadata?.full_name || (profile?.email || user?.email || "").split("@")[0];
  const firstName = fullName.split(/[ ._-]/)[0] || "there";
  const role = profile ? roleOf(profile) : null;
  const isFinalChecker = canFinalCheck(profile);

  const count = (status: string) =>
    supabase.from("notes").select("*", { count: "exact", head: true }).eq("status", status);

  const [
    { count: pendingCount },
    { count: flaggedCount },
    { count: beingFixedCount },
    { count: finalCheckCount },
    { data: queueItems },
    { data: settingsData },
    { data: recentActivity },
  ] = await Promise.all([
    count("pending"),
    count("flagged"),
    count("in_revision"),
    count("fix_review"),
    supabase
      .from("notes")
      .select("id, title, course_code, created_at, status")
      .in("status", ["pending", "flagged", "in_revision", "fix_review"])
      .order("created_at", { ascending: true })
      .limit(7),
    supabase.from("platform_settings").select("announcement_banner").single(),
    supabase
      .from("admin_audit_log")
      .select("id, action_type, created_at, admin:profiles(full_name, email)")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const waiting = (pendingCount ?? 0) + (flaggedCount ?? 0) + (finalCheckCount ?? 0);
  const announcement = settingsData?.announcement_banner?.trim();

  // Final checks come first for the people who can do them.
  const stats = [
    ...(isFinalChecker ? [{ label: "Final check", value: finalCheckCount ?? 0, href: "/admin/queue?filter=fix_review", dot: "bg-stone-700" }] : []),
    { label: "Pending review", value: pendingCount ?? 0, href: "/admin/queue?filter=pending", dot: "bg-slate-400" },
    { label: "Reported", value: flaggedCount ?? 0, href: "/admin/queue?filter=flagged", dot: "bg-brand-red" },
    { label: "Being fixed", value: beingFixedCount ?? 0, href: "/admin/queue?filter=in_revision", dot: "bg-amber-500" },
    ...(!isFinalChecker ? [{ label: "In final check", value: finalCheckCount ?? 0, href: "/admin/queue?filter=fix_review", dot: "bg-stone-700" }] : []),
  ];

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-sm text-brand-muted">{role ? ROLE_LABEL[role] : "Admin console"}</p>
          <h1 className="font-logo text-3xl font-bold text-brand-dark tracking-tight mt-1">
            {greeting()}, {firstName}
          </h1>
        </div>
        <p className="text-sm text-brand-body">
          {waiting === 0 ? (
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Nothing is waiting on a decision.
            </span>
          ) : (
            <>
              <span className="font-semibold text-brand-dark">{waiting}</span> note{waiting === 1 ? "" : "s"} waiting on a
              decision.
            </>
          )}
        </p>
      </header>

      {announcement && (
        <div className="flex items-start gap-3 rounded-lg border border-brand-red/15 bg-brand-pink px-4 py-3">
          <Megaphone className="w-4 h-4 text-brand-red shrink-0 mt-0.5" />
          <p className="text-sm text-brand-dark">{announcement}</p>
        </div>
      )}

      {/* Stats */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="group rounded-lg border border-brand-border-light bg-white p-4 hover:border-brand-red/30 transition-colors"
          >
            <p className="flex items-center gap-2 text-xs font-medium text-brand-muted">
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
              {s.label}
            </p>
            <p className="mt-2 text-3xl font-semibold text-brand-dark tabular-nums">{s.value}</p>
          </Link>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Worklist */}
        <section className="lg:col-span-2 rounded-lg border border-brand-border-light bg-white overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border-light">
            <h2 className="font-semibold text-brand-dark">Oldest in the queue</h2>
            <Link
              href="/admin/queue"
              className="inline-flex items-center gap-1 text-sm font-medium text-brand-red hover:text-brand-red-hover"
            >
              Open queue <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {!queueItems || queueItems.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <p className="font-medium text-brand-dark">The queue is empty</p>
              <p className="text-sm text-brand-muted mt-1">New submissions will show up here.</p>
            </div>
          ) : (
            <ul className="divide-y divide-brand-border-light">
              {queueItems.map((item) => {
                const status = STATUS_LABEL[item.status] ?? STATUS_LABEL.pending;
                return (
                  <li key={item.id}>
                    <Link
                      href={`/admin/review/${item.id}`}
                      className="flex items-center gap-4 px-5 py-3 hover:bg-brand-surface/60 transition-colors group"
                    >
                      <span className="w-16 shrink-0 font-mono text-xs font-semibold text-brand-red">{item.course_code}</span>
                      <span className="flex-1 min-w-0 truncate text-sm font-medium text-brand-dark group-hover:text-brand-red">
                        {item.title}
                      </span>
                      <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-brand-muted shrink-0">
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                        {status.label}
                      </span>
                      <span className="w-14 text-right text-xs text-brand-muted shrink-0 tabular-nums">
                        {formatRelativeTime(item.created_at)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Activity */}
        <section className="rounded-lg border border-brand-border-light bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-brand-border-light">
            <h2 className="font-semibold text-brand-dark">Recent activity</h2>
          </div>
          {!recentActivity || recentActivity.length === 0 ? (
            <p className="px-5 py-8 text-sm text-brand-muted">Nothing logged yet.</p>
          ) : (
            <ul className="px-5 py-4 space-y-4">
              {(recentActivity as unknown as AuditRow[]).map((row) => {
                const meta = ACTION_META[row.action_type] ?? { phrase: row.action_type.toLowerCase().replace(/_/g, " "), icon: Clock };
                const Icon = meta.icon;
                const adminInfo = Array.isArray(row.admin) ? row.admin[0] : row.admin;
                const name = adminInfo?.full_name || adminInfo?.email?.split("@")[0] || "Someone";
                return (
                  <li key={row.id} className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-full bg-brand-surface flex items-center justify-center shrink-0">
                      <Icon className="w-3.5 h-3.5 text-brand-muted" />
                    </span>
                    <p className="text-sm text-brand-body leading-snug">
                      <span className="font-medium text-brand-dark">{name}</span> {meta.phrase}
                      <span className="block text-xs text-brand-muted mt-0.5">{formatRelativeTime(row.created_at)}</span>
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
