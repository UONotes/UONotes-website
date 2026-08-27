"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FileUp, CheckCircle2, ArrowLeft, ShieldAlert, ChevronDown } from "lucide-react";
import { FormField } from "@/components/ui/FormField";

const notebookStyle = {
  backgroundImage: `
    linear-gradient(90deg, transparent 64px, rgba(168, 49, 66, 0.15) 64px, rgba(168, 49, 66, 0.15) 66px, transparent 66px),
    linear-gradient(transparent 31px, #e5e7eb 32px)
  `,
  backgroundSize: "100% 100%, 100% 32px",
};

export function SubmitFormView() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formError, setFormError] = useState("");
  const [showGuidelines, setShowGuidelines] = useState(true);

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
      className="w-full min-h-[calc(100vh-80px)] py-12 px-6 lg:px-12 flex flex-col items-center"
    >
      <div className="w-full max-w-4xl mx-auto flex flex-col gap-8">
        
        {/* Notebook Container */}
        <div 
          className="w-full bg-white p-8 sm:p-14 lg:p-16 rounded-3xl shadow-xl border border-brand-red/15 relative overflow-hidden"
          style={notebookStyle}
        >
          {/* Red Margin Line */}
          <div className="absolute top-0 bottom-0 left-16 sm:left-20 w-[2px] bg-[#a83142]/25 pointer-events-none z-0" />
          
          {/* Notebook Spine Shadow */}
          <div className="absolute top-0 left-0 bottom-0 w-10 sm:w-16 bg-gradient-to-r from-black/[0.04] to-transparent pointer-events-none z-10" />

          {/* Content Wrapper */}
          <div className="relative z-20 pl-8 sm:pl-12">

            {!isSubmitted ? (
              <>
                {/* Header */}
                <div className="mb-8 border-b border-gray-200/80 pb-6">
                  <span className="text-xs font-mono uppercase tracking-[0.3em] text-brand-red font-bold">
                    uOttawa // Resource Marketplace
                  </span>
                  <h1 className="text-4xl font-black tracking-tight font-sans text-gray-900 mt-1">
                    Submit Notes
                  </h1>
                </div>

                {/* Upgraded Collapsible Guidelines Box */}
                <div className="mb-10 bg-white border border-brand-red/20 rounded-2xl shadow-xs overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowGuidelines(!showGuidelines)}
                    className="w-full flex items-center justify-between p-5 bg-[#FFF0F0]/50 hover:bg-[#FFF0F0] transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-red/10 text-brand-red flex items-center justify-center shrink-0">
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-xs sm:text-sm font-bold font-logo text-brand-red tracking-wide uppercase">
                          Submission Guidelines & Academic Integrity
                        </h2>
                        <p className="text-[11px] text-gray-500 font-sans">
                          Mandatory reading requirements before uploading notes
                        </p>
                      </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-brand-red transition-transform duration-200 ${showGuidelines ? "rotate-180" : ""}`} />
                  </button>

                  {showGuidelines && (
                    <div className="p-6 border-t border-brand-red/10 space-y-4 text-xs sm:text-sm text-gray-700 leading-relaxed font-sans bg-white">
                      <div className="grid grid-cols-1 gap-3">
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-red text-white text-[10px] font-mono font-bold shrink-0 mt-0.5">1</span>
                          <p><strong className="text-gray-900">Original Work Only:</strong> All documents must be completely made by you. No content directly copied from Artificial Intelligence (AI) programs is permitted.</p>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-red text-white text-[10px] font-mono font-bold shrink-0 mt-0.5">2</span>
                          <p><strong className="text-gray-900">No Public Reshares:</strong> Do not submit documents publicly available online unless authored by you. Collaborative notes must credit colleagues in comments.</p>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-red text-white text-[10px] font-mono font-bold shrink-0 mt-0.5">3</span>
                          <p><strong className="text-gray-900">Zero Tolerance for Troll Notes:</strong> Void, placeholder, or malicious submissions will result in immediate review and potential account suspension.</p>
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-500 italic pt-2 border-t border-gray-100">
                        * Note: Suspected violations may require proof of creation. Repeated offenses can result in temporary or permanent bans from the UONotes platform.
                      </p>
                    </div>
                  )}
                </div>

                {/* Form Section */}
                <div>
                  <h2 className="text-xl font-bold font-logo text-brand-red tracking-wide mb-6">
                    Fill out the form in order to submit your notes.
                  </h2>

                  <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
                    
                    <FormField
                      id="submit-full-name"
                      label="Full Name"
                      name="fullName"
                      type="text"
                      placeholder="John Doe"
                      autoComplete="name"
                      required
                    />

                    <div>
                      <FormField
                        id="submit-email"
                        label="Student Email"
                        name="email"
                        type="email"
                        placeholder="example@uottawa.ca"
                        autoComplete="email"
                        required
                      />
                    </div>

                    {/* Language Selection */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-mono font-bold uppercase tracking-wider text-gray-700">Language</label>
                      <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                          <input type="radio" name="language" value="EN" defaultChecked className="accent-brand-red" />
                          English
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                          <input type="radio" name="language" value="FR" className="accent-brand-red" />
                          French
                        </label>
                      </div>
                    </div>

                    {/* Type of Notes */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-mono font-bold uppercase tracking-wider text-gray-700">Type of Notes</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {["Midterm Notes", "Final Notes", "Review Notes", "Full Course"].map((type) => (
                          <label key={type} className="flex items-center gap-2 text-xs text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-200 cursor-pointer hover:border-brand-red/40 transition-colors">
                            <input type="checkbox" name="noteTypes" value={type} className="accent-brand-red" />
                            {type}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <FormField id="submit-course-code" label="Course Code" name="courseCode" type="text" placeholder="e.g. CSI2110" required />
                      <FormField id="submit-course-name" label="Full Course Name" name="courseName" type="text" placeholder="e.g. Data Structures" required />
                    </div>

                    {/* Upload File Input */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-mono font-bold uppercase tracking-wider text-gray-700">Upload notes</label>
                      <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer">
                        <input type="file" name="noteFile" className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-mono file:font-bold file:bg-brand-red file:text-white hover:file:bg-brand-red-hover file:cursor-pointer" required />
                      </div>
                    </div>

                    {/* Comments */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-mono font-bold uppercase tracking-wider text-gray-700">Comments</label>
                      <textarea
                        name="comments"
                        rows={3}
                        placeholder="Anything we should know before reviewing your notes?"
                        className="w-full p-4 bg-white border border-gray-200 rounded-xl text-xs font-sans focus:outline-none focus:border-brand-red/50 transition-colors shadow-xs resize-none"
                      />
                    </div>

                    {/* Checkboxes & Error */}
                    <div className="flex flex-col gap-3 pt-2">
                      <label className="flex items-start gap-3 text-xs text-gray-700 cursor-pointer">
                        <input type="checkbox" name="isOriginal" className="mt-0.5 accent-brand-red" required />
                        I confirm that this is my original work and understand that I may be requested to provide proof if its suspected that submission isn&apos;t my work.
                      </label>
                      <label className="flex items-start gap-3 text-xs text-gray-700 cursor-pointer">
                        <input type="checkbox" name="confirmRules" className="mt-0.5 accent-brand-red" required />
                        I have read all the rules above before submitting.
                      </label>
                      {formError && (
                        <p className="text-xs font-mono font-bold text-brand-red mt-1">{formError}</p>
                      )}
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4">
                      <button
                        type="submit"
                        className="w-full py-4 bg-brand-red text-white text-xs font-mono font-bold uppercase tracking-widest rounded-xl hover:bg-brand-red-hover transition-all shadow-md active:scale-95 cursor-pointer"
                      >
                        Submit
                      </button>
                    </div>

                  </form>
                </div>
              </>
            ) : (
              /* Success Confirmation View */
              <div className="py-12 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-6 shadow-inner">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                
                <span className="text-xs font-mono uppercase tracking-[0.3em] text-emerald-600 font-bold mb-2">
                  Successfully Uploaded
                </span>
                
                <h2 className="text-3xl font-black tracking-tight font-sans text-gray-900 mb-4">
                  The following document has been received
                </h2>
                
                <p className="text-sm text-gray-600 max-w-md mb-8 leading-relaxed">
                  You will be sent an e-mail regarding the status of your notes once reviewed by our team.
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