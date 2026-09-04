"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, Eye, EyeOff } from "lucide-react";

type FieldProps = {
  id: string;
  label: string;
  name: string;
  type?: "text" | "email" | "password";
  error?: string;
  hint?: ReactNode;
} & InputHTMLAttributes<HTMLInputElement>;

export function Field({ id, label, name, type = "text", error, hint, className, ...rest }: FieldProps) {
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === "password";

  return (
    <div>
      <label htmlFor={id} className="block text-[10px] font-mono uppercase tracking-[0.2em] text-gray-500 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={isPassword ? (revealed ? "text" : "password") : type}
          aria-invalid={error ? true : undefined}
          className={`w-full px-4 py-3 rounded-xl border text-sm bg-gray-50/50 focus:outline-none transition-all ${
            error
              ? "border-red-500 text-red-600 focus:ring-1 focus:ring-red-500"
              : "border-gray-300 text-gray-900 focus:border-brand-red focus:ring-1 focus:ring-brand-red"
          } ${isPassword ? "pr-10" : ""} ${className ?? ""}`}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setRevealed((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-red transition-colors"
            aria-label={revealed ? "Hide password" : "Show password"}
          >
            {revealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {hint}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-1.5 text-red-600 text-[11px] font-mono overflow-hidden"
          >
            <span className="flex items-center gap-1.5 pt-1.5">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              {error}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function IconChip({ icon, tone = "brand" }: { icon: ReactNode; tone?: "brand" | "emerald" }) {
  const toneClasses =
    tone === "emerald"
      ? "bg-emerald-50 border-emerald-200 text-emerald-600"
      : "bg-brand-red/10 border-brand-red/20 text-brand-red";
  return (
    <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center shadow-xs ${toneClasses}`}>
      {icon}
    </div>
  );
}

export function FooterTag({ label }: { label: string }) {
  return (
    <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-center">
      <span className="text-[10px] font-mono text-gray-400 tracking-wider">{label}</span>
    </div>
  );
}

/** Single, shared "it worked" screen — used by sign in, sign up, and password reset. */
export function AuthSuccessState({
  icon,
  eyebrow,
  title,
  subtitle,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <motion.div
      key="success"
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="flex flex-col items-center text-center py-10 gap-3"
    >
      <motion.div
        initial={{ scale: 0.6, rotate: -8 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.05 }}
      >
        <IconChip icon={icon} tone="emerald" />
      </motion.div>
      <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-emerald-600 font-bold">
        {eyebrow}
      </span>
      <h2 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900 font-sans uppercase">
        {title}
      </h2>
      <p className="text-xs text-gray-600 font-light">{subtitle}</p>
      <div className="flex gap-1.5 pt-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-emerald-400"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
          />
        ))}
      </div>
    </motion.div>
  );
}

/** Shared card shell — width, padding, and the resize animation live in one place. */
export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <motion.div
      layout
      transition={{ layout: { duration: 0.28, ease: "easeInOut" } }}
      className="w-full max-w-lg bg-white p-8 sm:p-10 rounded-3xl shadow-2xl border border-brand-red/15 relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 bottom-0 w-8 bg-gradient-to-r from-black/[0.03] to-transparent pointer-events-none" />
      {children}
    </motion.div>
  );
}