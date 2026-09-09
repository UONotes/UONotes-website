"use client";

import { useState, useEffect } from "react";
import { AdminUser } from "@/lib/admin";
import { banUserAction, unbanUserAction, fetchMoreUsersAction } from "@/app/admin/users/actions";
import { Shield, Ban, CheckCircle2, X, Check, Unlock } from "lucide-react";

const VALID_ROLES = ["SUPER_ADMIN", "ADMIN", "STUDENT"] as const;
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

  useEffect(() => {
    setUsers(initialUsers);
    setCurrentPage(1);
  }, [initialUsers]);
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
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-[#23201D] text-white px-4 py-3 rounded-xl shadow-xl animate-in slide-in-from-bottom-5 duration-300">
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
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-red-600 text-white px-4 py-3 rounded-xl shadow-xl animate-in slide-in-from-bottom-5 duration-300">
          <p className="text-xs font-medium">{actionError}</p>
        </div>
      )}

      <div className="bg-white border border-black/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-gray-50/60 border-b border-black/5 text-xs text-gray-400">
                <th className="px-5 py-3 font-medium">Person</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Activity</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 text-sm">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-gray-400 text-sm">
                    No users match this search or filter.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const currentStatus = optimisticStatuses[user.id] || user.status;
                  const isBanned = currentStatus === "BANNED";

                  const safeRole = isValidRole(user.role) ? user.role : "STUDENT";
                  const isSuperAdmin = safeRole === "SUPER_ADMIN";
                  const isAdmin = safeRole === "ADMIN";
                  const isSelf = user.id === viewerId;
                  const isProtected = isSuperAdmin || isSelf || (isAdmin && !viewerIsSuperAdmin);

                  return (
                    <tr key={user.id} className={`hover:bg-gray-50/50 transition-colors ${isBanned ? "bg-gray-50/30" : ""}`}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs shrink-0 ${
                            isSuperAdmin ? "bg-purple-600 text-white" : isBanned ? "bg-gray-100 text-gray-400" : "bg-red-50 text-brand-red"
                          }`}>
                            {user.name.charAt(0)}
                          </div>
                          <div className={isBanned ? "opacity-50" : ""}>
                            <p className="font-semibold text-gray-900 leading-tight">{user.name}</p>
                            <p className="text-xs text-gray-400">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        {isSuperAdmin ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full">
                            <Shield className="w-3 h-3" /> Super admin
                          </span>
                        ) : isAdmin ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-red bg-red-50 px-2.5 py-1 rounded-full">
                            <Shield className="w-3 h-3" /> Admin
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">Student</span>
                        )}
                      </td>

                      <td className="px-5 py-3.5">
                        <div className={`flex flex-col ${isBanned ? "opacity-50" : ""}`}>
                          <span className="font-medium text-gray-800 text-sm">{user.submissionCount} submissions</span>
                          <span className="text-xs text-gray-400">Joined {user.joinedAt}</span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        {isBanned ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 text-xs font-semibold">
                            <Ban className="w-3 h-3" /> Banned
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-semibold">
                            <CheckCircle2 className="w-3 h-3" /> Active
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        {isBanned ? (
                          <button
                            onClick={() => { setActiveModal({ user, type: "UNBAN" }); setSelectedReasons([]); setCustomReason(""); }}
                            disabled={isProcessing === user.id}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                          >
                            {isProcessing === user.id ? "Working…" : "Restore access"}
                          </button>
                        ) : (
                          <button
                            onClick={() => { setActiveModal({ user, type: "BAN" }); setSelectedReasons([]); setCustomReason(""); }}
                            disabled={isProcessing === user.id || isProtected}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                              isProtected
                                ? "text-gray-300 bg-gray-50 cursor-not-allowed"
                                : "text-rose-600 bg-rose-50/70 hover:bg-rose-100 disabled:opacity-50"
                            }`}
                            title={isProtected ? "Protected account" : "Suspend user"}
                          >
                            {isProcessing === user.id ? "Working…" : isProtected ? "Protected" : "Ban user"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      {hasMore && (
        <div className="flex justify-center py-6">
          <button
            onClick={handleShowMore}
            disabled={isLoadingMore}
            className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:border-brand-red/40 hover:text-brand-red transition-colors disabled:opacity-60"
          >
            {isLoadingMore ? "Loading…" : `Show More (${totalUsers - users.length} remaining)`}
          </button>
        </div>
      )}

      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-black/5 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-black/5">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isBanMode ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}>
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
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-left transition-all ${
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
                  className={`w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white transition-all resize-none ${
                    isBanMode ? "focus:border-rose-400 focus:ring-1 focus:ring-rose-400" : "focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                  }`}
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <button
                  onClick={() => setActiveModal(null)}
                  className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200/70 text-gray-700 text-sm font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={selectedReasons.length === 0 || !customReason.trim()}
                  onClick={executeAction}
                  className={`flex-1 py-2.5 px-4 text-white text-sm font-semibold rounded-xl disabled:opacity-40 transition-all flex items-center justify-center gap-2 ${
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