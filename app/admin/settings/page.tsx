import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/admin/SettingsForm";

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/signin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, is_super_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/");

  const { data: settings } = await supabase
    .from("platform_settings")
    .select("*")
    .eq("id", 1)
    .single();

  return (
    <SettingsForm
      isSuperAdmin={profile.is_super_admin ?? false}
      initialSettings={{
        maintenanceMode: settings?.maintenance_mode ?? false,
        autoFlagPlagiarism: settings?.auto_flag_plagiarism ?? true,
        maxFileSize: String(settings?.max_file_size_mb ?? 25),
        announcementText: settings?.announcement_banner ?? "",
        allowPublicRegistrations: settings?.allow_public_registrations ?? true,
      }}
    />
  );
}