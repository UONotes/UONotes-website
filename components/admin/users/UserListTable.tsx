"use client";

import { useState } from "react";
import Link from "next/link";
import { AdminUser } from "@/lib/admin";
import { banUserAction, unbanUserAction, fetchMoreUsersAction } from "@/app/admin/users/actions";
import { Ban, X, Check, Unlock, Shield, UserRound } from "lucide-react";
import { RoleBadge } from "@/components/admin/users/RoleBadge";

const VALID_ROLES = ["SUPER_ADMIN", "VP_NOTES", "ADMIN", "STUDENT"] as const;
type ValidRole = typeof VALID_ROLES[number];

function isValidRole(role: unknown): role is ValidRole {
  return typeof role === "string" && (VALID_ROLES as readonly string[]).includes(role);
}

type IncomingUser = Omit<AdminUser, "role"> & { role?: unknown };

const BAN_REASONS = [
  "Academic integrity violation (plagiarism)",
  "Spam or bot activity",
  "Inappropriate content or harassment",
  "Repeated guideline violations",
];

const UNBAN_REASONS = [
  "Successful appeal / issue resolved",
  "Mistaken identity or false flag",
  "Temporary ban expired",
  "Admin override",
];

export function UserListTable({
  users: initialUsers = [],
  totalUsers = 0,
  query = "",
  roleFilter = "ALL",
  viewerIsSuperAdmin = false,
  viewerId,
}: {
  users?: IncomingUser[];
  totalUsers?: number;
  query?: string;
  roleFilter?: string;
  viewerIsSuperAdmin?: boolean;
  viewerId?: string;
}) {
  const [users, setUsers] = useState<IncomingUser[]>(initialUsers);
  const [currentPage, setCurrentPage] = useState(1);

  // New search/filter results from the server replace the list and reset paging
  const [prevInitialUsers, setPrevInitialUsers] = useState(initialUsers);
  if (initialUsers !== prevInitialUsers) {
    setPrevInitialUsers(initialUsers);
    setUsers(initialUsers);
    setCurrentPage(1);
  }
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const hasMore = users.length < totalUsers;

  async function handleShowMore() {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const moreUsers = await fetchMoreUsersAction(nextPage, query, roleFilter);
      setUsers((prev) => [...prev, ...moreUsers]);
      setCurrentPage(nextPage);
    } catch (err) {
      console.error("Failed to load more users:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }

  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [optimisticStatuses, setOptimisticStatuses] = useState<Record<string, string>>({});

  const [activeModal, setActiveModal] = useState<{ user: IncomingUser; type: "BAN" | "UNBAN" } | null>(null);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [customReason, setCustomReason] = useState("");
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const triggerToast = (message: string) => {
    setSuccessToast(message);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleCheckboxChange = (reason: string) => {
    setSelectedReasons(prev =>
      prev.includes(reason) ? prev.filter(r => r !== reason) : [...prev, reason]
    );
  };

  const executeAction = async () => {
    if (!activeModal || selectedReasons.length === 0 || !customReason.trim()) return;

    const { user, type } = activeModal;
    const isBanning = type === "BAN";
    const targetStatus = isBanning ? "BANNED" : "ACTIVE";

    setIsProcessing(user.id);
    setActiveModal(null);
    setOptimisticStatuses(prev => ({ ...prev, [user.id]: targetStatus }));

    try {
      if (isBanning) {
        await banUserAction(user.id, selectedReasons, customReason);
        triggerToast(`${user.name} was banned. Logged to the audit trail.`);
      } else {
        await unbanUserAction(user.id, selectedReasons, customReason);
        triggerToast(`Access restored for ${user.name}. Logged to the audit trail.`);
      }

      setSelectedReasons([]);
      setCustomReason("");

    } catch (error) {
      console.error(error);
      setOptimisticStatuses(prev => {
        const newState = { ...prev };
        delete newState[user.id];
        return newState;
      });
      setActionError(`Couldn't ${isBanning ? "ban" : "restore"} this user. Try again.`);
      setTimeout(() => setActionError(null), 4000);
    } finally {
      setIsProcessing(null);
    }
  };

  const currentReasonsList = activeModal?.type === "BAN" ? BAN_REASONS : UNBAN_REASONS;
  const isBanMode = activeModal?.type === "BAN";

  return (
    <>
      {successToast && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-50 flex items-center gap-3 bg-brand-dark text-white px-4 py-3 rounded-lg shadow-xl animate-in slide-in-from-bottom-5 duration-300">
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Check className="w-3 h-3 stroke-[3]" />
          </div>
          <p className="text-xs font-medium">{successToast}</p>
          <button onClick={() => setSuccessToast(null)} className="text-gray-400 hover:text-white transition-colors ml-2">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {actionError && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-50 flex items-center gap-3 bg-rose-600 text-white px-4 py-3 rounded-lg shadow-xl animate-in slide-in-from-bottom-5 duration-300">
          <p className="text-xs font-medium">{actionError}</p>
        </div>
      )}

      {users.length === 0 ? (
        <div className="rounded-lg border border-brand-border-light bg-white px-5 py-14 text-center">
          <p className="font-medium text-brand-dark">No one matches that</p>
          <p className="text-sm text-brand-muted mt-1">Try a different name, email or role filter.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-brand-border-light bg-white overflow-hidden">
          {/* Column headings (tablet and up) */}
          <div className="hidden md:grid grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1fr)_15rem] gap-4 px-5 py-2.5 border-b border-brand-border-light bg-brand-surface/60 text-xs font-medium text-brand-muted">
            <span>Person</span>
            <span>Role</span>
            <span>Submissions</span>
            <span className="text-right">Actions</span>
          </div>

          <ul className="divide-y divide-brand-border-light">
            {users.map((user) => {
              const currentStatus = optimisticStatuses[user.id] || user.status;
              const isBanned = currentStatus === "BANNED";

              const safeRole = isValidRole(user.role) ? user.role : "STUDENT";
              const isSuperAdmin = safeRole === "SUPER_ADMIN";
              // Notes Directors and VP Notes can only be banned by a super admin.
              const isStaffRole = safeRole === "ADMIN" || safeRole === "VP_NOTES";
              const isSelf = user.id === viewerId;
              const isProtected = isSuperAdmin || isSelf || (isStaffRole && !viewerIsSuperAdmin);
              const busy = isProcessing === user.id;

              const buttonBase =
                "inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors disabled:opacity-50";

              const accountAction = isBanned ? (
                <button
                  onClick={() => { setActiveModal({ user, type: "UNBAN" }); setSelectedReasons([]); setCustomReason(""); }}
                  disabled={busy}
                  className={`${buttonBase} border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100`}
                >
                  <Unlock className="w-3.5 h-3.5" />
                  {busy ? "Working…" : "Restore"}
                </button>
              ) : isProtected ? (
                <span
                  className={`${buttonBase} border-brand-border-light bg-brand-surface text-brand-muted cursor-not-allowed`}
                  title={isSelf ? "This is you" : "Only a super admin can ban this account"}
                >
                  <Shield className="w-3.5 h-3.5" />
                  {isSelf ? "You" : "Protected"}
                </span>
              ) : (
                <button
                  onClick={() => { setActiveModal({ user, type: "BAN" }); setSelectedReasons([]); setCustomReason(""); }}
                  disabled={busy}
                  className={`${buttonBase} border-rose-200 bg-white text-rose-600 hover:bg-rose-50 hover:border-rose-300`}
                >
                  <Ban className="w-3.5 h-3.5" />
                  {busy ? "Working…" : "Ban"}
                </button>
              );

              return (
                <li
                  key={user.id}
                  className="relative grid grid-cols-[auto_minmax(0,1fr)_auto] md:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1fr)_15rem] items-center gap-x-3 md:gap-4 px-4 md:px-5 py-3 hover:bg-brand-surface/50 transition-colors"
                >
                  {/* Person — the link stretches over the whole row */}
                  <div className="contents md:flex md:items-center md:gap-3 md:min-w-0">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm shrink-0 ${
                        isBanned ? "bg-gray-100 text-gray-400" : "bg-brand-pink text-brand-red"
                      }`}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className={`font-semibold text-brand-dark hover:text-brand-red after:absolute after:inset-0 ${isBanned ? "opacity-60" : ""}`}
                      >
                        {user.name}
                      </Link>
                      <p className="text-xs text-brand-muted truncate">{user.email}</p>
                      {/* Phone-only summary line */}
                      <div className="md:hidden mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <RoleBadge role={safeRole} />
                        <span className="text-xs text-brand-muted">
                          {user.submissionCount} submission{user.submissionCount === 1 ? "" : "s"}
                        </span>
                        {isBanned && <span className="text-xs font-semibold text-rose-600">Banned</span>}
                      </div>
                    </div>
                  </div>

                  <div className="hidden md:flex flex-col items-start gap-1">
                    <RoleBadge role={safeRole} />
                    {isBanned && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600">
                        <Ban className="w-3 h-3" /> Banned
                      </span>
                    )}
                  </div>

                  <div className="hidden md:block text-sm">
                    <span className="text-brand-dark tabular-nums">{user.submissionCount}</span>
                    <span className="block text-xs text-brand-muted">Joined {user.joinedAt}</span>
                  </div>

                  {/* Sits above the row link so it stays clickable */}
                  <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className={`${buttonBase} border-brand-border-light bg-white text-brand-dark hover:border-brand-red/40 hover:text-brand-red`}
                    >
                      <UserRound className="w-3.5 h-3.5" /> View profile
                    </Link>
                    {accountAction}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {hasMore && (
        <div className="flex justify-center py-6">
          <button
            onClick={handleShowMore}
            disabled={isLoadingMore}
            className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:border-brand-red/40 hover:text-brand-red transition-colors disabled:opacity-60"
          >
            {isLoadingMore ? "Loading…" : `Show More (${totalUsers - users.length} remaining)`}
          </button>
        </div>
      )}

      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-lg shadow-2xl border border-brand-border-light w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-brand-border-light">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isBanMode ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}>
                  {isBanMode ? <Ban className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-logo font-bold text-base text-gray-900">
                    {isBanMode ? "Ban this user" : "Restore access"}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">{activeModal.user.name}</p>
                </div>
              </div>
              <button onClick={() => setActiveModal(null)} className="w-7 h-7 rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors flex justify-center items-center">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-500">
                  {isBanMode ? "Reason" : "Reason for restoring"} <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  {currentReasonsList.map((reason) => {
                    const isChecked = selectedReasons.includes(reason);
                    return (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => handleCheckboxChange(reason)}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs text-left transition-all ${
                          isChecked
                            ? "bg-gray-50 text-gray-900 font-medium border border-gray-200"
                            : "text-gray-600 hover:bg-gray-50 border border-transparent"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 ${
                          isChecked ? (isBanMode ? "bg-rose-600 text-white" : "bg-emerald-600 text-white") : "border border-gray-300 bg-white"
                        }`}>
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        {reason}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-500">
                  Notes for the record <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder={isBanMode ? "What happened, specifically…" : "Why access is being restored…"}
                  className={`w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-base sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white transition-all resize-none ${
                    isBanMode ? "focus:border-rose-400 focus:ring-1 focus:ring-rose-400" : "focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                  }`}
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <button
                  onClick={() => setActiveModal(null)}
                  className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200/70 text-gray-700 text-sm font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={selectedReasons.length === 0 || !customReason.trim()}
                  onClick={executeAction}
                  className={`flex-1 py-2.5 px-4 text-white text-sm font-semibold rounded-lg disabled:opacity-40 transition-all flex items-center justify-center gap-2 ${
                    isBanMode
                      ? "bg-rose-600 hover:bg-rose-700"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  {isBanMode ? (
                    <><Ban className="w-4 h-4" /> Confirm ban</>
                  ) : (
                    <><Unlock className="w-4 h-4" /> Confirm restore</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}