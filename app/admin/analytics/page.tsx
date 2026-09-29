import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseRange } from "@/lib/analytics";
import { getAnalytics, isSuperAdmin } from "@/lib/analytics-loader";
import { AnalyticsDashboard } from "@/components/admin/analytics/AnalyticsDashboard";

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  // Real guard, not just a hidden nav link — anyone who lands here
  // directly still gets bounced if they aren't a super admin.
  if (!(await isSuperAdmin(supabase, user.id))) redirect("/admin");

  const data = await getAnalytics(parseRange((await searchParams).range));
  return <AnalyticsDashboard initialData={data} />;
}
