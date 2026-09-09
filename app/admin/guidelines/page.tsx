"use client";

import { useState, useMemo } from "react";
import { 
  ShieldAlert, 
  CheckCircle2, 
  Search, 
  BookOpen, 
  Copy, 
  Check,
} from "lucide-react";

type GuidelineSection = {
  id: string;
  title: string;
  category: "CONDUCT" | "APPROVAL" | "REJECTION" | "COPYRIGHT";
  summary: string;
  rules: string[];
};

const CATEGORY_META = {
  CONDUCT: { label: "Conduct", bg: "bg-red-50", text: "text-brand-red" },
  APPROVAL: { label: "Approval", bg: "bg-emerald-50", text: "text-emerald-700" },
  REJECTION: { label: "Rejection", bg: "bg-amber-50", text: "text-amber-700" },
  COPYRIGHT: { label: "Copyright", bg: "bg-purple-50", text: "text-purple-700" },
} as const;

const GUIDELINES: GuidelineSection[] = [
  {
    id: "g_0",
    title: "Moderator conduct",
    category: "CONDUCT",
    summary: "Reviewing gives you access to other students' submissions and accounts — treat that access carefully.",
    rules: [
      "Don't approve a friend's or roommate's submission if it wouldn't otherwise pass — apply the same bar to everyone.",
      "Don't review or approve your own uploads. Ask another admin to handle them.",
      "Every approval, rejection, and ban is logged with your name in the audit trail, so decisions are traceable.",
      "Student emails and submission history are private. Don't share or export them outside the admin panel.",
    ],
  },
  {
    id: "g_1",
    title: "Course code accuracy",
    category: "APPROVAL",
    summary: "Every document should map to a real, active uOttawa course code.",
    rules: [
      "Check that the course code on the document matches what was entered (e.g. MAT1348, CSI2110).",
      "Reject vague titles like \"Math Notes\" unless the specific course is clearly identified.",
      "For cross-listed courses, make sure the tagging is sensible.",
    ],
  },
  {
    id: "g_2",
    title: "Scan quality & legibility",
    category: "APPROVAL",
    summary: "Students rely on these during exam prep — they need to actually be readable.",
    rules: [
      "Pages should be right-side up and fully cropped, without heavy shadows or cut-off margins.",
      "Handwriting should be legible at a normal zoom level. Blurry photos of a screen don't pass.",
      "Multi-page submissions should be one combined PDF, not separate files.",
    ],
  },
  {
    id: "g_3",
    title: "Copyright",
    category: "COPYRIGHT",
    summary: "Student-authored notes are welcome; other people's copyrighted material isn't.",
    rules: [
      "Reject direct re-uploads of a professor's slide decks or scanned textbook pages.",
      "Exam banks or materials shared under an academic-integrity agreement can't be hosted here.",
      "Original study guides and summaries a student wrote themselves are fine, even if based on lecture content.",
    ],
  },
  {
    id: "g_4",
    title: "Rejecting or requesting fixes",
    category: "REJECTION",
    summary: "When something doesn't pass, the student should know exactly why and what to do next.",
    rules: [
      "Always leave feedback specific enough that the student can fix and resubmit — \"low quality\" isn't enough on its own.",
      "For spam, malicious files, or clearly inappropriate content, reject it and flag the account for a closer look.",
      "If you suspect plagiarism, ask for proof of original authorship before approving.",
    ],
  },
];

const CATEGORIES = ["ALL", "CONDUCT", "APPROVAL", "REJECTION", "COPYRIGHT"] as const;

export default function AdminGuidelinesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [copiedRule, setCopiedRule] = useState<string | null>(null);

  const handleCopyRule = (ruleText: string) => {
    navigator.clipboard.writeText(ruleText);
    setCopiedRule(ruleText);
    setTimeout(() => setCopiedRule(null), 2000);
  };

  const filteredGuidelines = useMemo(() => {
    return GUIDELINES.filter((guide) => {
      const matchesCategory = selectedCategory === "ALL" || guide.category === selectedCategory;
      const matchesSearch =
        guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guide.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guide.rules.some((r) => r.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="font-logo text-3xl font-bold text-[#23201D] tracking-tight">Guidelines</h1>
        <p className="text-sm text-gray-500 mt-1">
          What to check for when reviewing a submission.
        </p>
      </div>

      {/* Conduct spotlight */}
      <div className="bg-white border border-red-100 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-brand-red flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-logo text-lg font-bold text-[#23201D]">Moderator conduct</h2>
            <p className="text-sm text-gray-600 mt-1 leading-relaxed max-w-2xl">
              Reviewing gives you access to other students&apos; submissions and accounts — treat that access carefully.
              Every decision is logged with your name, so keep it fair and consistent.
            </p>
          </div>
        </div>
      </div>

      {/* Search & filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-black/5">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search guidelines"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 hover:bg-gray-100/70 focus:bg-white border border-transparent rounded-xl text-sm text-gray-900 focus:outline-none focus:border-gray-300 transition-all placeholder:text-gray-400"
          />
        </div>

        <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl overflow-x-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {cat === "ALL" ? "All" : CATEGORY_META[cat as keyof typeof CATEGORY_META].label}
            </button>
          ))}
        </div>
      </div>

      {/* Guidelines grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredGuidelines.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-black/5">
            <BookOpen className="w-7 h-7 text-gray-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-gray-900">No guidelines match</h3>
            <p className="text-xs text-gray-400 mt-1">Try a different search or category.</p>
          </div>
        ) : (
          filteredGuidelines.map((guide) => {
            const meta = CATEGORY_META[guide.category];

            return (
              <div
                key={guide.id}
                className="bg-white border border-black/5 rounded-2xl p-6 flex flex-col"
              >
                <span className={`w-fit text-xs font-semibold px-2.5 py-1 rounded-full mb-3 ${meta.bg} ${meta.text}`}>
                  {meta.label}
                </span>

                <h3 className="font-logo text-lg font-bold text-[#23201D] mb-1.5">{guide.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">
                  {guide.summary}
                </p>

                <ul className="space-y-2 border-t border-black/5 pt-4">
                  {guide.rules.map((rule, idx) => {
                    const isRuleCopied = copiedRule === rule;

                    return (
                      <li key={idx} className="group flex items-start justify-between gap-2 text-sm text-gray-700 leading-relaxed">
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-gray-300 shrink-0 mt-1" />
                          <span>{rule}</span>
                        </div>

                        <button
                          onClick={() => handleCopyRule(rule)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-gray-700 shrink-0"
                          title="Copy for feedback message"
                        >
                          {isRuleCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}