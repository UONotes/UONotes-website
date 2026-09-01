import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { CourseFolderView } from "@/components/notes/CourseFolderView";

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
    .eq("course_code", courseCode.toUpperCase());

  if (error) {
    console.error("Failed to fetch notes for course:", courseCode, error.message);
  }

  return <CourseFolderView courseCode={courseCode} notes={notes || []} />;
}