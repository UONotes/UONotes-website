"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, CheckCircle2, ArrowRight } from "lucide-react";

const inputClass = "w-full bg-[#fdfafb] border border-gray-200 rounded-xl px-4 py-3.5 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red transition-all shadow-xs font-sans";

export function ContactForm() {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const name = `${form.firstName} ${form.lastName}`.trim();

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email: form.email, message: form.message }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to send message.");
      }

      setIsSent(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-white/90 backdrop-blur-2xl rounded-3xl p-6 sm:p-10 shadow-[0_12px_32px_rgba(185,28,28,0.06)] border border-white/80 relative overflow-hidden">
      
      {/* Top accent badge */}
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-gray-100">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-brand-red font-bold block mb-1">
            // SECURE TRANSMISSION
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 font-sans uppercase tracking-tight">
            Send a message
          </h2>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-brand-red/10 flex items-center justify-center text-brand-red">
          <Send className="w-4 h-4" />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isSent ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center py-12 gap-4"
          >
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-1 shadow-inner">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 font-sans">Message delivered.</h3>
            <p className="text-xs sm:text-sm text-gray-600 max-w-xs font-light leading-relaxed">
              Thanks for reaching out — our team has received your submission and will get back to you shortly.
            </p>
            <button
              onClick={() => { setIsSent(false); setForm({ firstName: "", lastName: "", email: "", message: "" }); }}
              className="mt-4 px-5 py-2.5 bg-gray-900 text-white text-xs font-mono uppercase tracking-wider rounded-xl hover:bg-brand-red transition-colors shadow-sm"
            >
              Send another message
            </button>
          </motion.div>
        ) : (
          <motion.form 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onSubmit={handleSubmit} 
            className="flex flex-col gap-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-600 font-bold mb-2">First name</label>
                <input type="text" value={form.firstName} onChange={handleChange("firstName")} placeholder="John" className={inputClass} required />
              </div>
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-600 font-bold mb-2">Last name</label>
                <input type="text" value={form.lastName} onChange={handleChange("lastName")} placeholder="Doe" className={inputClass} required />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-600 font-bold mb-2">Student email</label>
              <input type="email" value={form.email} onChange={handleChange("email")} placeholder="example@uottawa.ca" className={inputClass} required />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-600 font-bold mb-2">Your message</label>
              <textarea value={form.message} onChange={handleChange("message")} placeholder="How can we help you today?" rows={5} className={`${inputClass} resize-none`} required />
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-mono text-brand-red text-center">
                {error}
              </motion.div>
            )}

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full mt-2 py-3.5 bg-brand-red text-white text-xs sm:text-sm font-mono uppercase tracking-widest rounded-xl hover:bg-brand-red-hover transition-all cursor-pointer shadow-md active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2 group"
            >
              <span>{isSubmitting ? "Transmitting..." : "Send message"}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}