"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  FileUp, 
  CheckCircle2, 
  ArrowLeft, 
  ShieldAlert, 
  ChevronDown, 
  BookOpen, 
  FileText, 
  UploadCloud,
  Check,
  Loader2
} from "lucide-react";
import { FormField } from "@/components/ui/FormField";
import { createClient } from "@/lib/supabase/client";

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
  const [isUploading, setIsUploading] = useState(false);
  const [formError, setFormError] = useState("");
  const [showGuidelines, setShowGuidelines] = useState(true);

  // The submitter's identity, pulled from their already-logged-in
  // account — no need to ask them to type it in again.
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setAuthorEmail(data.user.email ?? "");
        setAuthorName((data.user.user_metadata?.full_name as string) ?? "");
      }
    });
  }, []);

  // Interactive States
  const [selectedNoteTypes, setSelectedNoteTypes] = useState<string[]>([]);
  const [isOtherSelected, setIsOtherSelected] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<"EN" | "FR">("EN");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Checklist Interactive States
  const [isOriginalChecked, setIsOriginalChecked] = useState(false);
  const [isQualityChecked, setIsQualityChecked] = useState(false);
  const [isRulesChecked, setIsRulesChecked] = useState(false);

  const toggleNoteType = (type: string) => {
    setSelectedNoteTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");

    const formData = new FormData(e.currentTarget);
    const title = String(formData.get("title") ?? "").trim();
    const courseCode = String(formData.get("courseCode") ?? "").trim().toUpperCase().replace(/\s+/g, "");
    const courseName = String(formData.get("courseName") ?? "").trim();
    const professor = String(formData.get("professor") ?? "").trim();
    const comments = String(formData.get("comments") ?? "").trim();
    const otherType = String(formData.get("otherNoteType") ?? "").trim();

    if (!isOriginalChecked || !isQualityChecked || !isRulesChecked) {
      setFormError("Please check all confirmation boxes before submitting.");
      return;
    }

    if (!title) {
      setFormError("Please give your submission a descriptive title.");
      return;
    }

    if (!selectedFile) {
      setFormError("Please select a valid document file to upload.");
      return;
    }

    const compiledTypes = [...selectedNoteTypes];
    if (isOtherSelected && otherType) compiledTypes.push(otherType);

    if (compiledTypes.length === 0) {
      setFormError("Please select at least one note category.");
      return;
    }

    try {
      setIsUploading(true);

      // Step 1: request a presigned upload URL.
      const presignRes = await fetch("/api/notes/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: selectedFile.name,
          fileType: selectedFile.type || "application/pdf",
          fileSize: selectedFile.size,
        }),
      });

      const presignContentType = presignRes.headers.get("content-type");
      if (!presignContentType || !presignContentType.includes("application/json")) {
        throw new Error(`Server route error (${presignRes.status}). Expected JSON response.`);
      }

      const presignData = await presignRes.json();
      if (!presignRes.ok) {
        throw new Error(presignData.error || "Failed to generate storage authorization.");
      }

      const { uploadUrl, fileKey } = presignData;

      // Step 2: upload the actual file directly to storage.
      const r2UploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": selectedFile.type || "application/pdf",
        },
        body: selectedFile,
      });

      if (!r2UploadRes.ok) {
        throw new Error("Direct file upload to storage failed. Please check your connection.");
      }

      // Step 3: save the document's metadata to the database.
      const dbRes = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          courseCode,
          courseName,
          professor,
          authorName,
          authorEmail,
          language: selectedLanguage,
          noteTypes: compiledTypes,
          fileKey,
          fileSize: selectedFile.size,
          fileType: selectedFile.type || "application/pdf",
          comments,
        }),
      });

      const dbContentType = dbRes.headers.get("content-type");
      if (!dbContentType || !dbContentType.includes("application/json")) {
        throw new Error(`Database registration error (${dbRes.status}).`);
      }

      const dbData = await dbRes.json();
      if (!dbRes.ok) {
        throw new Error(dbData.error || "Failed to save document metadata.");
      }

      setIsSubmitted(true);
    } catch (err: any) {
      setFormError(err.message || "An unexpected error occurred during transmission.");
    } finally {
      setIsUploading(false);
    }
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
                          Review formatting rules and quality standards before uploading
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
                          <p><strong className="text-gray-900">Original Work Only:</strong> All documents must be authored by you. Direct uncredited copying from AI tools is strictly prohibited.</p>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-red text-white text-[10px] font-mono font-bold shrink-0 mt-0.5">2</span>
                          <p><strong className="text-gray-900">No Public Reshares:</strong> Do not upload third-party copyrighted coursepacks or publisher slides.</p>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-red text-white text-[10px] font-mono font-bold shrink-0 mt-0.5">3</span>
                          <p><strong className="text-gray-900">Zero Tolerance for Abuse:</strong> Placeholder or malicious submissions will result in immediate review and account suspension.</p>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-red text-white text-[10px] font-mono font-bold shrink-0 mt-0.5">4</span>
                          <p><strong className="text-gray-900">Scan Quality & Legibility:</strong> Ensure files are sharp, clear, and right-side up. Blurry screen captures, dark shadows, or unreadable notes will not pass moderation.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Form Section */}
                <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-8">

                  {/* SECTION 1: Document Categorization */}
                  <div className="space-y-4 bg-gray-50/60 p-5 sm:p-6 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-200/60">
                      <FileText className="w-4 h-4 text-brand-red" />
                      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-700">1. Document Classification</h3>
                    </div>

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
                    </div>

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

                      {isOtherSelected && (
                        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mt-2">
                          <input
                            type="text"
                            name="otherNoteType"
                            placeholder="Specify note type (e.g., Lab Manual, Quiz Bank)..."
                            className="w-full p-3.5 bg-white border border-gray-200 rounded-xl text-xs font-sans focus:outline-none focus:border-brand-red/50 shadow-2xs"
                            required={isOtherSelected}
                          />
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* SECTION 2: Course Context */}
                  <div className="space-y-4 bg-gray-50/60 p-5 sm:p-6 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-200/60">
                      <BookOpen className="w-4 h-4 text-brand-red" />
                      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-700">2. Course & Faculty Context</h3>
                    </div>

                    <FormField id="submit-title" label="Submission Title" name="title" type="text" placeholder="e.g. Midterm 1 Review: Binary Trees & Heaps" required />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField id="submit-course-code" label="Course Code" name="courseCode" type="text" placeholder="e.g. CSI2110" required />
                      <FormField id="submit-course-name" label="Full Course Name" name="courseName" type="text" placeholder="e.g. Data Structures" required />
                    </div>

                    <FormField id="submit-professor" label="Professor Name (Optional)" name="professor" type="text" placeholder="e.g. Dr. Amy Murtha" />
                  </div>

                  {/* SECTION 3: File Upload & Comments */}
                  <div className="space-y-4 bg-gray-50/60 p-5 sm:p-6 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-200/60">
                      <UploadCloud className="w-4 h-4 text-brand-red" />
                      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-700">3. Document Upload</h3>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-medium text-gray-600">PDF Document</label>
                      <label className="border-2 border-dashed border-gray-300 hover:border-brand-red/50 rounded-2xl p-8 text-center bg-white transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group">
                        <div className="w-10 h-10 rounded-full bg-brand-red/10 text-brand-red flex items-center justify-center group-hover:scale-105 transition-transform">
                          <FileUp className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-gray-800">
                          {selectedFile ? selectedFile.name : "Click to browse or drag & drop files here"}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">PDF documents up to 25MB</span>
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
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

                  {/* SECTION 4: Confirmation Checklists */}
                  <div className="space-y-4 pt-2">
                    <div className="flex flex-col gap-3">

                      <div
                        onClick={() => setIsOriginalChecked(!isOriginalChecked)}
                        className={`flex items-start gap-3.5 p-4 rounded-2xl border transition-all cursor-pointer ${
                          isOriginalChecked ? "bg-brand-red/5 border-brand-red shadow-2xs" : "bg-white border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                          isOriginalChecked ? "bg-brand-red border-brand-red text-white" : "border-gray-300 bg-white"
                        }`}>
                          {isOriginalChecked && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-gray-800 leading-snug">
                          I confirm that this is my original work and understand that proof of creation may be requested.
                        </span>
                      </div>

                      <div
                        onClick={() => setIsQualityChecked(!isQualityChecked)}
                        className={`flex items-start gap-3.5 p-4 rounded-2xl border transition-all cursor-pointer ${
                          isQualityChecked ? "bg-brand-red/5 border-brand-red shadow-2xs" : "bg-white border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                          isQualityChecked ? "bg-brand-red border-brand-red text-white" : "border-gray-300 bg-white"
                        }`}>
                          {isQualityChecked && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-gray-800 leading-snug">
                          I verify that my upload is sharp, fully legible, and free of blurriness, shadows, or cut-off pages.
                        </span>
                      </div>

                      <div
                        onClick={() => setIsRulesChecked(!isRulesChecked)}
                        className={`flex items-start gap-3.5 p-4 rounded-2xl border transition-all cursor-pointer ${
                          isRulesChecked ? "bg-brand-red/5 border-brand-red shadow-2xs" : "bg-white border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                          isRulesChecked ? "bg-brand-red border-brand-red text-white" : "border-gray-300 bg-white"
                        }`}>
                          {isRulesChecked && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-gray-800 leading-snug">
                          I have read and agree to all submission guidelines stated above.
                        </span>
                      </div>

                    </div>

                    {formError && (
                      <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs font-mono font-bold text-brand-red text-center">
                        {formError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isUploading}
                      className="w-full py-4 bg-brand-red text-white text-xs font-mono font-bold uppercase tracking-widest rounded-xl hover:bg-brand-red-hover transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Securely uploading notes...
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-4 h-4" />
                          Submit Notes for Review
                        </>
                      )}
                    </button>
                  </div>

                </form>
              </>
            ) : (
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