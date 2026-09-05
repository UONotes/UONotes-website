import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { CourseFolderView } from "@/components/notes/CourseFolderView";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createR2Client, R2_BUCKET_NAME } from "@/lib/r2";

export default async function CoursePage({ 
  params 
}: { 
  params: Promise<{ courseCode: string }> 
}) {
  const { courseCode } = await params;
  
  if (!courseCode) {
    notFound();
  }

  const supabase = await createClient();

  // Fetch notes matching this course code
   const { data: notes, error } = await supabase
    .from("notes")
    .select("*")
    .eq("course_code", courseCode.toUpperCase())
    .eq("status", "approved");

  if (error) {
    console.error("Failed to fetch notes for course:", courseCode, error.message);
  }

  const r2 = createR2Client();
  const notesWithUrls = await Promise.all(
    (notes || []).map(async (note) => ({
      ...note,
      fileUrl: await getSignedUrl(r2, new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: note.file_key }), { expiresIn: 3600 }),
    }))
  );

  return <CourseFolderView courseCode={courseCode} notes={notesWithUrls} />; 
}