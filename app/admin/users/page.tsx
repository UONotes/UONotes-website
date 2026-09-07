import { createClient } from "@/lib/supabase/server";
import { UserSearchControls } from "@/components/admin/users/UserSearchControls";
import { UserListTable } from "@/components/admin/users/UserListTable";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; page?: string }>;
}) {
   const supabase = await createClient();
  
  // UNWRAP THE PROMISE (Required in Next.js latest versions)
  const resolvedParams = await searchParams;

  const { data: { user: caller } } = await supabase.auth.getUser();
  const { data: callerProfile } = caller
    ? await supabase.from("profiles").select("is_super_admin").eq("id", caller.id).single()
    : { data: null };
  const viewerIsSuperAdmin = callerProfile?.is_super_admin ?? false;
  
  const query = resolvedParams.q?.trim() || "";
  const roleFilter = resolvedParams.role || "ALL";
  const currentPage = parseInt(resolvedParams.page || "1", 10);
  const PAGE_SIZE = 20;

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

  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { data: usersData, count: totalUsers, error } = await dbQuery
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Supabase Database Error (Users):", JSON.stringify(error, null, 2));
  }

  const formattedUsers = (usersData || []).map((user: any) => ({
    id: user.id,
    name: user.full_name || "Unknown",
    email: user.email,
    // THE FIX: Explicitly cast the string to the expected union type to satisfy strict Next.js builds
    role: (user.is_super_admin ? "SUPER_ADMIN" : user.is_admin ? "ADMIN" : "STUDENT") as "SUPER_ADMIN" | "ADMIN" | "STUDENT",
    status: user.status || "ACTIVE",
    joinedAt: new Date(user.created_at).toLocaleDateString("en-US", { month: 'short', year: 'numeric' }),
    submissionCount: user.notes?.[0]?.count || 0,
  }));

  return (
    <div className="w-full flex flex-col gap-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Directory</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage platform users, roles, and access. ({totalUsers || 0} total)
          </p>
        </div>
      </div>

      <UserSearchControls initialQuery={query} initialRole={roleFilter} />

        <UserListTable users={formattedUsers} totalUsers={totalUsers || 0} query={query} roleFilter={roleFilter} viewerIsSuperAdmin={viewerIsSuperAdmin} viewerId={caller?.id} />
    </div>
  );
}