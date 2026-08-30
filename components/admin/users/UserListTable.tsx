"use client";

import { useState } from "react";
import { AdminUser } from "@/lib/admin";
import { banUserAction, unbanUserAction } from "@/app/admin/users/actions";
import { Shield, Ban, CheckCircle2, X, Check, Unlock, AlertCircle } from "lucide-react";

const BAN_REASONS = [
  "Academic Integrity Violation (Plagiarism)",
  "Spam or Malicious Bot Activity",
  "Inappropriate Content / Harassment",
  "Repeated Guideline Violations",
];

const UNBAN_REASONS = [
  "Successful Appeal / Issue Resolved",
  "Mistaken Identity / False Flag",
  "Temporary Ban Expired",
  "Admin Override",
];

export function UserListTable({ users = [] }: { users?: AdminUser[] }) {
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [optimisticStatuses, setOptimisticStatuses] = useState<Record<string, string>>({});
  
  // Custom Modal State
  const [activeModal, setActiveModal] = useState<{ user: AdminUser; type: "BAN" | "UNBAN" } | null>(null);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [customReason, setCustomReason] = useState("");
  const [successToast, setSuccessToast] = useState<string | null>(null);

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
        triggerToast(`Successfully banned ${user.name}. Audit log updated.`);
      } else {
        await unbanUserAction(user.id, selectedReasons, customReason);
        triggerToast(`Account restored for ${user.name}. Audit log updated.`);
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
      alert(`Failed to ${isBanning ? "ban" : "unban"} user. Check console for details.`);
    } finally {
      setIsProcessing(null);
    }
  };

  const currentReasonsList = activeModal?.type === "BAN" ? BAN_REASONS : UNBAN_REASONS;
  const isBanMode = activeModal?.type === "BAN";

  return (
    <>
      {/* FLOATING SUCCESS TOAST */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-gray-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-gray-800 animate-in slide-in-from-bottom-5 duration-300">
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Check className="w-3 h-3 stroke-[3]" />
          </div>
          <p className="text-xs font-medium tracking-tight">{successToast}</p>
          <button onClick={() => setSuccessToast(null)} className="text-gray-400 hover:text-white transition-colors ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TABLE CONTAINER */}
      <div className="bg-white border border-gray-100 rounded-3xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="bg-gray-50/60 border-b border-gray-100 text-[11px] font-mono uppercase tracking-wider text-gray-400">
                <th className="px-6 py-4 font-semibold">User Identity</th>
                <th className="px-6 py-4 font-semibold">System Role</th>
                <th className="px-6 py-4 font-semibold">Activity Metrics</th>
                <th className="px-6 py-4 font-semibold">Account Status</th>
                <th className="px-6 py-4 font-semibold text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-xs font-mono">
                    No users matching the active search or role criteria.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const currentStatus = optimisticStatuses[user.id] || user.status;
                  const isBanned = currentStatus === "BANNED";
                  const isSuperAdmin = user.role === "SUPER_ADMIN";
                  const isAdmin = user.role === "ADMIN";

                  return (
                    <tr key={user.id} className={`hover:bg-gray-50/50 transition-colors ${isBanned ? "bg-gray-50/30" : ""}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3.5">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${
                            isSuperAdmin ? "bg-purple-600 text-white" : isBanned ? "bg-gray-100 text-gray-400" : "bg-red-50 text-red-600 border border-red-100/60"
                          }`}>
                            {user.name.charAt(0)}
                          </div>
                          <div className={isBanned ? "opacity-50" : ""}>
                            <p className="font-semibold text-gray-900 leading-tight mb-0.5">{user.name}</p>
                            <p className="text-xs text-gray-400 font-mono">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        {isSuperAdmin ? (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-xl border border-purple-100">
                            <Shield className="w-3 h-3 text-purple-600" /> PRESIDENT
                          </span>
                        ) : isAdmin ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold text-red-700 bg-red-50 px-3 py-1 rounded-xl border border-red-100/60">
                            <Shield className="w-3 h-3" /> ADMIN
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs font-mono bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">STUDENT</span>
                        )}
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className={`flex flex-col ${isBanned ? "opacity-50" : ""}`}>
                          <span className="font-medium text-gray-900">{user.submissionCount} documents</span>
                          <span className="text-[11px] text-gray-400 font-mono">Joined {user.joinedAt}</span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        {isBanned ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-[10px] font-mono font-bold uppercase tracking-wider border border-rose-100">
                            <Ban className="w-3 h-3" /> Banned
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-mono font-bold uppercase tracking-wider border border-emerald-100">
                            <CheckCircle2 className="w-3 h-3" /> Active
                          </span>
                        )}
                      </td>
                      
                      <td className="px-6 py-4 text-right">
                        {isBanned ? (
                          <button
                            onClick={() => { setActiveModal({ user, type: "UNBAN" }); setSelectedReasons([]); setCustomReason(""); }}
                            disabled={isProcessing === user.id}
                            className="px-3.5 py-2 text-xs font-semibold rounded-xl text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors disabled:opacity-50 border border-emerald-200/60 shadow-2xs"
                          >
                            {isProcessing === user.id ? "Processing..." : "Restore Access"}
                          </button>
                        ) : (
                          <button
                            onClick={() => { setActiveModal({ user, type: "BAN" }); setSelectedReasons([]); setCustomReason(""); }}
                            disabled={isProcessing === user.id || isSuperAdmin || isAdmin}
                            className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-colors shadow-2xs ${
                              isSuperAdmin || isAdmin
                                ? "text-gray-300 bg-gray-50 border border-gray-100 cursor-not-allowed"
                                : "text-rose-600 bg-rose-50/50 hover:bg-rose-100/80 border border-rose-100 disabled:opacity-50"
                            }`}
                            title={isSuperAdmin || isAdmin ? "Protected Account" : "Suspend user"}
                          >
                            {isProcessing === user.id ? "Processing..." : isSuperAdmin || isAdmin ? "Protected" : "Ban User"}
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

      {/* CUSTOM PREMIUM BACKDROP MODAL */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-8 pt-7 pb-4 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isBanMode ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}>
                  {isBanMode ? <Ban className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900 tracking-tight">
                    {isBanMode ? "Revoke User Access" : "Restore Platform Access"}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">Target Account: <span className="font-semibold text-gray-700">{activeModal.user.name}</span></p>
                </div>
              </div>
              <button onClick={() => setActiveModal(null)} className="w-8 h-8 rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors flex justify-center items-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-3">
                <label className="block text-[11px] font-mono font-bold text-gray-400 uppercase tracking-wider">
                  {isBanMode ? "Select Infraction Categories" : "Select Approval Justification"} <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 gap-2 bg-gray-50/80 p-3 rounded-2xl border border-gray-100/80">
                  {currentReasonsList.map((reason) => {
                    const isChecked = selectedReasons.includes(reason);
                    return (
                      <button
                        key={reason} 
                        type="button" 
                        onClick={() => handleCheckboxChange(reason)}
                        className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-medium text-left transition-all ${
                          isChecked 
                            ? "bg-white text-gray-900 shadow-xs border border-gray-200/80" 
                            : "text-gray-600 hover:bg-gray-100/60 border border-transparent"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-md flex items-center justify-center transition-colors shrink-0 ${
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
                <label className="block text-[11px] font-mono font-bold text-gray-400 uppercase tracking-wider">
                  Compliance Audit Log Notes <span className="text-rose-500">*</span>
                </label>
                <textarea 
                  rows={3}
                  placeholder={isBanMode ? "Provide precise context for review boards..." : "Provide context for restoring system access..."}
                  className={`w-full p-3.5 bg-gray-50/60 border border-gray-200/80 rounded-2xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white transition-all resize-none shadow-2xs ${
                    isBanMode ? "focus:border-rose-500 focus:ring-1 focus:ring-rose-500" : "focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  }`}
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button 
                  onClick={() => setActiveModal(null)} 
                  className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200/70 text-gray-700 text-xs font-bold uppercase tracking-wider rounded-2xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  disabled={selectedReasons.length === 0 || !customReason.trim()} 
                  onClick={executeAction}
                  className={`flex-1 py-3 px-4 text-white text-xs font-bold uppercase tracking-wider rounded-2xl disabled:opacity-40 transition-all shadow-md flex items-center justify-center gap-2 ${
                    isBanMode 
                      ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20" 
                      : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                  }`}
                >
                  {isBanMode ? (
                    <><Ban className="w-4 h-4" /> Confirm Ban</>
                  ) : (
                    <><Unlock className="w-4 h-4" /> Confirm Restore</>
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