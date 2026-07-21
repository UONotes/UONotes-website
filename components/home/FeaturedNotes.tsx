import Image from "next/image";
import Link from "next/link";
import { NoteCard } from "../ui/NoteCard";

export function FeaturedNotes() {
  const notes = [
    { title: "Note title", course: "Course title and code" },
    // ...
  ];

  return (
    <section className="section featured-notes">
      {/* ... your existing FeaturedNotes code referencing <NoteCard /> ... */}
    </section>
  );
}