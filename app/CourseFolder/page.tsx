import { SearchBar } from "@/components/ui/SearchBar";
import { NoteCard } from "@/components/ui/NoteCard";
// Note: You must ensure NoteCard is actually built, or this will throw an error.

export default function CourseFolderPage() {
  return (
    <div className="w-full min-h-[calc(100vh-80px)] overflow-hidden text-gray-900 px-6 py-12 lg:py-20">
      <div className="max-w-7xl mx-auto">
        
        <div className="mb-12">
          <SearchBar />
        </div>

        <div className="flex items-center gap-5 mt-10 mb-10">
          <div className="w-16 h-16 rounded-xl bg-brand-red/10 border border-brand-red/20 shrink-0 flex items-center justify-center text-brand-red font-bold text-xl">
            {/* Placeholder for Course Icon/Code */}
            C
          </div>
          <div>
            <h1 className="font-logo text-brand-red text-3xl font-bold tracking-tight mb-1">
              Course Name
            </h1>
            <p className="text-sm font-medium text-gray-500">
              6 documents available
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <NoteCard key={i} />
          ))}
        </div>
        
      </div>
    </div>
  );
}