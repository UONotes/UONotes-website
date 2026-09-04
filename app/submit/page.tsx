import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SubmitFormView } from "@/components/submit/SubmitFormView";
import { Wrench } from "lucide-react";

export const metadata: Metadata = {
  title: "Submit Notes | UONotes",
  description: "Upload your study notes, help fellow students, and earn volunteer hours.",
};

export default async function SubmitPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/signin");

  const admin = createAdminClient();
  const [{ data: profile }, { data: settings }] = await Promise.all([
    supabase.from("profiles").select("is_admin").eq("id", user.id).single(),
    admin.from("platform_settings").select("maintenance_mode").eq("id", 1).single(),
  ]);

  const isMaintenanceMode = settings?.maintenance_mode ?? false;
  const isAdmin = profile?.is_admin ?? false;

  if (isMaintenanceMode && !isAdmin) {
    return (
      <div className="w-full min-h-[calc(100vh-80px)] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-xl border border-amber-200 text-center flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mb-5">
            <Wrench className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-2">
            Submissions Paused
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            We're doing some maintenance behind the scenes. Note submissions are
            temporarily paused — please check back a little later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {isMaintenanceMode && isAdmin && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-800 text-xs font-mono font-bold text-center py-2 px-4">
          Maintenance Mode is ON for students — you can still submit as an admin.
        </div>
      )}
      <SubmitFormView />
    </>
  );
}