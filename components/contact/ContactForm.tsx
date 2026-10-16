"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Caveat } from "next/font/google";

const caveat = Caveat({ subsets: ["latin"], weight: ["700"] });

const LABEL = "mb-2 block font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500";
const inputClass =
  "w-full border border-gray-200 bg-white px-4 py-3.5 font-sans text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-brand-red focus:outline-none focus:ring-1 focus:ring-brand-red";

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
    } catch (err) {
      setError((err instanceof Error && err.message) || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // Taped index card with a red rule under the header
    <div className="relative w-full bg-white px-6 pb-8 shadow-[0_26px_40px_-24px_rgba(0,0,0,0.4)] sm:px-9 sm:pb-10">
      <span aria-hidden="true" className="absolute -top-3 left-1/2 h-6 w-24 -translate-x-1/2 bg-brand-red/20" />

      {/* Header */}
      <div className="-mx-6 mb-7 flex h-[68px] items-center justify-between border-b-2 border-[#e39aa1] px-6 sm:-mx-9 sm:px-9">
        <h2 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-gray-900 sm:text-sm">Send a message</h2>
        <span className={`${caveat.className} text-xl font-bold text-brand-red sm:text-2xl`}>we read every one!</span>
      </div>

      <AnimatePresence mode="wait">
        {isSent ? (
          <motion.div
            key="sent"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4 py-10 text-center"
          >
            {/* "Sent" rubber stamp */}
            <motion.span
              initial={{ scale: 1.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 14 }}
              className="border-[3px] border-brand-red px-5 py-2 font-mono text-xl font-bold uppercase tracking-[0.2em] text-brand-red"
            >
              Sent &#10003;
            </motion.span>
            <h3 className="mt-2 font-sans text-xl font-bold text-gray-900">Message delivered.</h3>
            <p className="max-w-xs text-sm leading-relaxed text-gray-600">
              Thanks for reaching out — our team has received your message and will get back to you shortly.
            </p>
            <button
              onClick={() => {
                setIsSent(false);
                setForm({ firstName: "", lastName: "", email: "", message: "" });
              }}
              className="mt-3 border-2 border-dashed border-brand-red px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-[0.16em] text-brand-red transition-colors hover:border-solid hover:bg-brand-red hover:text-white"
            >
              Send another message
            </button>
          </motion.div>
        ) : (
          <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className={LABEL}>First name</label>
                <input id="firstName" type="text" value={form.firstName} onChange={handleChange("firstName")} placeholder="Jane" className={inputClass} required />
              </div>
              <div>
                <label htmlFor="lastName" className={LABEL}>Last name</label>
                <input id="lastName" type="text" value={form.lastName} onChange={handleChange("lastName")} placeholder="Doe" className={inputClass} required />
              </div>
            </div>

            <div>
              <label htmlFor="email" className={LABEL}>Student email</label>
              <input id="email" type="email" value={form.email} onChange={handleChange("email")} placeholder="example@uottawa.ca" className={inputClass} required />
            </div>

            <div>
              <label htmlFor="message" className={LABEL}>Your message</label>
              <textarea
                id="message"
                value={form.message}
                onChange={handleChange("message")}
                placeholder="How can we help you today?"
                rows={6}
                className={`${inputClass} resize-none`}
                required
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="border border-brand-red/30 bg-brand-red/5 p-3 text-center font-mono text-xs text-brand-red"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="group mt-1 flex w-full items-center justify-center gap-2 bg-brand-red py-4 font-mono text-xs font-bold uppercase tracking-[0.2em] text-white shadow-md transition-all hover:bg-brand-red-hover active:scale-[0.98] disabled:opacity-70 sm:text-sm"
            >
              <span>{isSubmitting ? "Sending..." : "Send message"}</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}