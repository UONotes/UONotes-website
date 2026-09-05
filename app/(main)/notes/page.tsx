import { NotesExplorer } from "@/components/notes/NotesExplorer";
import { createClient } from "@/lib/supabase/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createR2Client, R2_BUCKET_NAME } from "@/lib/r2";

export const revalidate = 60; // Revalidate every minute

export default async function NotesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Fetch the entire approved library to pass down for client-side filtering
    const { data: notes, error } = await supabase
    .from("notes")
    .select("id, title, course_code, file_key")
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch notes library:", error);
  }

  const r2 = createR2Client();
  const notesWithUrls = await Promise.all(
    (notes || []).map(async (note) => ({
      ...note,
      fileUrl: await getSignedUrl(r2, new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: note.file_key }), { expiresIn: 3600 }),
    }))
  );

  return <NotesExplorer isLoggedIn={!!user} notes={notesWithUrls} />; }