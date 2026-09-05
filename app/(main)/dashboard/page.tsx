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

  const [{ data: notes, error }, { data: savedNotes, error: savedError }] = await Promise.all([
    supabase
      .from("notes")
      .select("id, title, status, hours_awarded, flag_reason")
      .eq("uploader_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("saved_notes")
      .select("id, note_id, notes(id, title, course_code)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  if (error) {
    console.error("Failed to fetch user's submissions:", error.message);
  }
  if (savedError) {
    console.error("Failed to fetch user's saved notes:", savedError.message);
  }

  return <DashboardView submissions={notes || []} savedNotes={savedNotes || []} />;
}