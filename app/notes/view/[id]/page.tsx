import type { Metadata } from "next";
import { NoteViewer } from "@/components/notes/NoteViewer";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  return {
    title: `View Note #${resolvedParams.id} | UONotes`,
    description: "Inspect student study materials and documents securely.",
  };
}

export default async function ViewNoteRoute({ params }: PageProps) {
  const resolvedParams = await params;
  return <NoteViewer noteId={resolvedParams.id} />;
}