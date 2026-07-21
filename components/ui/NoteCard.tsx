import Image from "next/image";
import { EyeIcon, BookmarkIcon } from "../icons";

type NoteCardProps = {
  title?: string;
  course?: string;
  thumb?: string;
};

export function NoteCard({ title = "Note title", course = "Course title and code", thumb }: NoteCardProps) {
  return (
    <div className="note-card">
      {/* ... your existing NoteCard code ... */}
    </div>
  );
}