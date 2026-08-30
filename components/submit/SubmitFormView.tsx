"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  FileUp, 
  CheckCircle2, 
  ArrowLeft, 
  ShieldAlert, 
  ChevronDown, 
  BookOpen, 
  User, 
  FileText, 
  UploadCloud,
  Check
} from "lucide-react";
import { FormField } from "@/components/ui/FormField";

const notebookStyle = {
  backgroundImage: `
    linear-gradient(90deg, transparent 64px, rgba(168, 49, 66, 0.15) 64px, rgba(168, 49, 66, 0.15) 66px, transparent 66px),
    linear-gradient(transparent 31px, #e5e7eb 32px)
  `,
  backgroundSize: "100% 100%, 100% 32px",
};

const NOTE_TYPES = ["Midterm Notes", "Final Notes", "Review Notes", "Full Course"];

export function SubmitFormView() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formError, setFormError] = useState("");
  const [showGuidelines, setShowGuidelines] = useState(true);
  
  // Interactive States
  const [selectedNoteTypes, setSelectedNoteTypes] = useState<string[]>([]);
  const [isOtherSelected, setIsOtherSelected] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<"EN" | "FR">("EN");
  const [fileName, setFileName] = useState<string | null>(null);

  const toggleNoteType = (type: string) => {
    setSelectedNoteTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const isOriginal = formData.get("isOriginal");
    const confirmRules = formData.get("confirmRules");

    const isValidUOttawaEmail = /^[^\s@]+@uottawa\.ca$/i.test(email);

    if (!isValidUOttawaEmail) {
      setFormError("Please enter a valid @uottawa.ca student email address.");
      return;
    }

    if (!isOriginal || !confirmRules) {
      setFormError("Please check all confirmation boxes before submitting.");
      return;
    }

    setFormError("");
    setIsSubmitted(true);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="w-full min-h-[calc(100vh-80px)] py-12 px-4 sm:px-6 lg:px-12 flex flex-col items-center"
    >
      <div className="w-full max-w-4xl mx-auto flex flex-col gap-8">
        
        {/* Notebook Container */}
        <div 
          className="w-full bg-white p-6 sm:p-12 lg:p-16 rounded-[2rem] shadow-xl border border-brand-red/15 relative overflow-hidden"
          style={notebookStyle}
        >
          {/* Red Margin Line */}
          <div className="absolute top-0 bottom-0 left-12 sm:left-20 w-[2px] bg-[#a83142]/25 pointer-events-none z-0" />
          
          {/* Notebook Spine Shadow */}
          <div className="absolute top-0 left-0 bottom-0 w-8 sm:w-16 bg-gradient-to-r from-black/[0.04] to-transparent pointer-events-none z-10" />

          {/* Content Wrapper */}
          <div className="relative z-20 pl-6 sm:pl-12">

            {!isSubmitted ? (
              <>
                {/* Header */}
                <div className="mb-8 border-b border-gray-200/80 pb-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-red/10 text-brand-red text-[10px] font-mono font-bold uppercase tracking-widest mb-3">
                    Resource Marketplace
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-black tracking-tight font-sans text-gray-900">
                    Submit Course Notes
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Contribute verified study material to support the uOttawa academic community.
                  </p>
                </div>

                {/* Collapsible Guidelines Box */}
                <div className="mb-10 bg-white border border-brand-red/20 rounded-2xl shadow-xs overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowGuidelines(!showGuidelines)}
                    className="w-full flex items-center justify-between p-4 sm:p-5 bg-brand-red/5 hover:bg-brand-red/10 transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-red/15 text-brand-red flex items-center justify-center shrink-0">
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-xs sm:text-sm font-bold font-logo text-brand-red tracking-wide uppercase">
                          Submission Guidelines & Academic Integrity
                        </h2>
                        <p className="text-[11px] text-gray-500 font-sans">
                          Review requirements before uploading notes
                        </p>
                      </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-brand-red transition-transform duration-200 ${showGuidelines ? "rotate-180" : ""}`} />
                  </button>

                  {showGuidelines && (
                    <div className="p-5 sm:p-6 border-t border-brand-red/10 space-y-4 text-xs sm:text-sm text-gray-700 leading-relaxed font-sans bg-white">
                      <div className="grid grid-cols-1 gap-3">
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-red text-white text-[10px] font-mono font-bold shrink-0 mt-0.5">1</span>
                          <p><strong className="text-gray-900">Original Work Only:</strong> All documents must be authored by you. Direct uncredited copying from AI tools is prohibited.</p>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-red text-white text-[10px] font-mono font-bold shrink-0 mt-0.5">2</span>
                          <p><strong className="text-gray-900">No Public Reshares:</strong> Do not upload third-party copyrighted coursepacks or publisher slides.</p>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-red text-white text-[10px] font-mono font-bold shrink-0 mt-0.5">3</span>
                          <p><strong className="text-gray-900">Zero Tolerance for Abuse:</strong> Placeholder or malicious submissions will result in immediate review and account suspension.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Form Section */}
                <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-8">
                  
                  {/* SECTION 1: Author Details */}
                  <div className="space-y-4 bg-gray-50/60 p-5 sm:p-6 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-200/60">
                      <User className="w-4 h-4 text-brand-red" />
                      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-700">1. Author Information</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        id="submit-full-name"
                        label="Full Name"
                        name="fullName"
                        type="text"
                        placeholder="John Doe"
                        autoComplete="name"
                        required
                      />
                      <FormField
                        id="submit-email"
                        label="uOttawa Student Email"
                        name="email"
                        type="email"
                        placeholder="example@uottawa.ca"
                        autoComplete="email"
                        required
                      />
                    </div>
                  </div>

                  {/* SECTION 2: Document Categorization */}
                  <div className="space-y-4 bg-gray-50/60 p-5 sm:p-6 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-200/60">
                      <FileText className="w-4 h-4 text-brand-red" />
                      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-700">2. Document Classification</h3>
                    </div>

                    {/* Language Toggle */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-medium text-gray-600">Note Language</label>
                      <div className="inline-flex bg-white border border-gray-200 rounded-xl p-1 w-fit shadow-2xs">
                        {(["EN", "FR"] as const).map((lang) => (
                          <button
                            key={lang}
                            type="button"
                            onClick={() => setSelectedLanguage(lang)}
                            className={`px-5 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                              selectedLanguage === lang 
                                ? "bg-brand-red text-white shadow-xs" 
                                : "text-gray-600 hover:text-gray-900"
                            }`}
                          >
                            {lang === "EN" ? "English" : "French"}
                          </button>
                        ))}
                      </div>
                      <input type="hidden" name="language" value={selectedLanguage} />
                    </div>

                    {/* Type of Notes Grid */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-medium text-gray-600">Type of Notes (Select all that apply)</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {NOTE_TYPES.map((type) => {
                          const isChecked = selectedNoteTypes.includes(type);
                          return (
                            <div
                              key={type}
                              onClick={() => toggleNoteType(type)}
                              className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                                isChecked 
                                  ? "border-brand-red bg-brand-red/5 text-brand-red shadow-2xs" 
                                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                              }`}
                            >
                              <span>{type}</span>
                              <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${isChecked ? "bg-brand-red border-brand-red text-white" : "border-gray-300"}`}>
                                {isChecked && <Check className="w-3 h-3" />}
                              </div>
                            </div>
                          );
                        })}
                        
                        {/* Other Option */}
                        <div
                          onClick={() => setIsOtherSelected(!isOtherSelected)}
                          className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                            isOtherSelected 
                              ? "border-brand-red bg-brand-red/5 text-brand-red shadow-2xs" 
                              : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                          }`}
                        >
                          <span>Other</span>
                          <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${isOtherSelected ? "bg-brand-red border-brand-red text-white" : "border-gray-300"}`}>
                            {isOtherSelected && <Check className="w-3 h-3" />}
                          </div>
                        </div>
                      </div>

                      {/* Hidden inputs to capture checkboxes for FormData */}
                      {selectedNoteTypes.map(t => <input key={t} type="hidden" name="noteTypes" value={t} />)}

                      {isOtherSelected && (
                        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mt-2">
                          <input
                            type="text"
                            name="otherNoteType"
                            placeholder="Specify note type (e.g., Lab Manual, Quiz Bank)..."
                            className="w-full p-3.5 bg-white border border-gray-200 rounded-xl text-xs font-sans focus:outline-none focus:border-brand-red/50 shadow-2xs"
                            required
                          />
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* SECTION 3: Course Context */}
                  <div className="space-y-4 bg-gray-50/60 p-5 sm:p-6 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-200/60">
                      <BookOpen className="w-4 h-4 text-brand-red" />
                      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-700">3. Course & Faculty Context</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField id="submit-course-code" label="Course Code" name="courseCode" type="text" placeholder="e.g. CSI2110" required />
                      <FormField id="submit-course-name" label="Full Course Name" name="courseName" type="text" placeholder="e.g. Data Structures" required />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField id="submit-section" label="Section" name="section" type="text" placeholder="e.g. A, B, C or D" required />
                      <FormField id="submit-professor" label="Professor Name" name="professor" type="text" placeholder="e.g. Dr. Amy Murtha" required />
                    </div>
                  </div>

                  {/* SECTION 4: File Upload & Comments */}
                  <div className="space-y-4 bg-gray-50/60 p-5 sm:p-6 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-200/60">
                      <UploadCloud className="w-4 h-4 text-brand-red" />
                      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-700">4. Document Upload</h3>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-medium text-gray-600">PDF File or Document Archive</label>
                      <label className="border-2 border-dashed border-gray-300 hover:border-brand-red/50 rounded-2xl p-8 text-center bg-white transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group">
                        <div className="w-10 h-10 rounded-full bg-brand-red/10 text-brand-red flex items-center justify-center group-hover:scale-105 transition-transform">
                          <FileUp className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-gray-800">
                          {fileName ? fileName : "Click to browse or drag & drop files here"}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">PDF, DOCX, or ZIP up to 50MB</span>
                        <input 
                          type="file" 
                          name="noteFile" 
                          onChange={(e) => setFileName(e.target.files?.[0]?.name || null)}
                          className="hidden" 
                          required 
                        />
                      </label>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-medium text-gray-600">Additional Comments (Optional)</label>
                      <textarea
                        name="comments"
                        rows={3}
                        placeholder="Anything contextually helpful for our review team or downloading students..."
                        className="w-full p-4 bg-white border border-gray-200 rounded-xl text-xs font-sans focus:outline-none focus:border-brand-red/50 transition-colors shadow-2xs resize-none"
                      />
                    </div>
                  </div>

                  {/* SECTION 5: Confirmations & Submit */}
                  <div className="space-y-4 pt-2">
                    <div className="flex flex-col gap-3 p-4 bg-amber-50/50 border border-amber-200/60 rounded-2xl">
                      <label className="flex items-start gap-3 text-xs text-gray-700 cursor-pointer">
                        <input type="checkbox" name="isOriginal" className="mt-0.5 accent-brand-red shrink-0" required />
                        <span>I confirm that this is my original work and understand that proof of creation may be requested.</span>
                      </label>
                      <label className="flex items-start gap-3 text-xs text-gray-700 cursor-pointer">
                        <input type="checkbox" name="confirmRules" className="mt-0.5 accent-brand-red shrink-0" required />
                        <span>I have read and agree to all submission guidelines stated above.</span>
                      </label>
                    </div>

                    {formError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-mono font-bold text-brand-red text-center">
                        {formError}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-4 bg-brand-red text-white text-xs font-mono font-bold uppercase tracking-widest rounded-xl hover:bg-brand-red-hover transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <UploadCloud className="w-4 h-4" />
                      Submit Notes for Review
                    </button>
                  </div>

                </form>
              </>
            ) : (
              /* Success Confirmation View */
              <div className="py-16 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-6 shadow-inner animate-in zoom-in-50 duration-300">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                
                <span className="text-xs font-mono uppercase tracking-[0.3em] text-emerald-600 font-bold mb-2">
                  Transmission Successful
                </span>
                
                <h2 className="text-3xl font-black tracking-tight font-sans text-gray-900 mb-3">
                  Your notes have been received
                </h2>
                
                <p className="text-sm text-gray-600 max-w-md mb-8 leading-relaxed">
                  Our moderation queue is processing your file. You will receive an email notification once your notes are approved and published.
                </p>

                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-brand-red text-white text-xs font-mono font-bold uppercase tracking-widest rounded-xl hover:bg-brand-red-hover transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Return to my dashboard
                </Link>
              </div>
            )}

          </div>
        </div>

      </div>
    </motion.div>
  );
}