"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { setNotesDirectorAction, setVpNotesAction } from "@/app/admin/users/actions";
import { ROLE_LABEL, type AdminRole } from "@/lib/admin";

// Super-admin-only role management on a user's profile. Roles are a
// ladder — Student → Notes Director → VP Notes — so each step can be
// granted or removed one at a time.
export function RoleControls({ userId, role, userName }: { userId: string; role: AdminRole; userName: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const run = async (key: string, confirmText: string, action: () => Promise<unknown>) => {
    if (!window.confirm(confirmText)) return;
    setBusy(key);
    setError("");
    try {
      await action();
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Couldn't update this user's role.");
    } finally {
      setBusy(null);
    }
  };

  const options: { key: string; label: string; primary?: boolean; confirm: string; action: () => Promise<unknown> }[] = [];

  if (role === "STUDENT") {
    options.push({
      key: "grant-director",
      label: `Make ${ROLE_LABEL.ADMIN}`,
      primary: true,
      confirm: `Make ${userName} a Notes Director? They'll get access to the admin console and can review and fix notes.`,
      action: () => setNotesDirectorAction(userId, true),
    });
  }
  if (role === "ADMIN") {
    options.push(
      {
        key: "grant-vp",
        label: `Make ${ROLE_LABEL.VP_NOTES}`,
        primary: true,
        confirm: `Make ${userName} VP Notes? They'll be able to approve, deny and send back notes in final check.`,
        action: () => setVpNotesAction(userId, true),
      },
      {
        key: "revoke-director",
        label: `Remove ${ROLE_LABEL.ADMIN}`,
        confirm: `Remove ${userName} as a Notes Director? They'll lose access to the admin console, and any notes they've claimed will be released.`,
        action: () => setNotesDirectorAction(userId, false),
      }
    );
  }
  if (role === "VP_NOTES") {
    options.push(
      {
        key: "revoke-vp",
        label: `Remove ${ROLE_LABEL.VP_NOTES}`,
        confirm: `Remove VP Notes from ${userName}? They'll stay a Notes Director but can no longer do final checks.`,
        action: () => setVpNotesAction(userId, false),
      },
      {
        key: "revoke-director",
        label: "Remove all roles",
        confirm: `Remove all of ${userName}'s roles? They'll lose access to the admin console, and any notes they've claimed will be released.`,
        action: () => setNotesDirectorAction(userId, false),
      }
    );
  }

  if (options.length === 0) return null;

  return (
    <div className="flex flex-col items-start sm:items-end gap-1.5">
      <div className="flex flex-wrap gap-2 sm:justify-end">
        {options.map((o) => (
          <button
            key={o.key}
            onClick={() => run(o.key, o.confirm, o.action)}
            disabled={busy !== null}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors disabled:opacity-50 ${
              o.primary
                ? "bg-brand-red text-white hover:bg-brand-red-hover"
                : "bg-white border border-brand-border-light text-brand-body hover:border-brand-red/40 hover:text-brand-red"
            }`}
          >
            {busy === o.key && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {o.label}
          </button>
        ))}
      </div>
      {error && <p className="text-[11px] text-red-600 max-w-[260px] sm:text-right">{error}</p>}
    </div>
  );
}
