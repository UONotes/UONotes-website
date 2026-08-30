import { createClient } from "@/lib/supabase/server";
import { NotesExplorer } from "@/components/notes/NotesExplorer";

export default async function NotesPage() {
  const supabase = await createClient();
  
  // Extract the user session on the server
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main>
      {/* Pass the boolean state into the component! */}
      <NotesExplorer isLoggedIn={!!user} />
    </main>
  );
}