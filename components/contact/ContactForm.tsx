"use client";

import { useState } from "react";

const inputClass = "w-full bg-[#fdfafb] border border-brand-red/20 rounded-md px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red transition-all shadow-sm";

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

  if (isSent) {
    return (
      <div className="flex flex-col items-center text-center gap-3 bg-white p-8 rounded-2xl shadow-sm border border-brand-red/10 w-full">
        <h3 className="text-xl font-bold text-gray-900">Message sent!</h3>
        <p className="text-sm text-gray-600">Thanks for reaching out — we'll get back to you soon.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 bg-white p-8 rounded-2xl shadow-sm border border-brand-red/10 w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">First name</label>
          <input type="text" value={form.firstName} onChange={handleChange("firstName")} className={inputClass} required />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">Last name</label>
          <input type="text" value={form.lastName} onChange={handleChange("lastName")} className={inputClass} required />
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-2">Email address</label>
        <input type="email" value={form.email} onChange={handleChange("email")} placeholder="example@email.com" className={inputClass} required />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-2">Your message</label>
        <textarea value={form.message} onChange={handleChange("message")} placeholder="How can we help?" rows={6} className={`${inputClass} resize-none`} required />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-brand-red text-center">
          {error}
        </div>
      )}

      <button 
        type="submit" 
        disabled={isSubmitting}
        className="w-full bg-brand-red text-white text-base font-semibold px-8 py-3.5 rounded-md transition-transform hover:bg-brand-red/90 active:scale-[0.98] shadow-md mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Sending..." : "Send message"}
      </button>
    </form>
  );
}