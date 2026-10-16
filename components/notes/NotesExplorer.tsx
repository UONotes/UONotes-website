"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, UploadCloud, X } from "lucide-react";
import { NoteCard } from "@/components/ui/NoteCard";
import { formatShortDate } from "@/lib/dateFormat";

// ─── "Rubber stamp" styles (same as the navbar) ──────────────────────────────
const STAMP_TEXT = "font-mono font-bold uppercase tracking-[0.16em]";
const STAMP_INK = "bg-brand-red shadow-[inset_0_0_0_2px_rgba(255,240,240,0.35)]";
const LABEL = `text-[11px] sm:text-xs text-brand-red ${STAMP_TEXT} tracking-[0.2em]`;
const hideScrollbar = "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]";

// ─── Settings ────────────────────────────────────────────────────────────────
// How many notes show before "Show more"
const NOTES_PAGE_SIZE = 12;
// How many course folders show before "Show all courses" (the "Course missing?" card takes the last spot)
const FOLDERS_PREVIEW = 7;
// How many courses are listed in the "Most notes" column (laptop and up)
const TOP_COURSES = 5;
// How many quick-jump course stamps show under the heading
const POPULAR_COURSES = 5;

// Which course codes belong to which faculty (matched on the start of the code)
const FACULTY_PREFIXES: Record<string, string[]> = {
  Arts: ["ENG", "HIS", "PHI", "FRA", "ART", "MUS", "THE", "LIN", "CLA", "TRA", "ESP", "ITA", "CHN", "JPN", "RUS", "LCM", "FLS", "SRS"],
  Education: ["EDU"],
  Engineering: ["CSI", "SEG", "CEG", "ELG", "MCG", "CVG", "CHG", "GNG"],
  "Health Sciences": ["HSS", "BPS", "NSG", "NUT", "APA", "REA", "ORA", "EPI"],
  Law: ["DRC", "CML"],
  Medicine: ["MED", "ANP", "MDV", "BMG", "TMM"],
  Science: ["MAT", "STA", "CHM", "PHY", "BIO", "BCH", "ENV", "GEG", "NSC"],
  "Social Sciences": ["PSY", "SOC", "ECO", "POL", "CRM", "ANT", "GEO", "CMN", "FEM", "API", "PAP", "ISP"],
  Telfer: ["ADM", "MBA", "MGT"],
};

const ALL = "All Faculties";
const FACULTIES = [ALL, ...Object.keys(FACULTY_PREFIXES)];

type SortKey = "newest" | "oldest" | "az";
const SORTS: { key: SortKey; label: string }[] = [
  { key: "newest", label: "Newest" },
  { key: "oldest", label: "Oldest" },
  { key: "az", label: "A → Z" },
];
// ─────────────────────────────────────────────────────────────────────────────

export interface DatabaseNote {
  id: string;
  title: string;
  course_code: string;
  fileUrl?: string;
  author_name?: string | null;
  created_at?: string | null;
}

interface NotesExplorerProps {
  isLoggedIn?: boolean;
  notes: DatabaseNote[];
  // From the page URL (?faculty=Engineering&q=csi), so filters survive going back from a note
  initialFaculty?: string;
  initialQuery?: string;
}

function inFaculty(courseCode: string, faculty: string) {
  if (faculty === ALL) return true;
  const code = courseCode.toUpperCase();
  return (FACULTY_PREFIXES[faculty] ?? []).some((p) => code.startsWith(p));
}

type CourseSummary = { code: string; count: number; latest: string | null };

// One entry per course: how many notes it has and when the newest was added (most notes first)
function summariseCourses(notes: DatabaseNote[]): CourseSummary[] {
  const byCode = new Map<string, CourseSummary>();
  for (const n of notes) {
    const entry = byCode.get(n.course_code) ?? { code: n.course_code, count: 0, latest: null };
    entry.count += 1;
    if (n.created_at && (!entry.latest || n.created_at > entry.latest)) entry.latest = n.created_at;
    byCode.set(n.course_code, entry);
  }
  return [...byCode.values()].sort((a, b) => b.count - a.count || a.code.localeCompare(b.code));
}

// A label above each section with a faint rule running to the right
function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h3 className={`mb-4 flex items-center gap-3.5 ${LABEL}`}>
      <span className="shrink-0">{children}</span>
      <span aria-hidden="true" className="h-px flex-1 bg-[#eedadd]" />
    </h3>
  );
}

// A course folder: a little tab on top, the code in big red letters
function CourseFolder({ code, count, latest }: CourseSummary) {
  return (
    <Link href={`/notes/${code}`} className="group relative block pt-3">
      <span
        aria-hidden="true"
        className="absolute left-0 top-0 h-3.5 w-[46%] border-[1.5px] border-b-0 border-[#e4bcc1] bg-[#f1d4d8] transition-colors group-hover:bg-[#eac3c8]"
      />
      <span className="block border-[1.5px] border-[#e4bcc1] bg-[#fbecee] p-3.5 transition-colors group-hover:bg-[#f7e0e3] sm:p-4">
        <span className="block text-lg font-black tracking-[-0.02em] text-brand-red sm:text-2xl">{code}</span>
        <span className={`mt-2 block text-[9px] text-[#9c7f83] sm:mt-3 sm:text-[10px] ${STAMP_TEXT}`}>
          {count} {count === 1 ? "note" : "notes"} <span className="transition-transform group-hover:translate-x-0.5">&rarr;</span>
        </span>
        {latest && <span className="mt-1 block text-[11px] text-[#9c7f83] sm:text-xs">Updated {formatShortDate(latest)}</span>}
      </span>
    </Link>
  );
}

export function NotesExplorer({ isLoggedIn = false, notes = [], initialFaculty, initialQuery }: NotesExplorerProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeFaculty, setActiveFaculty] = useState(() => (initialFaculty && FACULTIES.includes(initialFaculty) ? initialFaculty : ALL));
  const [searchQuery, setSearchQuery] = useState(initialQuery ?? "");
  const [sort, setSort] = useState<SortKey>("newest");
  const [visibleCount, setVisibleCount] = useState(NOTES_PAGE_SIZE);
  const [showAllFolders, setShowAllFolders] = useState(false);

  // Every course in the library, and how many notes each faculty tab holds
  const allCourses = useMemo(() => summariseCourses(notes), [notes]);
  const facultyCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const faculty of FACULTIES) counts[faculty] = notes.filter((n) => inFaculty(n.course_code, faculty)).length;
    return counts;
  }, [notes]);

  // Everything in the open tab
  const facultyNotes = useMemo(() => notes.filter((n) => inFaculty(n.course_code, activeFaculty)), [notes, activeFaculty]);
  const facultyCourses = useMemo(() => summariseCourses(facultyNotes), [facultyNotes]);

  const query = searchQuery.trim().toLowerCase();
  // "csi 2110" should still find CSI2110
  const compactQuery = query.replace(/\s+/g, "");

  const matchingFolders = useMemo(
    () => (compactQuery ? facultyCourses.filter((c) => c.code.toLowerCase().includes(compactQuery)) : facultyCourses),
    [facultyCourses, compactQuery],
  );

  const matchingNotes = useMemo(() => {
    let list = query
      ? facultyNotes.filter((n) => n.title.toLowerCase().includes(query) || n.course_code.toLowerCase().includes(compactQuery))
      : facultyNotes;
    // Notes arrive newest first from the server
    if (sort === "oldest") list = [...list].reverse();
    if (sort === "az") list = [...list].sort((a, b) => a.course_code.localeCompare(b.course_code) || a.title.localeCompare(b.title));
    return list;
  }, [facultyNotes, query, compactQuery, sort]);

  // Back to the start whenever the filters change
  const filterKey = `${activeFaculty}|${searchQuery}|${sort}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setVisibleCount(NOTES_PAGE_SIZE);
    setShowAllFolders(false);
  }

  const visibleFolders = showAllFolders ? matchingFolders : matchingFolders.slice(0, FOLDERS_PREVIEW);
  const visibleNotes = matchingNotes.slice(0, visibleCount);
  const hasMoreNotes = visibleCount < matchingNotes.length;
  const facultyName = activeFaculty === ALL ? "all" : activeFaculty;

  // When a search finds nothing in this tab, how many notes it would find across every faculty
  const matchesElsewhere = useMemo(() => {
    if (!query || activeFaculty === ALL) return 0;
    return notes.filter((n) => n.title.toLowerCase().includes(query) || n.course_code.toLowerCase().includes(compactQuery)).length;
  }, [notes, query, compactQuery, activeFaculty]);

  // If the search is one exact course code (or only one course matches), Enter opens its folder
  const jumpTarget = compactQuery
    ? (allCourses.find((c) => c.code.toLowerCase() === compactQuery) ?? (matchingFolders.length === 1 ? matchingFolders[0] : null))
    : null;

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    if (jumpTarget) router.push(`/notes/${jumpTarget.code}`);
    else inputRef.current?.blur();
  }

  function resetFilters() {
    setActiveFaculty(ALL);
    setSearchQuery("");
  }

  // Keep the tab + search in the address bar, so the back button (and shared links) bring you to the same view
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (activeFaculty === ALL) params.delete("faculty");
    else params.set("faculty", activeFaculty);
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    else params.delete("q");
    const qs = params.toString();
    const next = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
    if (next !== `${window.location.pathname}${window.location.search}`) window.history.replaceState(window.history.state, "", next);
  }, [activeFaculty, searchQuery]);

  // Press "/" anywhere to jump into the search box
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName))) return;
      e.preventDefault();
      inputRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ─── Workspace card (sidebar on laptops, a strip on phones) ───
  const workspace = isLoggedIn ? (
    <>
      <h3 className="text-[19px] font-black tracking-[-0.02em] text-gray-900">Got notes to share?</h3>
      <p className="mt-1.5 text-[13px] leading-relaxed text-gray-600">Upload a PDF. Our team reviews it, then it goes live for everyone.</p>
      <Link
        href="/submit"
        className={`mt-4 flex items-center justify-center gap-2 py-3 text-[11px] text-white transition-colors hover:bg-brand-red-hover ${STAMP_TEXT} ${STAMP_INK}`}
      >
        <UploadCloud className="h-4 w-4" />
        Upload a note
      </Link>
      <Link href="/dashboard" className={`mt-3.5 block text-center text-[10px] text-brand-red hover:underline ${STAMP_TEXT}`}>
        My dashboard &rarr;
      </Link>
    </>
  ) : (
    <>
      <h3 className="text-[19px] font-black tracking-[-0.02em] text-gray-900">Unlock your library</h3>
      <p className="mt-1.5 text-[13px] leading-relaxed text-gray-600">
        Make an account to save notes, upload your own and earn volunteer hours.
      </p>
      <div className="mt-4 flex gap-2">
        <Link
          href="/signin?from=/notes"
          className={`flex-1 border-2 border-dashed border-brand-red py-2.5 text-center text-[11px] text-brand-red transition-colors hover:border-solid hover:bg-brand-red hover:text-white ${STAMP_TEXT}`}
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className={`flex-1 py-3 text-center text-[11px] text-white transition-colors hover:bg-brand-red-hover ${STAMP_TEXT} ${STAMP_INK}`}
        >
          Sign up
        </Link>
      </div>
    </>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      // Centred, with the same space on both sides; on wide screens that space also clears the binder edge and lines up with the navbar logo
      className="w-full px-5 pb-20 pt-8 sm:px-8 sm:pt-12 lg:px-12 min-[1360px]:px-[var(--content-left)]"
    >
      <div className="mx-auto w-full max-w-[1440px]">
        {/* ─── Heading + popular courses ─── */}
        <header>
          <p className={LABEL}>
            {"// The library"} &middot; {notes.length} {notes.length === 1 ? "note" : "notes"} &middot; {allCourses.length}{" "}
            {allCourses.length === 1 ? "course" : "courses"}
          </p>
          <h1 className="mt-3 text-[2.5rem] font-black leading-none tracking-[-0.045em] text-gray-900 sm:text-6xl lg:text-[4.5rem]">
            Notes library
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-gray-600 sm:mt-4 sm:text-lg">
            Reviewed, student-made notes from every faculty at uOttawa, filed by course.
          </p>

          {allCourses.length > 0 && (
            <div
              className={`-mx-4 mt-5 flex items-center gap-2 overflow-x-auto px-4 sm:-mx-8 sm:mt-6 sm:flex-wrap sm:px-8 lg:mx-0 lg:px-0 ${hideScrollbar}`}
            >
              <span className={`mr-1 shrink-0 text-[9px] text-gray-400 sm:text-[10px] ${STAMP_TEXT}`}>Popular:</span>
              {allCourses.slice(0, POPULAR_COURSES).map((c) => (
                <Link
                  key={c.code}
                  href={`/notes/${c.code}`}
                  className={`shrink-0 border-[1.5px] border-dashed border-brand-red/45 bg-white/50 px-2.5 py-1.5 text-[10px] text-brand-red transition-colors hover:border-solid hover:bg-brand-red hover:text-white sm:text-[11px] ${STAMP_TEXT}`}
                >
                  {c.code}
                </Link>
              ))}
            </div>
          )}
        </header>

        {/* ─── Divider tabs (one per faculty) ─── */}
        <div
          role="tablist"
          aria-label="Faculties"
          className={`relative z-10 -mx-4 mt-8 flex gap-1 overflow-x-auto px-4 sm:-mx-8 sm:px-8 lg:mx-0 lg:mt-10 lg:px-5 ${hideScrollbar}`}
        >
          {FACULTIES.map((faculty) => {
            const isActive = activeFaculty === faculty;
            const count = facultyCounts[faculty];
            return (
              <button
                key={faculty}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveFaculty(faculty)}
                className={`shrink-0 whitespace-nowrap border-[1.5px] border-b-0 px-3 text-[10px] transition-colors lg:px-2.5 xl:px-3 min-[1500px]:px-4 min-[1500px]:text-[11px] ${STAMP_TEXT} ${
                  isActive
                    ? "border-white bg-white pb-3.5 pt-3 text-brand-red shadow-[inset_0_3px_0_#8F0018]"
                    : `mt-1 border-[#ebc9cd] bg-[#f6dfe2] pb-2.5 pt-2.5 hover:bg-[#f9e8ea] hover:text-brand-red ${count ? "text-[#7b5a5e]" : "text-[#7b5a5e]/45"}`
                }`}
              >
                {faculty === ALL ? "All" : faculty}
                <span className={`ml-1 xl:ml-1.5 ${isActive ? "text-brand-red/50" : "text-[#7b5a5e]/45"}`}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* ─── The page the tabs are clipped to ─── */}
        <section className="relative bg-white px-3.5 pb-8 pt-5 shadow-[0_22px_40px_-28px_rgba(0,0,0,0.45)] sm:px-8 sm:pb-10 sm:pt-8 lg:px-9">
          {/* Search + sort */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-6">
            <form role="search" onSubmit={handleSearchSubmit} className="flex min-w-0 flex-1">
              <label className="flex min-w-0 flex-1 items-center gap-3 border-b-2 border-[#1f2a44] pb-2.5 transition-colors focus-within:border-brand-red">
                <Search className="h-5 w-5 shrink-0 text-brand-red" />
                <span className="sr-only">Search notes</span>
                <input
                  ref={inputRef}
                  type="text"
                  inputMode="search"
                  enterKeyHint={jumpTarget ? "go" : "search"}
                  placeholder={activeFaculty === ALL ? "Course code or topic, e.g. CSI2110" : `Search ${activeFaculty} notes...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full min-w-0 bg-transparent text-lg text-gray-900 placeholder:text-gray-400 focus:outline-none sm:text-2xl"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="text-gray-400 hover:text-brand-red"
                    aria-label="Clear search"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
                {!searchQuery && (
                  <kbd
                    aria-hidden="true"
                    className="hidden border-[1.5px] border-[#e2d5d7] px-1.5 font-mono text-[11px] font-bold text-gray-400 lg:block"
                    title='Press "/" to search'
                  >
                    /
                  </kbd>
                )}
              </label>
            </form>
            <div role="group" aria-label="Sort notes" className={`flex shrink-0 gap-4 pb-1 text-[10px] ${STAMP_TEXT}`}>
              {SORTS.map((s) => {
                const isActive = sort === s.key;
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setSort(s.key)}
                    aria-pressed={isActive}
                    className={`border-b-2 pb-1 transition-colors ${isActive ? "border-brand-red text-brand-red" : "border-transparent text-gray-500 hover:text-brand-red"}`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Exact course match: offer to open its folder */}
          {jumpTarget && (
            <Link
              href={`/notes/${jumpTarget.code}`}
              className={`mt-3 inline-flex items-center gap-2 px-3 py-2 text-[10px] text-white transition-colors hover:bg-brand-red-hover sm:text-[11px] ${STAMP_TEXT} ${STAMP_INK}`}
            >
              Open the {jumpTarget.code} folder &rarr;
              <span className="hidden font-normal normal-case tracking-normal text-white/60 sm:inline">or press Enter</span>
            </Link>
          )}

          {/* Phones & tablets: workspace strip */}
          <div className="mt-5 flex items-center justify-between gap-3 border-2 border-dashed border-brand-red/45 px-3.5 py-3 xl:hidden">
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900">{isLoggedIn ? "Got notes to share?" : "Unlock your library"}</p>
              <p className="truncate text-[11px] text-gray-500">
                {isLoggedIn ? "We review every upload." : "Save notes and upload your own."}
              </p>
            </div>
            <Link
              href={isLoggedIn ? "/submit" : "/signin?from=/notes"}
              className={`shrink-0 px-3.5 py-2.5 text-[10px] text-white ${STAMP_TEXT} ${STAMP_INK}`}
            >
              {isLoggedIn ? "Upload ↑" : "Log in"}
            </Link>
          </div>

          {facultyNotes.length === 0 ? (
            // Nothing filed under this tab yet
            <div className="mt-8 border-2 border-dashed border-brand-red/30 px-6 py-16 text-center">
              <p className="text-xl font-black tracking-tight text-gray-900">
                No {facultyName === "all" ? "" : `${activeFaculty} `}notes yet.
              </p>
              <p className="mx-auto mt-1.5 max-w-sm text-sm text-gray-500">Be the first to share yours and help the next class out.</p>
              <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/submit" className={`px-5 py-3 text-[11px] text-white ${STAMP_TEXT} ${STAMP_INK}`}>
                  Upload a note &uarr;
                </Link>
                {activeFaculty !== ALL && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className={`border-2 border-dashed border-brand-red px-4 py-2.5 text-[11px] text-brand-red transition-colors hover:border-solid hover:bg-brand-red hover:text-white ${STAMP_TEXT}`}
                  >
                    Browse all faculties
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-8 grid gap-10 xl:grid-cols-[minmax(0,1fr)_290px] xl:gap-10">
              <div className="min-w-0">
                {/* ─── Course folders (hidden while a search matches no course codes) ─── */}
                {(matchingFolders.length > 0 || !query) && (
                  <div className="mb-10">
                    <SectionLabel>Courses &middot; {matchingFolders.length}</SectionLabel>
                    {matchingFolders.length > 0 ? (
                      <>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 min-[1700px]:grid-cols-5">
                          {visibleFolders.map((c) => (
                            <CourseFolder key={c.code} {...c} />
                          ))}
                          {/* Last spot: invite people to add a missing course */}
                          <Link
                            href="/submit"
                            className="group flex min-h-[86px] flex-col items-center justify-center border-[1.5px] border-dashed border-brand-red/35 px-3 text-center transition-colors hover:border-brand-red/70 hover:bg-[#fdf6f7] sm:mt-3 sm:min-h-[96px]"
                          >
                            <span className="text-sm font-bold text-gray-900">Course missing?</span>
                            <span className={`mt-1 text-[9px] text-brand-red sm:text-[10px] ${STAMP_TEXT}`}>Add your notes &rarr;</span>
                          </Link>
                        </div>
                        {matchingFolders.length > FOLDERS_PREVIEW && (
                          <button
                            type="button"
                            onClick={() => setShowAllFolders((v) => !v)}
                            className={`mt-4 text-[10px] text-brand-red hover:underline sm:text-[11px] ${STAMP_TEXT}`}
                          >
                            {showAllFolders ? "Show fewer courses ↑" : `Show all ${matchingFolders.length} courses ↓`}
                          </button>
                        )}
                      </>
                    ) : null}
                  </div>
                )}

                {/* ─── Notes ─── */}
                <div>
                  <SectionLabel>
                    {query ? "Matching notes" : "Recently added"} &middot; {matchingNotes.length}
                  </SectionLabel>
                  {visibleNotes.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3.5 sm:gap-5 lg:grid-cols-3 min-[1700px]:grid-cols-4">
                      {visibleNotes.map((note) => (
                        <NoteCard
                          key={note.id}
                          id={String(note.id)}
                          title={note.title}
                          course={note.course_code}
                          fileUrl={note.fileUrl}
                          author={note.author_name}
                          date={note.created_at}
                          canSave={isLoggedIn}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-brand-red/30 px-6 py-12 text-center">
                      <p className="text-lg font-black tracking-tight text-gray-900">Nothing matches that.</p>
                      <p className="mt-1.5 text-sm text-gray-500">
                        No {facultyName === "all" ? "" : `${activeFaculty} `}notes match &ldquo;{searchQuery.trim()}&rdquo;.
                      </p>
                      <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
                        {matchesElsewhere > 0 && (
                          <button
                            type="button"
                            onClick={() => setActiveFaculty(ALL)}
                            className={`px-4 py-3 text-[11px] text-white transition-colors hover:bg-brand-red-hover ${STAMP_TEXT} ${STAMP_INK}`}
                          >
                            Search all faculties ({matchesElsewhere})
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setSearchQuery("")}
                          className={`border-2 border-dashed border-brand-red px-4 py-2.5 text-[11px] text-brand-red transition-colors hover:border-solid hover:bg-brand-red hover:text-white ${STAMP_TEXT}`}
                        >
                          Clear search
                        </button>
                      </div>
                    </div>
                  )}

                  {hasMoreNotes && (
                    <div className="mt-8 flex justify-center">
                      <button
                        type="button"
                        onClick={() => setVisibleCount((c) => c + NOTES_PAGE_SIZE)}
                        className={`border-2 border-dashed border-brand-red px-6 py-3 text-[11px] text-brand-red transition-colors hover:border-solid hover:bg-brand-red hover:text-white ${STAMP_TEXT}`}
                      >
                        Show more &middot; {matchingNotes.length - visibleCount} left
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* ─── Laptop+: side column (stays in view while you scroll the notes) ─── */}
              <aside className="hidden self-start xl:sticky xl:top-6 xl:block">
                <div className="border-2 border-dashed border-brand-red/45 bg-[#fffafa] p-5">
                  <p className={`mb-2 text-[10px] text-brand-red ${STAMP_TEXT} tracking-[0.2em]`}>{"// Your workspace"}</p>
                  {workspace}
                </div>

                <div className="mt-8">
                  <SectionLabel>Most notes</SectionLabel>
                  <ol>
                    {facultyCourses.slice(0, TOP_COURSES).map(({ code, count }, i) => (
                      <li key={code}>
                        <Link
                          href={`/notes/${code}`}
                          className="group flex items-center gap-3 border-b border-dashed border-brand-red/20 py-2.5 transition-colors hover:text-brand-red"
                        >
                          <span className={`w-5 text-[11px] text-brand-red/50 ${STAMP_TEXT}`}>{String(i + 1).padStart(2, "0")}</span>
                          <span className={`flex-1 text-xs text-[#1f2a44] group-hover:text-brand-red ${STAMP_TEXT}`}>{code}</span>
                          <span className="text-xs text-gray-400">{count}</span>
                        </Link>
                      </li>
                    ))}
                  </ol>
                </div>

                <p className="mt-8 border-l-4 border-brand-red bg-[#fbecee] px-4 py-3.5 text-[13px] leading-relaxed text-gray-700">
                  <span className="font-bold text-gray-900">Took a course that isn&apos;t here?</span> Your notes could help the next class.{" "}
                  <Link href="/submit" className="font-semibold text-brand-red hover:underline">
                    Share them &rarr;
                  </Link>
                </p>
              </aside>
            </div>
          )}
        </section>
      </div>
    </motion.div>
  );
}