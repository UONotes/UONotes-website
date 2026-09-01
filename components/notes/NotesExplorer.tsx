"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { SearchBar } from "@/components/ui/SearchBar";
import { NoteCard } from "@/components/ui/NoteCard";
import { Folder, UploadCloud, Library, Compass, Lock, ChevronRight } from "lucide-react";

const notebookStyle = {
  backgroundImage: `
    linear-gradient(90deg, transparent 64px, rgba(168, 49, 66, 0.15) 64px, rgba(168, 49, 66, 0.15) 66px, transparent 66px),
    linear-gradient(transparent 31px, #e5e7eb 32px)
  `,
  backgroundSize: "100% 100%, 100% 32px",
};

const hideScrollbar = "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]";
const FACULTIES = ["All Faculties", "Engineering", "Science", "Arts", "Telfer", "Health Sciences"];

// Define the shape of your real database record
export interface DatabaseNote {
  id: string;
  title: string;
  course_code: string;
}

interface NotesExplorerProps {
  isLoggedIn?: boolean;
  notes: DatabaseNote[];
}

export function NotesExplorer({ isLoggedIn = false, notes = [] }: NotesExplorerProps) {
  const [activeFaculty, setActiveFaculty] = useState("All Faculties");
  const [searchQuery, setSearchQuery] = useState("");

  // 1. Dynamically calculate the top 3 courses (folders) based on real note counts
  const topFolders = useMemo(() => {
    const counts = notes.reduce((acc, note) => {
      acc[note.course_code] = (acc[note.course_code] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1]) // Sort by count descending
      .slice(0, 3); // Take top 3
  }, [notes]);

  // 2. Filter notes based on active faculty and search query
  // Note: Since your DB doesn't have a "faculty" column yet, we simulate it here by searching course prefixes.
  const filteredNotes = useMemo(() => {
    let filtered = notes;

    if (searchQuery.trim() !== "") {
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        n.course_code.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (activeFaculty !== "All Faculties") {
      // Example basic mapping (Expand this logic based on uOttawa prefixes)
      const prefixes = 
        activeFaculty === "Engineering" ? ["CSI", "SEG", "CEG", "ELG", "MCG"] :
        activeFaculty === "Science" ? ["MAT", "CHM", "PHY", "BIO"] :
        activeFaculty === "Arts" ? ["ENG", "HIS", "PHI"] :
        activeFaculty === "Telfer" ? ["ADM"] :
        activeFaculty === "Health Sciences" ? ["HSS", "BPS", "NSG"] : [];

      filtered = filtered.filter(n => prefixes.some(p => n.course_code.startsWith(p)));
    }

    return filtered;
  }, [notes, activeFaculty, searchQuery]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="w-full min-h-[calc(100vh-60px)] py-4 sm:py-8 px-3 sm:px-6 lg:px-12 flex flex-col items-center overflow-hidden"
    >
      <div className="w-full max-w-[1600px] mx-auto">
        <div 
          className="w-full bg-white p-3 sm:p-10 lg:p-12 rounded-2xl sm:rounded-[2rem] shadow-xl border border-brand-red/15 relative overflow-hidden"
          style={notebookStyle}
        >
          <div className="absolute top-0 bottom-0 left-6 sm:left-16 lg:left-20 w-[2px] bg-[#a83142]/25 pointer-events-none z-0" />
          <div className="absolute top-0 left-0 bottom-0 w-4 sm:w-12 lg:w-16 bg-gradient-to-r from-black/[0.04] to-transparent pointer-events-none z-10" />

          <div className="relative z-20 pl-6 sm:pl-10 lg:pl-16 flex flex-col lg:flex-row gap-6 lg:gap-10 w-full">

            <main className="flex-1 min-w-0 flex flex-col gap-5 sm:gap-6 order-1 lg:order-2">
              
              <div className="bg-white/95 backdrop-blur-sm p-5 sm:p-10 rounded-[1.25rem] sm:rounded-3xl border border-brand-red/15 shadow-sm relative overflow-hidden flex flex-col justify-center">
                <div className="absolute top-0 right-0 w-48 h-48 sm:w-96 sm:h-96 bg-brand-red/5 rounded-full blur-2xl sm:blur-3xl -mr-16 -mt-16 sm:-mr-32 sm:-mt-32 pointer-events-none" />
                
                <div className="relative z-10 w-full max-w-3xl">
                  <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 mb-3 sm:mb-4 rounded-md bg-brand-red/10 border border-brand-red/20 text-brand-red text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-widest">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-red opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand-red"></span>
                    </span>
                    UONotes App Beta
                  </div>

                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 tracking-tight font-sans mb-2">
                    Search Course Resources
                  </h1>
                  <p className="text-xs sm:text-sm lg:text-base text-gray-600 mb-5 sm:mb-8 max-w-xl leading-relaxed">
                    Instantly access verified study guides, lecture notes, and cheat sheets for your classes.
                  </p>

                  <div className="w-full shadow-lg shadow-gray-200/50 rounded-xl sm:rounded-2xl bg-white">
                    <SearchBar 
                      placeholder="Search code (e.g. CSI2110)..." 
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Mobile UI block omitted for brevity, logic remains identical */}
              <div className="flex flex-col gap-5 lg:hidden">
                <div className={`flex items-center gap-2 overflow-x-auto snap-x snap-mandatory pb-2 -mx-2 px-2 sm:mx-0 sm:px-0 ${hideScrollbar}`}>
                  {FACULTIES.map((faculty) => (
                    <button
                      key={faculty}
                      onClick={() => setActiveFaculty(faculty)}
                      className={`snap-start whitespace-nowrap px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 border ${
                        activeFaculty === faculty 
                          ? "bg-brand-red text-white border-brand-red shadow-sm" 
                          : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {faculty}
                    </button>
                  ))}
                  <div className="w-2 shrink-0 sm:hidden" />
                </div>

                {isLoggedIn ? (
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <Library className="w-4 h-4 text-brand-red" /> My Workspace
                      </h3>
                      <Link href="/dashboard" className="text-[10px] font-mono font-bold text-brand-red uppercase">
                        Manage
                      </Link>
                    </div>
                    
                    <div className={`flex items-stretch gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-2 px-2 sm:mx-0 sm:px-0 ${hideScrollbar}`}>
                      <Link 
                        href="/submit" 
                        className="snap-start shrink-0 w-[110px] flex flex-col items-center justify-center gap-2 bg-brand-red/5 border-2 border-dashed border-brand-red/30 rounded-xl p-3 text-brand-red hover:bg-brand-red/10 transition-colors"
                      >
                        <UploadCloud className="w-5 h-5" />
                        <span className="text-[9px] font-mono font-bold uppercase text-center">Upload Note</span>
                      </Link>
                      {topFolders.map(([code, count]) => (
                        <MobileFolderCard key={code} courseCode={code} count={count} />
                      ))}
                      <div className="w-2 shrink-0 sm:hidden" />
                    </div>
                  </div>
                ) : (
                  <div className="bg-brand-red/5 border border-brand-red/15 rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-sm">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-900">Unlock Library</span>
                      <span className="text-[10px] sm:text-xs text-gray-500 line-clamp-1">Save folders and upload.</span>
                    </div>
                    <Link href="/signin" className="shrink-0 px-4 py-2.5 bg-brand-red text-white text-[10px] font-mono font-bold uppercase rounded-lg shadow-sm">
                      Log In
                    </Link>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-1 px-1 sm:px-2 bg-white/60 backdrop-blur-sm py-1.5 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-brand-red animate-pulse" />
                  <h2 className="text-sm sm:text-lg font-bold text-gray-900 font-sans tracking-tight">
                    {activeFaculty === "All Faculties" ? "Recent Uploads" : `${activeFaculty} Documents`}
                  </h2>
                </div>
                <span className="text-[9px] sm:text-[10px] font-mono text-gray-500 bg-white border border-gray-200 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-xs uppercase tracking-wider font-bold">
                  {filteredNotes.length} results
                </span>
              </div>

              {/* REAL DATA MAPPING */}
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                transition={{ duration: 0.4 }}
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 pb-8"
              >
                {filteredNotes.length > 0 ? (
                  filteredNotes.map((note) => (
                    <div key={note.id} className="bg-white rounded-xl shadow-sm border border-brand-red/15 relative">
                      <NoteCard 
                        id={String(note.id)}
                        title={note.title}
                        course={note.course_code}
                      />
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-12 text-center text-gray-500 text-sm font-medium">
                    No resources found matching your criteria.
                  </div>
                )}
              </motion.div>

            </main>

            <aside className="hidden lg:flex w-72 flex-shrink-0 flex-col gap-6 order-2 lg:order-1">
              
              {isLoggedIn ? (
                <div className="bg-white/95 backdrop-blur-sm p-5 rounded-3xl border border-brand-red/15 shadow-sm flex flex-col">
                  <div className="flex items-center gap-2 mb-4 px-1">
                    <Library className="w-4 h-4 text-brand-red" />
                    <h3 className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest">My Workspace</h3>
                  </div>

                  <Link 
                    href="/submit" 
                    className="w-full flex items-center justify-center gap-2 py-3 bg-brand-red hover:bg-brand-red-hover text-white text-xs font-mono font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm active:scale-[0.98] mb-5 cursor-pointer"
                  >
                    <UploadCloud className="w-4 h-4" />
                    Upload Notes
                  </Link>

                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">Top Folders</p>
                    {topFolders.map(([code, count]) => (
                      <DesktopFolderLink key={code} courseCode={code} count={count} />
                    ))}
                    {topFolders.length === 0 && (
                      <p className="text-[10px] text-gray-400 px-1 py-2">No folders yet.</p>
                    )}
                  </div>
                  
                  <Link href="/dashboard" className="mt-4 text-[11px] font-mono font-bold text-brand-red hover:underline text-center">
                    View all in Dashboard &rarr;
                  </Link>
                </div>
              ) : (
                <div className="bg-white/95 backdrop-blur-sm p-6 rounded-3xl border border-brand-red/15 border-dashed flex flex-col items-center text-center shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-brand-red/10 text-brand-red flex items-center justify-center mb-3">
                    <Lock className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm mb-2">Unlock Your Library</h3>
                  <p className="text-xs text-gray-500 mb-5 leading-relaxed">
                    Create an account to save course folders, upload notes, and earn volunteer hours.
                  </p>
                  <div className="flex w-full gap-2">
                    <Link href="/signin" className="flex-1 py-2.5 bg-gray-50 border border-gray-200 text-gray-700 text-[11px] font-bold uppercase rounded-lg hover:bg-gray-100 transition-colors cursor-pointer text-center">
                      Log In
                    </Link>
                    <Link href="/signup" className="flex-1 py-2.5 bg-brand-red text-white text-[11px] font-bold uppercase rounded-lg hover:bg-brand-red-hover shadow-sm transition-colors cursor-pointer text-center">
                      Sign Up
                    </Link>
                  </div>
                </div>
              )}

              <div className="bg-white/95 backdrop-blur-sm p-5 rounded-3xl border border-brand-red/15 shadow-sm flex flex-col">
                <div className="flex items-center gap-2 mb-4 px-1">
                  <Compass className="w-4 h-4 text-brand-red" />
                  <h3 className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest">Browse Database</h3>
                </div>
                
                <nav className="flex flex-col gap-1">
                  {FACULTIES.map((faculty) => (
                    <button
                      key={faculty}
                      onClick={() => setActiveFaculty(faculty)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                        activeFaculty === faculty 
                          ? "bg-brand-red/10 text-brand-red" 
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      {faculty}
                      {activeFaculty === faculty && <ChevronRight className="w-4 h-4" />}
                    </button>
                  ))}
                </nav>
              </div>

            </aside>

          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Sub-components remain unchanged
function DesktopFolderLink({ courseCode, count }: { courseCode: string, count: number }) {
  return (
    <Link 
      href={`/notes/${courseCode}`} 
      className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors group cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-brand-red/10 group-hover:text-brand-red transition-colors">
          <Folder className="w-4 h-4 fill-current opacity-80" />
        </div>
        <span className="text-sm font-semibold text-gray-700 group-hover:text-brand-red transition-colors">{courseCode}</span>
      </div>
      <span className="text-[10px] font-mono text-gray-400 bg-white border border-gray-100 px-2 py-0.5 rounded shadow-xs">
        {count}
      </span>
    </Link>
  );
}

function MobileFolderCard({ courseCode, count }: { courseCode: string, count: number }) {
  return (
    <Link 
      href={`/notes/${courseCode}`} 
      className="snap-start shrink-0 w-[110px] flex flex-col justify-between bg-white border border-gray-200 rounded-xl p-3 shadow-sm hover:border-brand-red/30 transition-colors"
    >
      <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 mb-2">
        <Folder className="w-3.5 h-3.5 fill-current opacity-80" />
      </div>
      <div>
        <h4 className="text-[11px] font-bold text-gray-900">{courseCode}</h4>
        <p className="text-[9px] font-mono text-gray-400 mt-0.5">{count} files</p>
      </div>
    </Link>
  );
}