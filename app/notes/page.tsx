import { NotesExplorer } from "@/components/notes/NotesExplorer";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 60; // Revalidate every minute

export default async function NotesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Fetch the entire approved library to pass down for client-side filtering
  const { data: notes, error } = await supabase
    .from("notes")
    .select("id, title, course_code")
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch notes library:", error);
  }

  return <NotesExplorer isLoggedIn={!!user} notes={notes || []} />;
}