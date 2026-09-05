"use client";

import type { FormEvent } from "react";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Mail, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isStrongPassword, PASSWORD_REQUIREMENTS_TEXT } from "@/lib/passwordValidation";
import { Field, IconChip, FooterTag, AuthSuccessState, AuthCard } from "./_authComponents";

const AUTH_PATHS = ["/signin", "/signup", "/forgot-password", "/reset-password"];
const RESEND_COOLDOWN_SECONDS = 60;

function scorePassword(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(score, 4);
}

const STRENGTH_LABEL = ["", "WEAK", "FAIR", "GOOD", "STRONG"];
const STRENGTH_COLOR = ["", "bg-red-500", "bg-amber-500", "bg-emerald-500", "bg-emerald-500"];

function PasswordStrengthMeter({ password }: { password: string }) {
  const score = scorePassword(password);
  return (
    <AnimatePresence>
      {password && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }} 
          animate={{ opacity: 1, height: "auto" }} 
          exit={{ opacity: 0, height: 0 }} 
          className="overflow-hidden"
        >
          <div className="flex gap-1 pt-2">
            {[0, 1, 2, 3].map((i) => (
              <span 
                key={i} 
                className={`h-[3px] flex-1 rounded-full transition-colors duration-300 ${i < score ? STRENGTH_COLOR[score] : "bg-gray-200"}`} 
              />
            ))}
          </div>
          <p className="pt-1 text-[10px] font-mono tracking-wide text-gray-400">{STRENGTH_LABEL[score]}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SignUpFormLogic() {
  const [step, setStep] = useState<"details" | "code">("details");
  const [verified, setVerified] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [formError, setFormError] = useState("");
  const [codeError, setCodeError] = useState("");
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
    if (!verified) return;
    // Hard reload to sync server-side cookies set by /verify-signup.
    // 900ms allows the success animation to play out before the reload.
    const timer = setTimeout(() => { window.location.href = returnPath; }, 900);
    return () => clearTimeout(timer);
  }, [verified, returnPath]);

  async function handleDetailsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const formData = new FormData(event.currentTarget);
    const fullName = String(formData.get("fullName") ?? "").trim();
    const enteredEmail = String(formData.get("email") ?? "").trim();
    const submittedPassword = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    const isValidUOttawaEmail = /^[^\s@]+@uottawa\.ca$/i.test(enteredEmail);
    if (!isValidUOttawaEmail) {
      setEmailError("Please enter a valid @uottawa.ca email address.");
      return;
    }
    setEmailError("");

    const hasOnlyAllowedCharacters = /^[\p{L}\s.'-]+$/u.test(fullName);
    if (!hasOnlyAllowedCharacters) {
      setFormError("Name can only contain letters, spaces, and basic punctuation.");
      return;
    }

    if (!isStrongPassword(submittedPassword)) {
      setFormError(PASSWORD_REQUIREMENTS_TEXT);
      return;
    }

    if (submittedPassword !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: enteredEmail,
      password: submittedPassword,
      options: { data: { full_name: fullName } },
    });

    setIsSubmitting(false);

    if (error) {
      setFormError(error.message);
      return;
    }

    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setFormError("An account with this email already exists. Try signing in instead.");
      return;
    }

    setEmail(enteredEmail);
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
    setStep("code");
  }

  async function handleCodeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const code = String(formData.get("code") ?? "").trim();

    if (code.length !== 8) {
      setCodeError("Enter the 8-digit code from your email.");
      return;
    }
    setCodeError("");
    setIsSubmitting(true);

    const response = await fetch("/verify-signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    
    const result = await response.json();

    if (!response.ok) {
      setIsSubmitting(false);
      setCodeError(result.error ?? "That code is incorrect or has expired. Request a new one below.");
      return;
    }

    // Explicitly clear submission state so the button doesn't freeze during the 900ms timeout
    setIsSubmitting(false);
    setVerified(true);
  }

  async function handleResendCode() {
    if (resendCooldown > 0) return;
    setResendMessage("");
    setCodeError("");

    const supabase = createClient();
    const { error } = await supabase.auth.resend({ type: "signup", email });

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
        {verified ? (
          <motion.div 
            key="success" // CRITICAL: This was missing and caused the freezing
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            transition={{ duration: 0.2 }}
          >
            <AuthSuccessState
              icon={<UserPlus className="w-6 h-6" />}
              eyebrow="// ACCOUNT VERIFIED"
              title="You're in."
              subtitle="Taking you to your dashboard..."
            />
          </motion.div>
        ) : step === "code" ? (
          <motion.div 
            key="code" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            transition={{ duration: 0.2 }}
          >
            <div className="flex flex-col items-center text-center mb-6 sm:mb-8">
              <div className="mb-3">
                <IconChip icon={<Mail className="w-6 h-6" />} />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-brand-red font-bold mb-1">
                // VERIFY EMAIL
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 font-sans uppercase">
                Check your inbox.
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 font-light mt-1 max-w-xs sm:max-w-sm">
                We sent an 8-digit code to <span className="font-medium text-gray-900">{email}</span>.
              </p>
            </div>

            <form onSubmit={handleCodeSubmit} className="flex flex-col gap-3.5 sm:gap-4">
              <div>
                <input
                  id="signup-code"
                  name="code"
                  type="text"
                  inputMode="numeric"
                  maxLength={8}
                  autoComplete="one-time-code"
                  placeholder="E.G. 12345678"
                  onChange={() => codeError && setCodeError("")}
                  disabled={isSubmitting}
                  autoFocus
                  required
                  className={`w-full px-4 py-3 rounded-xl border text-center font-mono text-xs sm:text-sm tracking-widest uppercase focus:outline-none transition-all bg-gray-50/50 ${
                    codeError ? "border-red-500 text-red-600 focus:ring-1 focus:ring-red-500" : "border-gray-300 focus:border-brand-red focus:ring-1 focus:ring-brand-red text-gray-900"
                  }`}
                />
                <AnimatePresence>
                  {codeError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center justify-center gap-1.5 text-red-600 text-[11px] font-mono overflow-hidden pt-2"
                    >
                      <span>{codeError}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-1.5 py-3 sm:py-3.5 bg-gray-900 text-white text-xs sm:text-sm font-mono uppercase tracking-widest rounded-xl hover:bg-brand-red transition-colors cursor-pointer shadow-md active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2 group"
              >
                <span>{isSubmitting ? "Verifying..." : "Verify and continue"}</span>
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
                onClick={() => { setStep("details"); setCodeError(""); setResendMessage(""); }}
              >
                Use a different email
              </button>
            </form>

            <FooterTag label="UONOTES // STUDENT ACCESS" />
          </motion.div>
        ) : (
          <motion.div 
            key="details" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            transition={{ duration: 0.2 }}
          >
            <div className="flex flex-col items-center text-center mb-6 sm:mb-8">
              <div className="mb-3">
                <IconChip icon={<UserPlus className="w-6 h-6" />} />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-brand-red font-bold mb-1">
                // NEW MEMBER
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 font-sans uppercase">
                Join UONotes.
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 font-light mt-1 max-w-xs sm:max-w-sm">
                Gain access to bilingual resources. Share notes, help students, earn volunteer hours.
              </p>
            </div>

            <form onSubmit={handleDetailsSubmit} noValidate aria-label="Create a UONotes account" className="flex flex-col gap-3.5 sm:gap-4">
              <Field id="signup-full-name" label="Full name" name="fullName" type="text" placeholder="John Doe" autoComplete="name" disabled={isSubmitting} required />

              <Field
                id="signup-email"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                <Field
                  id="signup-password"
                  label="Password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  onChange={(e) => setPassword(e.target.value)}
                  hint={<PasswordStrengthMeter password={password} />}
                  disabled={isSubmitting}
                  required
                />
                <Field id="signup-confirm-password" label="Confirm password" name="confirmPassword" type="password" placeholder="••••••••" autoComplete="new-password" disabled={isSubmitting} required />
              </div>

              <AnimatePresence>
                {formError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center justify-center gap-1.5 text-red-600 text-[11px] font-mono overflow-hidden text-center"
                  >
                    <span>{formError}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-1.5 py-3 sm:py-3.5 bg-gray-900 text-white text-xs sm:text-sm font-mono uppercase tracking-widest rounded-xl hover:bg-brand-red transition-colors cursor-pointer shadow-md active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2 group"
              >
                <span>{isSubmitting ? "Creating account..." : "Create account"}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <p className="text-center text-[11px] font-mono uppercase tracking-wide text-gray-500">
                Already a member?{" "}
                <Link href="/signin" className="text-brand-red hover:underline underline-offset-2">Sign in</Link>
              </p>
            </form>

            <FooterTag label="UONOTES // STUDENT ACCESS" />
          </motion.div>
        )}
      </AnimatePresence>
    </AuthCard>
  );
}

export function SignUpForm() {
  return (
    <Suspense fallback={<div className="w-full max-w-lg h-[560px] rounded-3xl bg-white/50 animate-pulse" />}>
      <SignUpFormLogic />
    </Suspense>
  );
}