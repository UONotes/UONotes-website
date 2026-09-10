import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createR2Client, R2_BUCKET_NAME } from "@/lib/r2";
import { ArrowLeft, Check, XCircle, MessageSquareText, Paperclip, Ban, Unlock } from "lucide-react";
import { formatDate } from "@/lib/dateFormat";

type NoteAuditDetails = {
  note_title?: string | null;
  course_code?: string | null;
  reason?: string | null;
  attachment_key?: string | null;
};

type UserAuditDetails = {
  reasons?: string[];
  custom_note?: string | null;
};

type AuditRow = {
  id: string;
  action_type: string;
  target_type: string | null;
  target_id: string | null;
  created_at: string;
  details: (NoteAuditDetails & UserAuditDetails) | null;
};

const NOTE_ACTION_META: Record<string, { label: string; icon: typeof Check; color: string; bg: string }> = {
  NOTE_APPROVED: { label: "Approved", icon: Check, color: "text-emerald-700", bg: "bg-emerald-50" },
  NOTE_REJECTED: { label: "Rejected", icon: XCircle, color: "text-rose-700", bg: "bg-rose-50" },
  NOTE_CHANGES_REQUESTED: { label: "Requested fixes", icon: MessageSquareText, color: "text-orange-700", bg: "bg-orange-50" },
};

function formatRelativeTime(dateString: string | null): string {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    const diffInSec = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diffInSec < 60) return `${diffInSec}s ago`;
    if (diffInSec < 3600) return `${Math.floor(diffInSec / 60)}m ago`;
    if (diffInSec < 86400) return `${Math.floor(diffInSec / 3600)}h ago`;
    return `${Math.floor(diffInSec / 86400)}d ago`;
  }

export default async function AdminAnalyticsDetailPage({
  params,
}: {
  params: Promise<{ adminId: string }>;
}) {
  const { adminId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("is_super_admin")
    .eq("id", user.id)
    .single();

  if (!callerProfile?.is_super_admin) redirect("/admin");

  const { data: targetAdmin } = await supabase
    .from("profiles")
    .select("full_name, email, last_admin_active_at")
    .eq("id", adminId)
    .single();

  if (!targetAdmin) notFound();

  const { data: logRows } = await supabase
    .from("admin_audit_log")
    .select("id, action_type, target_type, target_id, created_at, details")
    .eq("admin_id", adminId)
    .in("action_type", ["NOTE_APPROVED", "NOTE_REJECTED", "NOTE_CHANGES_REQUESTED", "BAN", "UNBAN"])
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (logRows || []) as AuditRow[];

  // Older note entries logged before we started snapshotting
  // note_title/course_code won't have them in `details` — fall back to
  // a live lookup. Same idea for ban/unban entries: target_id points at
  // a profile, so we look those up separately to show who was affected.
  const noteRows = rows.filter((r) => r.target_type === "note");
  const userRows = rows.filter((r) => r.target_type === "user");

  const missingNoteIds = Array.from(
    new Set(noteRows.filter((r) => !r.details?.note_title && r.target_id).map((r) => r.target_id as string))
  );
  const noteFallbackMap = new Map<string, { title: string; course_code: string }>();
  if (missingNoteIds.length > 0) {
    const { data: fallbackNotes } = await supabase
      .from("notes")
      .select("id, title, course_code")
      .in("id", missingNoteIds);
    (fallbackNotes || []).forEach((n) => noteFallbackMap.set(n.id, { title: n.title, course_code: n.course_code }));
  }

  const targetUserIds = Array.from(new Set(userRows.map((r) => r.target_id).filter((id): id is string => Boolean(id))));
  const userLookupMap = new Map<string, { name: string; email: string }>();
  if (targetUserIds.length > 0) {
    const { data: targetUsers } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", targetUserIds);
    (targetUsers || []).forEach((u) =>
      userLookupMap.set(u.id, { name: u.full_name || u.email?.split("@")[0] || "Unknown user", email: u.email || "" })
    );
  }

  const r2 = createR2Client();

  const noteEntries = await Promise.all(
    noteRows.map(async (row) => {
      let attachmentUrl: string | null = null;
      if (row.details?.attachment_key) {
        const command = new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: row.details.attachment_key });
        attachmentUrl = await getSignedUrl(r2, command, { expiresIn: 3600 });
      }
      const fallback = row.target_id ? noteFallbackMap.get(row.target_id) : undefined;
      return {
        kind: "note" as const,
        id: row.id,
        actionType: row.action_type,
        createdAt: row.created_at,
        title: row.details?.note_title || fallback?.title || "Note no longer available",
        courseCode: row.details?.course_code || fallback?.course_code || "—",
        reason: row.details?.reason || null,
        attachmentUrl,
      };
    })
  );

  const userEntries = userRows.map((row) => {
    const target = row.target_id ? userLookupMap.get(row.target_id) : undefined;
    const reasons = row.details?.reasons ?? [];
    const note = row.details?.custom_note ?? null;
    return {
      kind: "user" as const,
      id: row.id,
      actionType: row.action_type,
      createdAt: row.created_at,
      targetName: target?.name || "Unknown user",
      targetEmail: target?.email || "",
      reasons,
      note,
    };
  });

  const entries = [...noteEntries, ...userEntries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const adminLabel = targetAdmin.full_name || targetAdmin.email?.split("@")[0] || "Admin";

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">

      <Link href="/admin/analytics" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-brand-red transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to analytics
      </Link>

      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-red-50 text-brand-red flex items-center justify-center font-semibold text-lg shrink-0">
          {adminLabel.charAt(0)}
        </div>
        <div>
          <h1 className="font-logo text-2xl font-bold text-[#23201D] tracking-tight">{adminLabel}</h1>
          <p className="text-sm text-gray-500">{targetAdmin.email}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs text-gray-400">Last active</p>
          <p className="text-sm font-semibold text-gray-900">{formatRelativeTime(targetAdmin.last_admin_active_at)}</p>
        </div>
      </div>

      <div className="bg-white border border-black/5 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-black/5">
          <h2 className="font-logo text-lg font-bold text-[#23201D]">Activity history</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {entries.length === 0 ? "Nothing logged yet." : `Most recent ${entries.length} action${entries.length === 1 ? "" : "s"}.`}
          </p>
        </div>

        {entries.length === 0 ? (
          <div className="py-14 text-center text-sm text-gray-400">Nothing to show yet.</div>
        ) : (
          <ul className="divide-y divide-black/5">
            {entries.map((entry) => {
              if (entry.kind === "note") {
                const meta = NOTE_ACTION_META[entry.actionType] ?? { label: entry.actionType, icon: MessageSquareText, color: "text-gray-600", bg: "bg-gray-50" };
                const Icon = meta.icon;
                return (
                  <li key={entry.id} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${meta.bg} ${meta.color}`}>
                            <Icon className="w-3 h-3" /> {meta.label}
                          </span>
                          <span className="text-xs text-gray-400">{entry.courseCode}</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 truncate">{entry.title}</p>
                        {entry.reason && (
                          <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{entry.reason}</p>
                        )}
                        {entry.attachmentUrl && ( <a>
                          
                            href={entry.attachmentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-orange-50 text-orange-700 text-xs font-semibold mt-2 hover:bg-orange-100 transition-colors"
                          
                            <Paperclip className="w-3 h-3" /> View attachment
                          </a>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 shrink-0 whitespace-nowrap">
                        {formatDate(entry.createdAt)}
                      </span>
                    </div>
                  </li>
                );
              }

              const isBan = entry.actionType === "BAN";
              return (
                <li key={entry.id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          isBan ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
                        }`}>
                          {isBan ? <Ban className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                          {isBan ? "Banned" : "Restored access for"}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{entry.targetName}</p>
                      <p className="text-xs text-gray-400">{entry.targetEmail}</p>
                      {entry.reasons.length > 0 && (
                        <p className="text-sm text-gray-600 mt-1.5">{entry.reasons.join(", ")}</p>
                      )}
                      {entry.note && (
                        <p className="text-sm text-gray-600 mt-1 leading-relaxed">{entry.note}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 shrink-0 whitespace-nowrap">
                      {formatDate(entry.createdAt)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

    </div>
  );
}