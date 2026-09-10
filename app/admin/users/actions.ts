"use server";

import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { formatMonthYear } from "@/lib/dateFormat";

// Initialize the Admin client. This BYPASSES RLS. 
// It must never be exposed to the browser.
const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PAGE_SIZE = 20;

export async function fetchMoreUsersAction(
  page: number,
  query: string,
  roleFilter: string
) {
  const supabase = await createServerClient();
  const { data: { user: caller } } = await supabase.auth.getUser();
  if (!caller) throw new Error("Unauthorized");

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", caller.id)
    .single();
  if (!callerProfile?.is_admin) throw new Error("Insufficient privileges.");

   let dbQuery = supabase
    .from("profiles")
    .select("id, full_name, email, is_admin, is_super_admin, status, created_at, notes!notes_uploader_id_fkey(count)", { count: "exact" });

  if (query) {
    dbQuery = dbQuery.or(`full_name.ilike.%${query}%,email.ilike.%${query}%`);
  }

  if (roleFilter === "SUPER_ADMIN") {
    dbQuery = dbQuery.eq("is_super_admin", true);
  } else if (roleFilter === "ADMIN") {
    dbQuery = dbQuery.eq("is_admin", true).eq("is_super_admin", false);
  } else if (roleFilter === "STUDENT") {
    dbQuery = dbQuery.eq("is_admin", false);
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { data: usersData, error } = await dbQuery
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error("Failed to load more users.");
  }

  return (usersData || []).map((user: any) => ({
    id: user.id,
    name: user.full_name || "Unknown",
    email: user.email,
    role: (user.is_super_admin ? "SUPER_ADMIN" : user.is_admin ? "ADMIN" : "STUDENT") as "SUPER_ADMIN" | "ADMIN" | "STUDENT",    status: user.status || "ACTIVE",
    joinedAt: formatMonthYear(user.created_at),
    submissionCount: user.notes?.[0]?.count || 0,
  }));
}


export async function banUserAction(
  targetUserId: string,
  reasons: string[],
  customNote: string
) {
  // 1. Verify Caller Identity & Authorization (Never trust the client)
  const supabase = await createServerClient();
  const { data: { user: caller }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !caller) {
    throw new Error("Unauthorized execution attempt.");
  }

  // 2. Explicitly check if the caller is an admin
  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("is_admin, is_super_admin")
    .eq("id", caller.id)
    .single();

  if (!callerProfile?.is_admin) {
    throw new Error("Insufficient privileges to execute a platform ban.");
  }

  // 2b. Real, server-side protection for who can ban whom — this is
  // the actual security boundary; any "Protected" label in the UI is
  // just a courtesy, this check is what actually matters.
  if (targetUserId === caller.id) {
    throw new Error("You cannot ban your own account.");
  }

  const { data: targetProfile } = await supabaseAdmin
    .from("profiles")
    .select("is_admin, is_super_admin")
    .eq("id", targetUserId)
    .single();

  if (targetProfile?.is_super_admin) {
    throw new Error("Super Admins cannot be banned.");
  }
  if (targetProfile?.is_admin && !callerProfile.is_super_admin) {
    throw new Error("Only a Super Admin can ban an Admin.");
  }

  // 3. The Hard Ban: Suspend the user at the Identity Provider level
  const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(
    targetUserId,
    { ban_duration: "87600h" } 
  );

  if (banError) {
    if (banError.message.includes("User not found")) {
      console.warn(`[WARNING] Auth API could not find user ${targetUserId}. Proceeding with application-level ban.`);
    } else {
      console.error("Auth ban failed:", banError);
      throw new Error(`Auth ban failed: ${banError.message}`);
    }
  }

  // 4. Application State Update & Audit Logging (Run concurrently)
  const [profileUpdate, auditLog] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .update({ status: "BANNED" })
      .eq("id", targetUserId),
      
    supabaseAdmin
      .from("admin_audit_log")
      .insert({
        admin_id: caller.id,
        target_type: "user",
        target_id: targetUserId,
        action_type: "BAN",
        details: { reasons, custom_note: customNote },
      })
  ]);

  if (profileUpdate.error || auditLog.error) {
    console.error("Database state failure:", { profileUpdate, auditLog });
    throw new Error("Database state update failed after Auth ban.");
  }

  // 5. Invalidate the Next.js cache so the UI updates instantly
  revalidatePath("/admin/users");
  
  return { success: true };
}

export async function unbanUserAction(
  targetUserId: string,
  reasons: string[],
  customNote: string
) {
  // 1. Verify Caller Identity & Authorization
  const supabase = await createServerClient();
  const { data: { user: caller }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !caller) {
    throw new Error("Unauthorized execution attempt.");
  }

  // 2. Explicitly check if the caller is an admin
  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", caller.id)
    .single();

  if (!callerProfile?.is_admin) {
    throw new Error("Insufficient privileges to execute a platform unban.");
  }

  // 3. Lift the suspension at the Identity Provider level
  const { error: unbanError } = await supabaseAdmin.auth.admin.updateUserById(
    targetUserId,
    { ban_duration: "none" } 
  );

  if (unbanError) {
    if (unbanError.message.includes("User not found")) {
      console.warn(`[WARNING] Auth API could not find user ${targetUserId}. Proceeding with application-level unban.`);
    } else {
      console.error("Auth unban failed:", unbanError);
      throw new Error(`Auth unban failed: ${unbanError.message}`);
    }
  }

  // 4. Application State Update & Audit Logging (Run concurrently)
  const [profileUpdate, auditLog] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .update({ status: "ACTIVE" })
      .eq("id", targetUserId),
      
    supabaseAdmin
      .from("admin_audit_log")
      .insert({
        admin_id: caller.id,
        target_type: "user",
        target_id: targetUserId,
        action_type: "UNBAN",
        details: { reasons, custom_note: customNote },
      })
  ]);

  if (profileUpdate.error || auditLog.error) {
    console.error("Database state failure:", { profileUpdate, auditLog });
    throw new Error("Database state update failed after Auth unban.");
  }

  // 5. Invalidate the Next.js cache so the UI updates instantly
  revalidatePath("/admin/users");
  
  return { success: true };
}