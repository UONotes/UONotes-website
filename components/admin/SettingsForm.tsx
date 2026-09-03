"use client";

import { useState } from "react";
import { saveSettingsAction } from "@/app/admin/settings/actions";
import { 
  Sliders, 
  Bell, 
  HardDrive, 
  Save, 
  Check, 
  Lock, 
  Loader2, 
  AlertTriangle, 
  Cpu,
  Shield,
} from "lucide-react";

interface InitialSettings {
  maintenanceMode: boolean;
  autoFlagPlagiarism: boolean;
  maxFileSize: string;
  announcementText: string;
  allowPublicRegistrations: boolean;
}

export function SettingsForm({
  isSuperAdmin,
  initialSettings,
}: {
  isSuperAdmin: boolean;
  initialSettings: InitialSettings;
}) {
  const [saving, setSaving] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [maintenanceMode, setMaintenanceMode] = useState(initialSettings.maintenanceMode);
  const [autoFlagPlagiarism, setAutoFlagPlagiarism] = useState(initialSettings.autoFlagPlagiarism);
  const [maxFileSize, setMaxFileSize] = useState(initialSettings.maxFileSize);
  const [announcementText, setAnnouncementText] = useState(initialSettings.announcementText);
  const [allowPublicRegistrations, setAllowPublicRegistrations] = useState(initialSettings.allowPublicRegistrations);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSaving(true);

    try {
      await saveSettingsAction({
        maintenanceMode,
        autoFlagPlagiarism,
        maxFileSize: parseInt(maxFileSize) || 25,
        announcementText,
        allowPublicRegistrations,
      });

      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 3500);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-10 px-4 sm:px-6 space-y-8 animate-in fade-in duration-500 relative">
      
      {savedToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-gray-900 text-white px-5 py-3.5 rounded-2xl shadow-xl border border-gray-800 animate-in slide-in-from-bottom-4 duration-300">
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Check className="w-3 h-3 stroke-[3]" />
          </div>
          <p className="text-xs font-semibold tracking-tight">System configuration committed & audit logged.</p>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-[10px] font-mono font-bold uppercase tracking-wider">
              <Cpu className="w-3 h-3 text-gray-500" /> Global Environment
            </span>
            {!isSuperAdmin && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-[10px] font-mono font-bold">
                <Lock className="w-3 h-3" /> Standard Admin Restrictions Active
              </span>
            )}
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Platform Settings</h1>
          <p className="text-xs text-gray-500 mt-1 max-w-xl">
            Configure feature availability flags, storage thresholds, and live dashboard broadcasts with audit trails.
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-2xl transition-all shadow-md shadow-gray-900/10 disabled:opacity-50 cursor-pointer"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save & Audit Log
        </button>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-700 text-xs font-medium">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-white border border-gray-100 rounded-3xl p-7 shadow-xs space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100/60">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Operational Toggles</h2>
                  <p className="text-xs text-gray-400">Manage global site availability and automated moderation workflows.</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      Emergency Maintenance Mode
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-50 text-rose-600 border border-rose-100">SUPER ADMIN ONLY</span>
                    </p>
                    <p className="text-xs text-gray-500 max-w-md mt-0.5">
                      Restricts student uploads during major migrations. Restricted to super-admins.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={!isSuperAdmin}
                    onClick={() => setMaintenanceMode(!maintenanceMode)}
                    className={`w-12 h-6 rounded-full transition-colors relative p-1 shrink-0 ${
                      !isSuperAdmin ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                    } ${maintenanceMode ? "bg-rose-600" : "bg-gray-200"}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${maintenanceMode ? "translate-x-6" : "translate-x-0"}`} />
                  </button>
                </div>

                <div className="h-px bg-gray-50" />

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-gray-900">Automated Plagiarism Pre-Screening</p>
                    <p className="text-xs text-gray-500 max-w-md mt-0.5">
                      Automatically route PDFs with high text matches straight to the flagged compliance queue.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoFlagPlagiarism(!autoFlagPlagiarism)}
                    className={`w-12 h-6 rounded-full transition-colors relative p-1 shrink-0 cursor-pointer ${
                      autoFlagPlagiarism ? "bg-gray-900" : "bg-gray-200"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${autoFlagPlagiarism ? "translate-x-6" : "translate-x-0"}`} />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-3xl p-7 shadow-xs space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100/60">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Command Center Broadcast Banner</h2>
                  <p className="text-xs text-gray-400">Display an announcement notice across all active moderator dashboards.</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-mono font-bold text-gray-700 uppercase tracking-wider">
                  Active Notice Text
                </label>
                <textarea 
                  rows={2}
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  placeholder="Enter broadcast message here..."
                  className="w-full p-4 bg-gray-50 border border-gray-200/80 rounded-2xl text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-red/10 focus:border-brand-red focus:bg-white transition-all resize-none"
                />
              </div>
            </div>

          </div>

          <div className="space-y-6">
            <div className="bg-white border border-gray-100 rounded-3xl p-7 shadow-xs space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100/60">
                  <HardDrive className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Storage Limit</h2>
                  <p className="text-xs text-gray-400">Upload constraints.</p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-mono font-bold text-gray-700 uppercase tracking-wider">
                  Max File Size (MB)
                </label>
                <input 
                  type="number"
                  value={maxFileSize}
                  onChange={(e) => setMaxFileSize(e.target.value)}
                  className="w-full p-3.5 bg-gray-50 border border-gray-200/80 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-900 to-gray-950 text-white rounded-3xl p-7 shadow-xl space-y-4 border border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 text-white flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Audit Trail Protection</h3>
                  <p className="text-[11px] text-gray-400 font-mono">Immutable Logging Active</p>
                </div>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                All changes to settings record your admin credentials to the audit log table.
              </p>
            </div>
          </div>

        </div>
      </form>
    </div>
  );
}