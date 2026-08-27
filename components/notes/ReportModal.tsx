"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Flag, CheckCircle2 } from "lucide-react";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentTitle: string;
}

const reportReasons = [
  "Document is uploaded in the wrong course.",
  "The title or description is wrong.",
  "Bad quality (Hard to read, blurry, scanned pages, spelling errors, etc.).",
  "Incomplete (Missing pages or content).",
  "Use of artificial intelligence (AI) (Suspected use of generative AI, not the student's own work).",
  "Website issues (Document is missing, not loading, etc.).",
];

export function ReportModal({ isOpen, onClose, documentTitle }: ReportModalProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [comment, setComment] = useState("");
  const [isSent, setIsSent] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedReason) return;
    
    // You can process the selectedReason and comment here
    console.log("Report submitted:", { reason: selectedReason, comment });
    setIsSent(true);
  }

  function handleReset() {
    setIsSent(false);
    setSelectedReason("");
    setComment("");
    onClose();
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] isolate flex items-center justify-center p-4">
          
          {/* Backdrop with clean blur covering the entire viewport */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative bg-white p-6 sm:p-8 rounded-3xl shadow-2xl max-w-lg w-full border border-brand-red/15 overflow-hidden z-10 max-h-[90vh] flex flex-col"
          >
            {!isSent ? (
              <>
                <div className="flex justify-between items-center mb-5 border-b border-gray-100 pb-4 shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-brand-red/10 text-brand-red flex items-center justify-center">
                      <Flag className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold font-logo text-brand-red">Report Document</h3>
                      <p className="text-[11px] text-gray-500 truncate max-w-[260px]">Target: {documentTitle}</p>
                    </div>
                  </div>
                  <button onClick={onClose} className="p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-brand-red hover:text-white transition-colors cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-y-auto pr-1">
                  <div className="space-y-2.5">
                    <label className="text-xs font-mono font-bold uppercase tracking-wider text-gray-500 block">Select reason for reporting:</label>
                    {reportReasons.map((reason, idx) => (
                      <label key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100 cursor-pointer hover:border-brand-red/40 transition-colors">
                        <input
                          type="radio"
                          name="reportReason"
                          value={reason}
                          checked={selectedReason === reason}
                          onChange={() => setSelectedReason(reason)}
                          className="mt-0.5 accent-brand-red shrink-0"
                          required
                        />
                        <span>{reason}</span>
                      </label>
                    ))}
                  </div>

                  {/* Additional Comments Textarea */}
                  <div className="flex flex-col gap-1.5 pt-2">
                    <label className="text-xs font-mono font-bold uppercase tracking-wider text-gray-500">
                      Additional Comments <span className="font-normal text-gray-400">(Optional)</span>
                    </label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={3}
                      placeholder="Provide any extra details or context regarding the issue..."
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs font-sans focus:outline-none focus:border-brand-red/50 transition-colors shadow-xs resize-none text-gray-800"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 mt-2 pt-4 border-t border-gray-100 shrink-0">
                    <button type="button" onClick={onClose} className="px-5 py-2.5 bg-gray-100 text-gray-700 text-xs font-mono font-bold uppercase rounded-xl hover:bg-gray-200 transition-colors cursor-pointer">
                      Cancel
                    </button>
                    <button type="submit" disabled={!selectedReason} className="px-6 py-2.5 bg-brand-red text-white text-xs font-mono font-bold uppercase rounded-xl hover:bg-brand-red-hover transition-all shadow-sm disabled:opacity-50 cursor-pointer">
                      Submit Report
                    </button>
                  </div>
                </form>
              </>
            ) : (
              /* Report Confirmation View */
              <div className="py-8 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black font-sans text-gray-900 mb-2">Your report has been sent.</h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-8 leading-relaxed">
                  Our team will review the document and your comments shortly. Thank you for maintaining resource quality.
                </p>
                <button onClick={handleReset} className="px-8 py-3 bg-brand-red text-white text-xs font-mono font-bold uppercase tracking-widest rounded-xl hover:bg-brand-red-hover transition-all shadow-md cursor-pointer">
                  Close
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}