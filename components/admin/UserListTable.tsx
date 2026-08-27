"use client";

import { useState } from "react";
import { AdminUser } from "@/lib/admin";
import { Shield, Ban, CheckCircle2, AlertTriangle, X, Check, Info } from "lucide-react";

const BAN_REASONS = [
  "Academic Integrity Violation (Plagiarism)",
  "Spam or Malicious Bot Activity",
  "Inappropriate Content / Harassment",
  "Repeated Guideline Violations",
];

export function UserListTable({ initialUsers }: { initialUsers: AdminUser[] }) {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  
  // Modal & Notification State
  const [userToBan, setUserToBan] = useState<AdminUser | null>(null);
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

  const handleUnban = async (userId: string) => {
    const targetUser = users.find((u) => u.id === userId);
    setIsProcessing(userId);
    setUsers(users.map((u) => (u.id === userId ? { ...u, status: "ACTIVE" } : u)));

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      triggerToast(`Account restored for ${targetUser?.name || "user"}.`);
    } catch (error) {
      setUsers(users.map((u) => (u.id === userId ? { ...u, status: "BANNED" } : u)));
      alert("Failed to unban user.");
    } finally {
      setIsProcessing(null);
    }
  };

  const executeBan = async () => {
    if (!userToBan || selectedReasons.length === 0 || !customReason.trim()) return;

    const user = userToBan;
    const userId = user.id;
    setIsProcessing(userId);
    
    setUsers(users.map((u) => (u.id === userId ? { ...u, status: "BANNED" } : u)));
    
    setUserToBan(null);
    setSelectedReasons([]);
    setCustomReason("");

    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      triggerToast(`Successfully banned ${user.name}. Audit log updated.`);
    } catch (error) {
      setUsers(users.map((u) => (u.id === userId ? { ...u, status: "ACTIVE" } : u)));
      alert("Failed to ban user.");
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <>
      {/* FLOATING SUCCESS TOAST */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-gray-900 text-white px-5 py-3.5 rounded-2xl shadow-xl border border-gray-800/80 animate-in slide-in-from-bottom-4 duration-300">
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Check className="w-3 h-3 stroke-[3]" />
          </div>
          <p className="text-xs font-medium tracking-tight">{successToast}</p>
          <button onClick={() => setSuccessToast(null)} className="text-gray-400 hover:text-white transition-colors ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-[11px] font-mono uppercase tracking-wider text-gray-400">
                <th className="px-6 py-4 font-semibold">User</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Activity</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {users.map((user) => {
                const isBanned = user.status === "BANNED";
                const isSuperAdmin = user.role === "SUPER_ADMIN";
                const isAdmin = user.role === "ADMIN";

                return (
                  <tr key={user.id} className={`hover:bg-gray-50/40 transition-colors ${isBanned ? "bg-gray-50/20" : ""}`}>
                    
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                          isSuperAdmin ? "bg-purple-600 text-white" : isBanned ? "bg-gray-100 text-gray-400" : "bg-brand-red/10 text-brand-red"
                        }`}>
                          {user.name.charAt(0)}
                        </div>
                        <div className={isBanned ? "opacity-50" : ""}>
                          <p className="font-semibold text-gray-900 leading-none mb-1">{user.name}</p>
                          <p className="text-xs text-gray-400 font-mono">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      {isSuperAdmin ? (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-100">
                          <Shield className="w-3 h-3 text-purple-600" /> PRESIDENT (SUPER ADMIN)
                        </span>
                      ) : isAdmin ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold text-brand-red bg-brand-red/5 px-2.5 py-1 rounded-md">
                          <Shield className="w-3 h-3" /> ADMIN
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs font-mono">STUDENT</span>
                      )}
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className={`flex flex-col ${isBanned ? "opacity-50" : ""}`}>
                        <span className="font-medium text-gray-900">{user.submissionCount} documents</span>
                        <span className="text-[10px] text-gray-400 font-mono">Joined {user.joinedAt}</span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      {isBanned ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50/80 text-rose-600 text-[10px] font-mono font-bold uppercase tracking-wider border border-rose-100/50">
                          <Ban className="w-3 h-3" /> Banned
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50/80 text-emerald-600 text-[10px] font-mono font-bold uppercase tracking-wider border border-emerald-100/50">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 text-right">
                      {isBanned ? (
                        <button
                          onClick={() => handleUnban(user.id)}
                          disabled={isProcessing === user.id}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                          {isProcessing === user.id ? "..." : "Restore Access"}
                        </button>
                      ) : (
                        <button
                          onClick={() => { setUserToBan(user); setSelectedReasons([]); setCustomReason(""); }}
                          disabled={isProcessing === user.id || isSuperAdmin || isAdmin}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                            isSuperAdmin || isAdmin
                              ? "text-gray-300 cursor-not-allowed"
                              : "text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                          }`}
                          title={isSuperAdmin ? "President account is protected" : isAdmin ? "Protected admin account" : "Suspend user"}
                        >
                          {isProcessing === user.id ? "..." : isSuperAdmin ? "President Tier" : isAdmin ? "Protected" : "Ban User"}
                        </button>
                      )}
                    </td>
                    
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODERN MODAL (CLEAN, NO BLUR) */}
      {userToBan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between px-8 pt-7 pb-4">
              <div>
                <h3 className="font-bold text-lg text-gray-900 tracking-tight">Revoke User Access</h3>
                <p className="text-xs text-gray-400 mt-0.5">Target: <span className="font-medium text-gray-700">{userToBan.name}</span> ({userToBan.email})</p>
              </div>
              <button 
                onClick={() => { setUserToBan(null); setSelectedReasons([]); setCustomReason(""); }}
                className="w-8 h-8 rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-8 pb-8 space-y-5">
              
              {/* Infraction Checkboxes */}
              <div className="space-y-2.5">
                <label className="block text-[11px] font-mono font-bold text-gray-400 uppercase tracking-wider">
                  Select Infractions <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 gap-2 bg-gray-50/60 p-3.5 rounded-2xl border border-gray-100">
                  {BAN_REASONS.map((reason) => {
                    const isChecked = selectedReasons.includes(reason);
                    return (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => handleCheckboxChange(reason)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-left transition-all ${
                          isChecked 
                            ? "bg-white text-gray-900 shadow-sm border border-gray-200/60" 
                            : "text-gray-600 hover:bg-gray-100/50 border border-transparent"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-md flex items-center justify-center transition-colors ${isChecked ? "bg-rose-600 text-white" : "border border-gray-300 bg-white"}`}>
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        {reason}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Required Detailed Notes */}
              <div className="space-y-2">
                <label className="block text-[11px] font-mono font-bold text-gray-400 uppercase tracking-wider">
                  Audit Log Notes <span className="text-rose-500">*</span>
                </label>
                <textarea 
                  rows={3}
                  placeholder="Provide precise details or context for the moderation team..."
                  className="w-full p-3.5 bg-gray-50/60 border border-gray-200/60 rounded-2xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-rose-400 focus:bg-white transition-all resize-none"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => { setUserToBan(null); setSelectedReasons([]); setCustomReason(""); }}
                  className="flex-1 py-3 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold uppercase tracking-wider rounded-2xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  disabled={selectedReasons.length === 0 || !customReason.trim()}
                  onClick={executeBan}
                  className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2"
                >
                  <Ban className="w-3.5 h-3.5" /> Confirm Ban
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}