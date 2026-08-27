import type { Metadata } from "next";
import { NotesExplorer } from "@/components/notes/NotesExplorer";

export const metadata: Metadata = {
  title: "Explore Notes | UONotes",
  description: "Browse academic notes and resources from uOttawa students.",
};

export default function NotesPage() {
  return (
    <div className="w-full min-h-[calc(100vh-80px)] text-gray-900">
      <NotesExplorer />
    </div>
  );
}