"use client";

import { useState } from "react";
import { BookOpen, CheckCircle2, ShieldAlert, ShieldCheck, Edit3, Save, AlertOctagon } from "lucide-react";

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
  const [guidelines, setGuidelines] = useState<GuidelineSection[]>(INITIAL_GUIDELINES);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editSummary, setEditSummary] = useState("");

  const handleEditStart = (g: GuidelineSection) => {
    setIsEditing(g.id);
    setEditSummary(g.summary);
  };

  const handleSave = (id: string) => {
    setGuidelines(guidelines.map(g => g.id === id ? { ...g, summary: editSummary } : g));
    setIsEditing(null);
  };

  return (
    <div className="w-full flex flex-col gap-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Moderator Guidelines</h1>
          <p className="text-sm text-gray-500 mt-1">Standardized compliance criteria and zero-tolerance governance rules.</p>
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-brand-red/5 border border-brand-red/10 rounded-full text-brand-red text-xs font-mono font-bold">
          <ShieldCheck className="w-4 h-4" /> Version 2.6 (Active)
        </div>
      </div>

      {/* ZERO-TOLERANCE BANNER (SPECIAL SPOTLIGHT) */}
      <div className="bg-gradient-to-r from-rose-950 to-gray-900 text-white rounded-3xl p-8 shadow-xl border border-rose-900/50 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-600/20 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-rose-400 bg-rose-950/80 px-2.5 py-1 rounded-md border border-rose-800/50">
                Mandatory Governance Policy
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight mt-2">Core Ethical Standards & Moderator Conduct</h2>
              <p className="text-xs text-gray-300 mt-1 max-w-2xl leading-relaxed">
                Administrative privileges are a trust granted by the UONotes executive team. Exercising bias, granting preferential treatment to peers, retaliating against users, or leaking confidential audit telemetry results in immediate removal of admin rights and permanent platform expulsion.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Guidelines Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {guidelines.map((guide) => {
          const isCurrentlyEditing = isEditing === guide.id;
          const isGovernance = guide.category === "GOVERNANCE";

          return (
            <div 
              key={guide.id}
              className={`bg-white border rounded-2xl p-6 shadow-sm flex flex-col justify-between transition-all ${
                isGovernance ? "md:col-span-2 border-rose-100 bg-gradient-to-br from-white to-rose-50/20" : "border-gray-100 hover:border-gray-200"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${
                    isGovernance ? "bg-rose-50 text-rose-700 border-rose-100" :
                    guide.category === "APPROVAL" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                    guide.category === "COPYRIGHT" ? "bg-purple-50 text-purple-700 border-purple-100" :
                    "bg-amber-50 text-amber-700 border-amber-100"
                  }`}>
                    {guide.category} STANDARD
                  </span>

                  <button 
                    onClick={() => isCurrentlyEditing ? handleSave(guide.id) : handleEditStart(guide)}
                    className="text-gray-400 hover:text-gray-700 transition-colors p-1"
                    title={isCurrentlyEditing ? "Save changes" : "Edit guideline"}
                  >
                    {isCurrentlyEditing ? <Save className="w-4 h-4 text-brand-red" /> : <Edit3 className="w-4 h-4" />}
                  </button>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2">{guide.title}</h3>

                {isCurrentlyEditing ? (
                  <div className="space-y-3 mb-4">
                    <textarea 
                      rows={3}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-brand-red"
                      value={editSummary}
                      onChange={(e) => setEditSummary(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <button onClick={() => setIsEditing(null)} className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg">Cancel</button>
                      <button onClick={() => handleSave(guide.id)} className="px-3 py-1.5 bg-brand-red text-white text-xs font-bold rounded-lg">Save</button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-600 leading-relaxed mb-4">
                    {guide.summary}
                  </p>
                )}

                <ul className="space-y-2.5 border-t border-gray-100/80 pt-4">
                  {guide.rules.map((rule, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-gray-700 leading-relaxed">
                      {isGovernance ? (
                        <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-brand-red shrink-0 mt-0.5" />
                      )}
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between text-[11px] text-gray-400 font-mono">
                <span>Enforced by Executive Board</span>
                <span>Last updated: Aug 2026</span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}