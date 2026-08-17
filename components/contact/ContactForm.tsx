"use client";
import { useState } from "react";

const inputClass = "w-full bg-white border border-brand-border-light rounded-md px-3.5 py-2.5 text-sm text-brand-dark placeholder:text-brand-muted focus:outline-none focus:border-brand-red transition-colors";

export function ContactForm() {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", message: "" });

  const handleChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Message from ${form.firstName} ${form.lastName}`.trim());
    const body = encodeURIComponent(`${form.message}\n\n${form.email}`);
    window.location.href = `mailto:uofonotes@gmail.com?subject=${subject}&body=${body}`;
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm text-brand-dark mb-1.5">First name</label>
          <input type="text" value={form.firstName} onChange={handleChange("firstName")} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm text-brand-dark mb-1.5">Last name</label>
          <input type="text" value={form.lastName} onChange={handleChange("lastName")} className={inputClass} />
        </div>
      </div>

      <div>
        <label className="block text-sm text-brand-dark mb-1.5">Email address</label>
        <input type="email" value={form.email} onChange={handleChange("email")} placeholder="example@email.com" className={inputClass} required />
      </div>

      <div>
        <label className="block text-sm text-brand-dark mb-1.5">Your message</label>
        <textarea value={form.message} onChange={handleChange("message")} placeholder="Enter your question or message." rows={8} className={`${inputClass} resize-none`} required />
      </div>

      <button type="submit" className="self-center w-full max-w-xs bg-brand-muted text-white text-sm font-semibold px-10 py-3 rounded-md transition-colors hover:opacity-90">
        Send
      </button>
    </form>
  );
}
