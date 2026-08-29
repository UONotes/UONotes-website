import type { Metadata } from "next";
import { DeleteAccountSection } from "@/components/Settings/DeleteAccountSection";

export const metadata: Metadata = {
  title: "Settings | UONotes",
  description: "Manage your UONotes account settings.",
};

export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="font-logo text-3xl font-bold text-brand-red mb-8">Settings</h1>
      <DeleteAccountSection />
    </div>
  );
}