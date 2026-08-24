import { FolderIcon } from "../icons";

export function CourseCard({ code = "Course code", count = "# documents" }: { code?: string; count?: string }) {
  return (
    <div className="custom-card flex items-center gap-4 p-4">
      <FolderIcon size={40} />
      <div>
        <p className="text-sm font-bold text-brand-dark">{code}</p>
        <p className="text-xs text-brand-muted">{count}</p>
      </div>
    </div>
  );
}
