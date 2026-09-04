"use server";

import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface SettingsPayload {
  maintenanceMode: boolean;
  autoFlagPlagiarism: boolean;
  maxFileSize: number;
  announcementText: string;
  allowPublicRegistrations: boolean;
}

export async function saveSettingsAction(payload: SettingsPayload) {
  const supabase = await createServerClient();
  const { data: { user: caller }, error: authError } = await supabase.auth.getUser();

  if (authError || !caller) {
    throw new Error("Unauthorized.");
  }

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("is_admin, is_super_admin")
    .eq("id", caller.id)
    .single();

  if (!callerProfile?.is_admin) {
    throw new Error("Insufficient privileges.");
  }

  const { data: currentSettings } = await supabaseAdmin
    .from("platform_settings")
    .select("maintenance_mode")
    .eq("id", 1)
    .single();

  const { data: currentRegSettings } = await supabaseAdmin
    .from("platform_settings")
    .select("allow_public_registrations")
    .eq("id", 1)
    .single();

  const isChangingMaintenanceMode =
    currentSettings && currentSettings.maintenance_mode !== payload.maintenanceMode;
  const isChangingRegistration =
    currentRegSettings && currentRegSettings.allow_public_registrations !== payload.allowPublicRegistrations;

  if ((isChangingMaintenanceMode || isChangingRegistration) && !callerProfile.is_super_admin) {
    throw new Error("Only Super Admins can change Maintenance Mode or Public Registration.");
  }
  const { error: updateError } = await supabaseAdmin
    .from("platform_settings")
    .update({
      maintenance_mode: payload.maintenanceMode,
      auto_flag_plagiarism: payload.autoFlagPlagiarism,
      max_file_size_mb: payload.maxFileSize,
      announcement_banner: payload.announcementText,
      allow_public_registrations: payload.allowPublicRegistrations,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (updateError) {
    console.error("Failed to update platform settings:", updateError);
    throw new Error("Failed to save settings.");
  }

  await supabaseAdmin.from("admin_audit_log").insert({
    admin_id: caller.id,
    target_type: "platform_settings",
    target_id: null,
    action_type: "UPDATE_PLATFORM_SETTINGS",
    details: {
      maintenance_mode: payload.maintenanceMode,
      max_file_size_mb: payload.maxFileSize,
      allow_public_registrations: payload.allowPublicRegistrations,
    },
  });

  return { success: true };
}