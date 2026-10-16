"use client";

import { useState, type ReactNode } from "react";
import { motion, Variants } from "framer-motion";
import { Mail, Copy, Check, ArrowUpRight } from "lucide-react";
import { ContactForm } from "./ContactForm";

// ─── Contact details (edit here) ─────────────────────────────────────────────
const CLUB_EMAIL = "uofonotes@gmail.com";
const SOCIALS = [
  { label: "Instagram", handle: "@uonotes", href: "https://instagram.com/uonotes", icon: "instagram" },
  { label: "TikTok", handle: "@uo_notes", href: "https://www.tiktok.com/@uo_notes", icon: "tiktok" },
  { label: "LinkedIn", handle: "UONotes", href: "https://www.linkedin.com/company/uonotes/", icon: "linkedin" },
] as const;
const PRESIDENT = { name: "Kiana Gholizadeh Vazvani", role: "President", email: "Kiavazvani@gmail.com" };
// ─────────────────────────────────────────────────────────────────────────────

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const LABEL = "font-mono text-[10px] font-bold uppercase tracking-[0.2em]";

function SocialIcon({ name }: { name: (typeof SOCIALS)[number]["icon"] }) {
  const paths = {
    instagram:
      "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z",
    tiktok:
      "M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z",
    linkedin:
      "M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z",
  };
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
}

// Small square that holds an icon (same red tint everywhere)
function IconBox({ children }: { children: ReactNode }) {
  return <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-brand-red/10 text-brand-red">{children}</span>;
}

// An email address you can click to open your mail app, with a copy button beside it
function EmailRow({ email, label }: { email: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked: the mailto link still works */
    }
  };
  return (
    <div className="group flex items-center gap-3">
      <IconBox>
        <Mail className="h-4 w-4" />
      </IconBox>
      <a href={`mailto:${email}`} className="min-w-0 flex-1">
        <span className={`${LABEL} block text-gray-400`}>{label}</span>
        <span className="block break-all text-[13px] font-bold text-gray-900 transition-colors group-hover:text-brand-red min-[400px]:text-sm sm:text-[15px]">{email}</span>
      </a>
      <button
        type="button"
        onClick={copy}
        aria-label={`Copy ${email}`}
        className={`flex h-9 shrink-0 items-center gap-1.5 border px-2.5 text-[10px] transition-colors ${LABEL} ${
          copied ? "border-brand-red bg-brand-red text-white" : "border-gray-200 text-gray-500 hover:border-brand-red/40 hover:text-brand-red"
        }`}
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
      </button>
    </div>
  );
}

// A lined "rolodex" card with a red top edge and the little notch at the bottom
function RoloCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div
      className="relative bg-white px-5 pb-6 pt-4 shadow-[0_12px_20px_-12px_rgba(0,0,0,0.3)] sm:px-6"
      style={{ borderTop: "4px solid #8a1c24" }}
    >
      <p className={`${LABEL} mb-4 text-brand-red`}>{title}</p>
      {children}
      {/* Rolodex notch */}
      <span aria-hidden="true" className="absolute -bottom-px left-1/2 h-2.5 w-12 -translate-x-1/2 rounded-t-full bg-[#FFF0F0]" />
    </div>
  );
}

export function ContactSection() {
  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="mx-auto flex min-h-[calc(100dvh-100px)] w-full max-w-site flex-col justify-center px-6 py-12 lg:px-8 lg:py-20"
    >
      <div className="flex w-full flex-col items-start justify-between gap-12 lg:flex-row lg:gap-10">
        {/* Left: intro + contact cards */}
        <motion.div variants={fadeUp} className="flex w-full max-w-lg flex-col lg:w-[45%]">
          <p className={`${LABEL} mb-3 text-brand-red`}>Contact</p>
          <h1 className="mb-4 font-logo text-4xl font-black tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            Let&apos;s talk <br /> <span className="text-brand-red">UONotes.</span>
          </h1>
          <p className="mb-9 max-w-md font-sans text-sm leading-relaxed text-gray-600 sm:text-base">
            Have a question about submitting notes, earning volunteer hours, joining our campus team, or sponsorships? Reach out and we&apos;ll get back to
            you promptly.
          </p>

          <div className="flex w-full flex-col gap-6">
            {/* Official channels */}
            <RoloCard title="Official channels">
              <EmailRow email={CLUB_EMAIL} label="Email" />
              <div className="mt-4 grid grid-cols-1 gap-2 border-t border-dashed border-brand-red/20 pt-4 sm:grid-cols-3">
                {SOCIALS.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-2.5 border border-transparent p-1.5 transition-colors hover:border-brand-red/20 hover:bg-brand-red/5"
                  >
                    <IconBox>
                      <SocialIcon name={s.icon} />
                    </IconBox>
                    <span className="min-w-0">
                      <span className={`${LABEL} block text-[9px] text-gray-400`}>{s.label}</span>
                      <span className="flex items-center gap-0.5 truncate text-sm font-bold text-gray-900 group-hover:text-brand-red">
                        {s.handle}
                        <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                      </span>
                    </span>
                  </a>
                ))}
              </div>
            </RoloCard>

            {/* President */}
            <RoloCard title="Executive leadership">
              <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-lg font-black leading-tight text-gray-900">{PRESIDENT.name}</span>
                <span className={`${LABEL} bg-brand-red px-2 py-1 text-[9px] text-white`}>{PRESIDENT.role}</span>
              </div>
              <EmailRow email={PRESIDENT.email} label="Direct email" />
            </RoloCard>
          </div>
        </motion.div>

        {/* Right: the form */}
        <motion.div variants={fadeUp} className="flex w-full justify-end lg:w-[50%]">
          <div className="w-full max-w-xl">
            <ContactForm />
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}