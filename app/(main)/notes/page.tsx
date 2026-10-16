import { NotesExplorer } from "@/components/notes/NotesExplorer";
import { createClient } from "@/lib/supabase/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createR2Client, R2_BUCKET_NAME } from "@/lib/r2";

export const revalidate = 60; // Revalidate every minute

type NotesPageProps = {
  searchParams: Promise<{ faculty?: string | string[]; q?: string | string[] }>;
};

export default async function NotesPage({ searchParams }: NotesPageProps) {
  const params = await searchParams;
  // ?faculty=Engineering&q=csi opens the library on that tab/search (the explorer keeps these in the URL)
  const initialFaculty = typeof params.faculty === "string" ? params.faculty : undefined;
  const initialQuery = typeof params.q === "string" ? params.q : undefined;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Fetch the entire approved library to pass down for client-side filtering
  const { data: notes, error } = await supabase
    .from("notes")
    .select("id, title, course_code, file_key, author_name, created_at")
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

  return <NotesExplorer isLoggedIn={!!user} notes={notesWithUrls} initialFaculty={initialFaculty} initialQuery={initialQuery} />;
}