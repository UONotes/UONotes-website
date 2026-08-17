import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SearchBar } from "@/components/ui/SearchBar";
import { NoteCard } from "@/components/ui/NoteCard";

export default function CourseFolderPage() {
  return (
    <>
      <Navbar />
      <main>
        <section className="bg-brand-pink px-6 py-12">
          <div className="max-w-site mx-auto">
            <SearchBar />

            <div className="flex items-center gap-4 mt-10 mb-8">
              <div className="w-16 h-16 rounded-lg bg-[#D9A79E] shrink-0" />
              <div>
                <h1 className="font-logo text-brand-red text-2xl font-bold tracking-tight">Course name</h1>
                <p className="text-sm text-brand-muted">x documents</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <NoteCard key={i} />
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
