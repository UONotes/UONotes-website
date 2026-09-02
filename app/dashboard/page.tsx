import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardView } from "@/components/dashboard/DashboardView";

export const metadata: Metadata = {
  title: "Dashboard | UONotes",
  description: "View your note submissions, earned volunteer hours, and feedback.",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/signin");

  const { data: notes, error } = await supabase
    .from("notes")
    .select("id, title, status, hours_awarded, flag_reason")
    .eq("uploader_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch user's submissions:", error.message);
  }

  return <DashboardView submissions={notes || []} />;
}