import Image from "next/image";
import Link from "next/link";
import { NoteCard } from "../ui/NoteCard";

export function FeaturedNotes() {
  const notes = Array(4).fill({ title: "Note title", course: "Course title and code" });

  return (
    <section className="section-wrapper">
      <div className="flex items-center justify-center gap-2.5 mb-8">
        <Image src="/images/Notebook.png" alt="" width={28} height={28} className="w-auto h-auto" />
        <h2 className="font-logo text-brand-red text-[clamp(1.75rem,3vw,2.5rem)] font-semibold tracking-tight mb-0">Featured notes</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
        {notes.map((n, i) => <NoteCard key={i} title={n.title} course={n.course} />)}
      </div>
      <div className="flex justify-center mt-8">
        <Link href="/notes" className="btn-primary">View all notes</Link>
      </div>
    </section>
  );
}