"use client";

import { useState, useMemo } from "react";
import { 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  AlertOctagon, 
  Search, 
  BookOpen, 
  Lock, 
  Copy, 
  Check, 
  Filter 
} from "lucide-react";

type GuidelineSection = {
  id: string;
  title: string;
  category: "APPROVAL" | "REJECTION" | "COPYRIGHT" | "GOVERNANCE";
  summary: string;
  rules: string[];
};

const INITIAL_GUIDELINES: GuidelineSection[] = [
  {
    id: "g_0",
    title: "Core Ethical Standards & Moderator Conduct",
    category: "GOVERNANCE",
    summary: "Moderators hold privileged administrative access. Any malicious or biased exercise of power results in immediate revocation of admin rights and platform suspension.",
    rules: [
      "Strict Prohibition on Favoritism: You must not approve sub-par, incomplete, or plagiarized notes submitted by personal friends, roommates, or club associates.",
      "No Self-Review: You are strictly prohibited from approving your own uploaded documents or manipulating the queue to fast-track your own submissions.",
      "Audit Trail Accountability: Every approval, rejection, and ban is permanently logged with your admin ID. Arbitrary or retaliatory actions will trigger an internal executive review by UONotes leadership.",
      "Data Privacy Protection: Student account emails and submission histories are strictly confidential. Exporting or leaking user data outside the admin panel is a severe breach of protocol."
    ],
  },
  {
    id: "g_1",
    title: "Course Code Accuracy & Matching",
    category: "APPROVAL",
    summary: "Every document must strictly map to an active uOttawa or Carleton course code listed in the university registry.",
    rules: [
      "Verify the course code on the title page matches the submission metadata (e.g., MAT1348, CSI2110).",
      "Reject generic titles like 'Math Notes' unless the specific course code is clearly visible on page one.",
      "Cross-reference cross-listed courses to ensure proper tagging."
    ],
  },
  {
    id: "g_2",
    title: "Scan Quality & Legibility",
    category: "APPROVAL",
    summary: "Students rely on these notes during midterms; handwritten text must be legible and properly oriented.",
    rules: [
      "Pages must be right-side up and fully cropped (no excessive shadows or cut-off margins).",
      "Handwriting must be legible under standard zoom; blurry smartphone photos of screens will be rejected.",
      "Multi-page documents must be compiled into a single, cohesive PDF."
    ],
  },
  {
    id: "g_3",
    title: "Copyright & Intellectual Property",
    category: "COPYRIGHT",
    summary: "UONotes protects student-authored notes, summaries, and formula sheets, but strictly prohibits institutional copyright infringement.",
    rules: [
      "Direct re-uploads of official professor slide decks or scanned copyrighted textbooks are strictly prohibited.",
      "Professors' proprietary midterm/exam banks distributed under NDA cannot be hosted.",
      "Student-created study guides derived from lectures are fully permitted and encouraged."
    ],
  },
  {
    id: "g_4",
    title: "Mandatory Rejection Protocol",
    category: "REJECTION",
    summary: "When rejecting a document, moderators must select the accurate infraction category to maintain audit integrity.",
    rules: [
      "Always provide clear feedback so the student knows how to fix and re-upload their notes.",
      "Zero-tolerance for malicious files, spam, or inappropriate content—trigger an immediate account review if necessary.",
      "Plagiarized submissions cannot be appealed without proof of original authorship."
    ],
  },
];

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
    return INITIAL_GUIDELINES.filter((guide) => {
      const matchesCategory = selectedCategory === "ALL" || guide.category === selectedCategory;
      const matchesSearch = 
        guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guide.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guide.rules.some(r => r.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="w-full max-w-7xl mx-auto py-10 px-4 sm:px-6 space-y-8 animate-in fade-in duration-500 relative">
      
      {/* AMBIENT BACKGROUND GLOW */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-brand-red text-[10px] font-mono font-bold uppercase tracking-wider border border-red-100">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-red animate-pulse" />
              Governance Framework
            </span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Moderator Guidelines</h1>
          <p className="text-xs text-gray-500 mt-1 max-w-xl">
            Standardized compliance criteria and zero-tolerance platform rules. (Read-only reference manual).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-50 border border-gray-200/80 rounded-2xl text-gray-600 text-xs font-mono font-medium shadow-2xs">
            <Lock className="w-3.5 h-3.5 text-gray-400" /> Immutable Policy v2.6
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-xs font-mono font-bold shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-rose-600" /> Active
          </div>
        </div>
      </div>

      {/* ZERO-TOLERANCE BANNER (SPECIAL SPOTLIGHT) */}
      <div className="bg-gradient-to-r from-gray-950 via-gray-900 to-rose-950 text-white rounded-3xl p-8 shadow-xl border border-rose-900/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-600/20 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
              <AlertOctagon className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-rose-400 bg-rose-950/80 px-2.5 py-1 rounded-md border border-rose-800/50">
                Mandatory Governance Policy
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight mt-2">Core Ethical Standards & Moderator Conduct</h2>
              <p className="text-xs text-gray-300 mt-1.5 max-w-3xl leading-relaxed">
                Administrative privileges are a trust granted by the UONotes executive team. Exercising bias, granting preferential treatment to peers, retaliating against users, or leaking confidential audit telemetry results in immediate removal of admin rights and permanent platform expulsion.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SEARCH & CATEGORY FILTER TOOLBAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-gray-100 shadow-2xs">
        
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text"
            placeholder="Search rules, policies, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200/80 rounded-2xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-red/10 focus:border-brand-red transition-all"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {["ALL", "GOVERNANCE", "APPROVAL", "REJECTION", "COPYRIGHT"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2 rounded-xl text-[11px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat 
                  ? "bg-gray-900 text-white shadow-xs" 
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200/60"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Guidelines Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredGuidelines.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-gray-100">
            <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-gray-900">No guidelines found</h3>
            <p className="text-xs text-gray-500 mt-1">Try adjusting your search query or filter category.</p>
          </div>
        ) : (
          filteredGuidelines.map((guide) => {
            const isGovernance = guide.category === "GOVERNANCE";

            return (
              <div 
                key={guide.id}
                className={`bg-white border rounded-3xl p-7 shadow-xs flex flex-col justify-between transition-all hover:shadow-md ${
                  isGovernance ? "md:col-span-2 border-rose-100 bg-gradient-to-br from-white via-white to-rose-50/10" : "border-gray-100"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-lg border ${
                      isGovernance ? "bg-rose-50 text-rose-700 border-rose-100" :
                      guide.category === "APPROVAL" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                      guide.category === "COPYRIGHT" ? "bg-purple-50 text-purple-700 border-purple-100" :
                      "bg-amber-50 text-amber-700 border-amber-100"
                    }`}>
                      {guide.category} STANDARD
                    </span>

                    <span className="text-[10px] font-mono text-gray-400 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">
                      ID: {guide.id}
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-gray-900 tracking-tight mb-2">{guide.title}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed mb-6 font-medium">
                    {guide.summary}
                  </p>

                  <ul className="space-y-3 border-t border-gray-100 pt-5">
                    {guide.rules.map((rule, idx) => {
                      const isRuleCopied = copiedRule === rule;

                      return (
                        <li key={idx} className="group flex items-start justify-between gap-3 text-xs text-gray-700 leading-relaxed bg-gray-50/50 hover:bg-gray-50 p-3 rounded-2xl border border-gray-100/60 transition-colors">
                          <div className="flex items-start gap-2.5">
                            {isGovernance ? (
                              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5 text-brand-red shrink-0 mt-0.5" />
                            )}
                            <span>{rule}</span>
                          </div>

                          <button
                            onClick={() => handleCopyRule(rule)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-gray-700 bg-white rounded-lg border border-gray-200/80 shrink-0 shadow-2xs"
                            title="Copy rule text for feedback message"
                          >
                            {isRuleCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="mt-8 pt-4 border-t border-gray-50 flex items-center justify-between text-[11px] text-gray-400 font-mono">
                  <span>Enforced by Executive Board</span>
                  <span>Version 2.6 • Read-Only Reference</span>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}