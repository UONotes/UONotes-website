"use client";

import { useState } from "react";
import { saveSettingsAction } from "@/app/admin/settings/actions";
import { 
  Bell, 
  HardDrive, 
  Save, 
  Check, 
  Lock, 
  Loader2, 
  AlertTriangle,
} from "lucide-react";

interface InitialSettings {
  maintenanceMode: boolean;
  autoFlagPlagiarism: boolean;
  maxFileSize: string;
  announcementText: string;
  allowPublicRegistrations: boolean;
}

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onChange}
      className={`w-11 h-6 rounded-full transition-colors relative p-1 shrink-0 ${
        disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
      } ${checked ? "bg-brand-red" : "bg-gray-200"}`}
    >
      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save settings.";
      setErrorMessage(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">

      {savedToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-[#23201D] text-white px-4 py-3 rounded-xl shadow-xl animate-in slide-in-from-bottom-4 duration-300">
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Check className="w-3 h-3 stroke-[3]" />
          </div>
          <p className="text-xs font-medium">Settings saved.</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-logo text-3xl font-bold text-[#23201D] tracking-tight">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Platform-wide controls. Changes here affect everyone.
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#23201D] hover:bg-black text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50 cursor-pointer"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save changes
        </button>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-rose-700 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          <div className="lg:col-span-2 space-y-4">

            <div className="bg-white border border-black/5 rounded-2xl p-6 space-y-5">
              <h2 className="font-logo text-lg font-bold text-[#23201D]">Site availability</h2>

              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    Maintenance mode
                    {!isSuperAdmin && <span className="text-gray-300"><Lock className="w-3.5 h-3.5" /></span>}
                  </p>
                  <p className="text-xs text-gray-500 max-w-md mt-0.5">
                    Blocks new note submissions from students while it&apos;s on. Super admins only.
                  </p>
                </div>
                <Toggle checked={maintenanceMode} onChange={() => setMaintenanceMode(!maintenanceMode)} disabled={!isSuperAdmin} />
              </div>

              <div className="h-px bg-black/5" />

              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    Public registration
                    {!isSuperAdmin && <span className="text-gray-300"><Lock className="w-3.5 h-3.5" /></span>}
                  </p>
                  <p className="text-xs text-gray-500 max-w-md mt-0.5">
                    Let new students sign up. Super admins only.
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    Not enforced yet. signup isn&apos;t currently gated by this setting.
                  </p>
                </div>
                <Toggle checked={allowPublicRegistrations} onChange={() => setAllowPublicRegistrations(!allowPublicRegistrations)} disabled={!isSuperAdmin} />
              </div>

              <div className="h-px bg-black/5" />

              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Automatic plagiarism flagging</p>
                  <p className="text-xs text-gray-500 max-w-md mt-0.5">
                    Route submissions with high text overlap straight to the flagged queue.
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    Not built yet. there&apos;s no plagiarism detection system behind this toggle atm.
                  </p>
                </div>
                <Toggle checked={autoFlagPlagiarism} onChange={() => setAutoFlagPlagiarism(!autoFlagPlagiarism)} />
              </div>
            </div>

            <div className="bg-white border border-black/5 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-logo text-lg font-bold text-[#23201D]">Announcement</h2>
                  <p className="text-xs text-gray-400">Shows on the admin overview page for other reviewers.</p>
                </div>
              </div>

              <textarea 
                rows={2}
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                placeholder="A short note for other admins…"
                className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-gray-400 focus:bg-white transition-all resize-none placeholder:text-gray-400"
              />
            </div>

          </div>

          <div className="space-y-4">
            <div className="bg-white border border-black/5 rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <HardDrive className="w-4 h-4" />
                </div>
                <h2 className="font-logo text-lg font-bold text-[#23201D]">Max file size</h2>
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="number"
                  value={maxFileSize}
                  onChange={(e) => setMaxFileSize(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:border-gray-400 focus:bg-white transition-all"
                />
                <span className="text-sm text-gray-400 shrink-0">MB</span>
              </div>
              <p className="text-xs text-amber-600">
                Not enforced yet. uploads are currently capped at a fixed 25MB regardless of this value.
              </p>
            </div>
          </div>

        </div>
      </form>
    </div>
  );
}