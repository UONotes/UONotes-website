import type { Metadata } from "next";
import { CourseFolderView } from "@/components/notes/CourseFolderView";
import { createClient } from "@/lib/supabase/server";

interface PageProps {
  params: Promise<{ courseCode: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const courseCode = resolvedParams.courseCode.toUpperCase();
  return {
    title: `${courseCode} Notes | UONotes`,
    description: `Browse verified student notes and study guides for ${courseCode}.`,
  };
}

export default async function CourseFolderPage({ params }: PageProps) {
  const resolvedParams = await params;
  const courseCode = resolvedParams.courseCode.toUpperCase();
  
  const supabase = await createClient();

  // Fetch all approved notes for this specific course
  const { data: notes, error } = await supabase
    .from("notes")
    .select("id, title, course_code, created_at, file_key")
    .eq("course_code", courseCode)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(`Failed to fetch notes for ${courseCode}:`, error);
  }

  // NOTE: You will need to update CourseFolderView to accept the `notes` prop, 
  // just like we do with NotesExplorer below.
  return <CourseFolderView courseCode={courseCode} notes={notes || []} />;
}