import Image from "next/image";
import { EyeIcon, BookmarkIcon } from "../icons";

export function NoteCard({ title = "Note title", course = "Course title and code", thumb, saved = false }: { title?: string; course?: string; thumb?: string; saved?: boolean; }) {
  return (
    <div className="custom-card">
      <div className="relative h-[120px] bg-brand-surface">
        <Image src={thumb || "/images/placeholder.png"} alt={title} fill sizes="(max-width: 768px) 100vw, 25vw" className="object-cover" />
      </div>
      <div className="p-3 pb-3.5">
        <p className="text-[0.85rem] font-semibold text-brand-dark mb-0.5">{title}</p>
        <p className="text-xs text-brand-muted mb-2">{course}</p>
        <div className="flex gap-1.5">
          <button className="btn-tag"><EyeIcon /> View PDF</button>
          <button className="btn-tag"><BookmarkIcon /> {saved ? "Saved" : "Save"}</button>
        </div>
      </div>
    </div>
  );
}