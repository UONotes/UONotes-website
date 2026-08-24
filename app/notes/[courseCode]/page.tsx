import type { Metadata } from "next";
import { CourseFolderView } from "@/components/notes/CourseFolderView";

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

  return <CourseFolderView courseCode={courseCode} />;
}