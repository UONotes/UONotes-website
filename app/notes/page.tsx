import type { ReactNode } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SearchBar } from "@/components/ui/SearchBar";
import { NoteCard } from "@/components/ui/NoteCard";
import { CourseCard } from "@/components/ui/CourseCard";
import { BookmarkIcon, EyeIcon, StarIcon, BookOpenIcon } from "@/components/icons";

function NotesSection({ icon, title, subtitle, children }: { icon: ReactNode; title: string; subtitle?: string; children: ReactNode; }) {
  return (
    <div className="mt-12">
      <div className="flex items-center gap-2.5">
        {icon}
        <h2 className="font-logo text-brand-red text-xl font-bold tracking-tight">{title}</h2>
      </div>
      {subtitle && <p className="text-sm text-brand-body mt-1">{subtitle}</p>}
      <div className="mt-5">{children}</div>
    </div>
  );
}

export default function NotesPage() {
  return (
    <>
      <Navbar />
      <main>
        <section className="bg-brand-pink px-6 py-12">
          <div className="max-w-site mx-auto">
            <SearchBar />

            <NotesSection icon={<BookmarkIcon size={20} color="#8F0018" />} title="Saved Notes">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <NoteCard key={i} saved />
                ))}
              </div>
            </NotesSection>

            <NotesSection icon={<EyeIcon size={20} color="#8F0018" />} title="Recently Viewed" subtitle="Need to check something again?">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <NoteCard key={i} />
                ))}
              </div>
            </NotesSection>

            <NotesSection icon={<StarIcon size={20} />} title="Featured Notes" subtitle="The best, most frequently used notes among our users.">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <NoteCard key={i} />
                ))}
              </div>
            </NotesSection>

            <NotesSection icon={<BookOpenIcon size={20} />} title="Courses" subtitle="Look for notes from a specific course.">
              <div className="flex flex-wrap gap-5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="w-full sm:w-[240px]">
                    <CourseCard />
                  </div>
                ))}
              </div>
            </NotesSection>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
