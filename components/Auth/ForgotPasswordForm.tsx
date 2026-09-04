"use client";

import type { FormEvent } from "react";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { KeyRound, Lock, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isStrongPassword, PASSWORD_REQUIREMENTS_TEXT } from "@/lib/passwordValidation";
import { Field, IconChip, FooterTag, AuthSuccessState, AuthCard } from "./_authComponents";
import { STEP_TRANSITION } from "./authTransitions";

const AUTH_PATHS = ["/signin", "/signup", "/forgot-password", "/reset-password"];
const RESEND_COOLDOWN_SECONDS = 60;

function ForgotPasswordFormLogic() {
  const [step, setStep] = useState<"email" | "reset">("email");
  const [restored, setRestored] = useState(false);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [resetError, setResetError] = useState("");
  const [resendMessage, setResendMessage] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const fromParam = searchParams.get("from");
  const isSafeReturnPath =
    fromParam &&
    fromParam.startsWith("/") &&
    !fromParam.startsWith("//") &&
    !AUTH_PATHS.some((path) => fromParam.startsWith(path));
  const returnPath = isSafeReturnPath ? fromParam : "/";

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (!restored || !redirectPath) return;
    const timer = setTimeout(() => {
      router.refresh();
      router.replace(redirectPath);
    }, 900);
    return () => clearTimeout(timer);
  }, [restored, redirectPath, router]);

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const enteredEmail = String(formData.get("email") ?? "").trim();

    const isValidUOttawaEmail = /^[^\s@]+@uottawa\.ca$/i.test(enteredEmail);
    if (!isValidUOttawaEmail) {
      setEmailError("Invalid @uottawa.ca email");
      return;
    }
    setEmailError("");
    setIsSubmitting(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(enteredEmail);

    setIsSubmitting(false);

    if (error) {
      setEmailError(error.message);
      return;
    }

    setEmail(enteredEmail);
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
    setStep("reset");
  }

  async function handleResetSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const code = String(formData.get("code") ?? "").trim();
    const newPassword = String(formData.get("newPassword") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (code.length !== 8) {
      setResetError("Enter the 8-digit code from your email.");
      return;
    }
    if (!isStrongPassword(newPassword)) {
      setResetError(PASSWORD_REQUIREMENTS_TEXT);
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError("Passwords do not match.");
      return;
    }

    setResetError("");
    setIsSubmitting(true);

    const response = await fetch("/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code, newPassword }),
    });
    const result = await response.json();

    if (!response.ok) {
      setIsSubmitting(false);
      setResetError(result.error ?? "Something went wrong. Please try again.");
      return;
    }

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: newPassword });

    setRedirectPath(signInError ? "/signin" : returnPath);
    setRestored(true);
  }

  async function handleResendCode() {
    if (resendCooldown > 0) return;
    setResendMessage("");
    setResetError("");

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      setResendMessage(error.message || "Could not resend code. Please try again shortly.");
      return;
    }

    setResendCooldown(RESEND_COOLDOWN_SECONDS);
    setResendMessage("A new code has been sent.");
  }

  return (
    <AuthCard>
      <AnimatePresence mode="wait" initial={false}>
        {restored ? (
          <AuthSuccessState
            icon={<Lock className="w-6 h-6" />}
            eyebrow="// PASSWORD UPDATED"
            title="You're all set."
            subtitle="Taking you onward..."
          />
        ) : step === "reset" ? (
          <motion.div key="reset" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={STEP_TRANSITION}>
            <div className="flex flex-col items-center text-center mb-6">
              <div className="mb-3">
                <IconChip icon={<Lock className="w-6 h-6" />} />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-brand-red font-bold mb-1">
                // RESET PASSWORD
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 font-sans uppercase">
                Set a new password.
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 font-light mt-1 max-w-xs">
                Enter the 8-digit code sent to <span className="font-medium text-gray-900">{email}</span> along with your new password.
              </p>
            </div>

            <form onSubmit={handleResetSubmit} noValidate aria-label="Reset password" className="flex flex-col gap-3.5">
              <input
                id="reset-code"
                name="code"
                type="text"
                inputMode="numeric"
                maxLength={8}
                autoComplete="one-time-code"
                placeholder="E.G. 12345678"
                disabled={isSubmitting}
                autoFocus
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-300 text-center font-mono text-xs sm:text-sm tracking-widest uppercase focus:outline-none transition-all bg-gray-50/50 text-gray-900 focus:border-brand-red focus:ring-1 focus:ring-brand-red"
              />

              <Field id="reset-new-password" label="New password" name="newPassword" type="password" placeholder="••••••••" autoComplete="new-password" disabled={isSubmitting} required />
              <Field id="reset-confirm-password" label="Confirm new password" name="confirmPassword" type="password" placeholder="••••••••" autoComplete="new-password" disabled={isSubmitting} required />

              <AnimatePresence>
                {resetError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center justify-center gap-1.5 text-red-600 text-[11px] font-mono overflow-hidden text-center"
                  >
                    <span>{resetError}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-1.5 py-3 bg-gray-900 text-white text-xs font-mono uppercase tracking-widest rounded-xl hover:bg-brand-red transition-colors cursor-pointer shadow-md active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2 group"
              >
                <span>{isSubmitting ? "Updating password..." : "Update password"}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="flex flex-col items-center gap-1.5 mt-1">
                <button
                  type="button"
                  disabled={resendCooldown > 0}
                  onClick={handleResendCode}
                  className="text-[11px] font-mono uppercase tracking-wide text-brand-red hover:underline underline-offset-2 disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed transition-colors"
                >
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend code"}
                </button>
                {resendMessage && <p className="text-[11px] font-mono text-gray-500">{resendMessage}</p>}
              </div>

              <button
                type="button"
                className="text-[11px] font-mono uppercase tracking-wide text-gray-400 hover:text-brand-red transition-colors mx-auto"
                onClick={() => { setStep("email"); setResetError(""); setResendMessage(""); }}
              >
                Use a different email
              </button>
            </form>

            <FooterTag label="UONOTES // STUDENT ACCESS" />
          </motion.div>
        ) : (
          <motion.div key="email" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={STEP_TRANSITION}>
            <div className="flex flex-col items-center text-center mb-6">
              <div className="mb-3">
                <IconChip icon={<KeyRound className="w-6 h-6" />} />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-brand-red font-bold mb-1">
                // ACCOUNT RECOVERY
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 font-sans uppercase">
                Forgot password?
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 font-light mt-1 max-w-xs">
                Enter your student email and we&apos;ll send you a code to reset your password.
              </p>
            </div>

            <form onSubmit={handleEmailSubmit} noValidate aria-label="Request password reset" className="flex flex-col gap-3.5">
              <Field
                id="forgot-email"
                label="Student email"
                name="email"
                type="email"
                placeholder="example@uottawa.ca"
                autoComplete="email"
                onChange={() => emailError && setEmailError("")}
                error={emailError}
                disabled={isSubmitting}
                required
              />

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-1.5 py-3 bg-gray-900 text-white text-xs font-mono uppercase tracking-widest rounded-xl hover:bg-brand-red transition-colors cursor-pointer shadow-md active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2 group"
              >
                <span>{isSubmitting ? "Sending..." : "Send code"}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <p className="text-center text-[11px] font-mono uppercase tracking-wide text-gray-500">
                <Link href="/signin" className="hover:text-brand-red transition-colors">
                  Back to sign in
                </Link>
              </p>
            </form>

            <FooterTag label="UONOTES // STUDENT ACCESS" />
          </motion.div>
        )}
      </AnimatePresence>
    </AuthCard>
  );
}

export function ForgotPasswordForm() {
  return (
    <Suspense fallback={<div className="w-full max-w-lg h-[520px] rounded-3xl bg-white/50 animate-pulse" />}>
      <ForgotPasswordFormLogic />
    </Suspense>
  );
}