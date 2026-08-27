"use client";

import { useState } from "react";
import { Settings, Shield, Sliders, Bell, HardDrive, Save, Check, Lock } from "lucide-react";

export default function AdminSettingsPage() {
  // In a real app, this role would come from your auth session (e.g., useAuth())
  // For demonstration, we assume a mock check or allow viewing with restricted saving
  const currentUserRole: "SUPER_ADMIN" | "ADMIN" = "SUPER_ADMIN"; // Toggle to "ADMIN" to test restriction
  const isSuperAdmin = currentUserRole === "SUPER_ADMIN";

  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [autoFlagPlagiarism, setAutoFlagPlagiarism] = useState(true);
  const [maxFileSize, setMaxFileSize] = useState("25");
  const [announcementText, setAnnouncementText] = useState("Midterm season is active! Ensure notes are verified promptly.");
  const [savedToast, setSavedToast] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) return;
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  return (
    <div className="w-full flex flex-col gap-8 animate-in fade-in duration-500">
      
      {savedToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-gray-900 text-white px-5 py-3.5 rounded-2xl shadow-xl border border-gray-800/80 animate-in slide-in-from-bottom-4 duration-300">
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Check className="w-3 h-3 stroke-[3]" />
          </div>
          <p className="text-xs font-medium tracking-tight">System settings successfully updated.</p>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Platform Settings</h1>
            {!isSuperAdmin && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-[10px] font-mono font-bold">
                <Lock className="w-3 h-3" /> Read-Only (President Only)
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">Configure global feature flags, storage constraints, and system broadcasts.</p>
        </div>

        {isSuperAdmin && (
          <button
            onClick={handleSaveSettings}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-gray-900/10"
          >
            <Save className="w-4 h-4" /> Save Changes
          </button>
        )}
      </div>

      <form onSubmit={handleSaveSettings} className={`grid grid-cols-1 gap-6 max-w-4xl ${!isSuperAdmin ? "opacity-90 pointer-events-none select-none" : ""}`}>
        
        {/* SYSTEM CONTROLS */}
        <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <div className="w-9 h-9 rounded-xl bg-gray-50 text-gray-700 flex items-center justify-center shrink-0 border border-gray-100">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Operational Toggles</h2>
              <p className="text-xs text-gray-400">Manage global site availability and automated moderation rules.</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">Emergency Maintenance Mode</p>
                <p className="text-xs text-gray-500 max-w-md">Temporarily restricts student uploads and logins during database migrations or security incidents.</p>
              </div>
              <button
                type="button"
                onClick={() => setMaintenanceMode(!maintenanceMode)}
                className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                  maintenanceMode ? "bg-rose-600" : "bg-gray-200"
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  maintenanceMode ? "translate-x-6" : "translate-x-0"
                }`} />
              </button>
            </div>

            <div className="h-px bg-gray-50" />

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">Automated Plagiarism Pre-Screening</p>
                <p className="text-xs text-gray-500 max-w-md">Automatically route incoming PDFs with high textual similarity scores straight to the flagged queue.</p>
              </div>
              <button
                type="button"
                onClick={() => setAutoFlagPlagiarism(!autoFlagPlagiarism)}
                className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                  autoFlagPlagiarism ? "bg-brand-red" : "bg-gray-200"
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  autoFlagPlagiarism ? "translate-x-6" : "translate-x-0"
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* STORAGE & FILE CONSTRAINTS */}
        <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <div className="w-9 h-9 rounded-xl bg-gray-50 text-gray-700 flex items-center justify-center shrink-0 border border-gray-100">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Storage & File Constraints</h2>
              <p className="text-xs text-gray-400">Control maximum allowable document payloads for student uploads.</p>
            </div>
          </div>

          <div className="space-y-2 max-w-md">
            <label className="block text-xs font-mono font-bold text-gray-700 uppercase tracking-wider">
              Maximum File Size Limit (MB)
            </label>
            <input 
              type="number"
              value={maxFileSize}
              onChange={(e) => setMaxFileSize(e.target.value)}
              className="w-full p-3.5 bg-gray-50 border border-gray-200/80 rounded-2xl text-sm font-medium text-gray-900 focus:outline-none focus:border-brand-red focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* BROADCAST ANNOUNCEMENTS */}
        <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <div className="w-9 h-9 rounded-xl bg-gray-50 text-gray-700 flex items-center justify-center shrink-0 border border-gray-100">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Dashboard Broadcast Banner</h2>
              <p className="text-xs text-gray-400">Display a real-time announcement notice across all active moderator dashboards.</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-mono font-bold text-gray-700 uppercase tracking-wider">
              Announcement Message
            </label>
            <textarea 
              rows={2}
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
              className="w-full p-3.5 bg-gray-50 border border-gray-200/80 rounded-2xl text-sm font-medium text-gray-900 focus:outline-none focus:border-brand-red focus:bg-white transition-all resize-none"
            />
          </div>
        </div>

      </form>
    </div>
  );
}