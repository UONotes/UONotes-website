"use client";

import type { FormEvent } from "react";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Field, IconChip, FooterTag, AuthSuccessState, AuthCard } from "./_authComponents";
import { STEP_TRANSITION, REDIRECT_DELAY_MS } from "./authTransitions";

const AUTH_PATHS = ["/signin", "/signup", "/forgot-password", "/reset-password"];
const WHITELISTED_EMAILS = ["kwab822@gmail.com"];

function SignInFormLogic() {
  const [loginError, setLoginError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [firstName, setFirstName] = useState("");
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
    if (!succeeded) return;
    const timer = setTimeout(() => {
      router.refresh();
      router.replace(returnPath);
    }, REDIRECT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [succeeded, returnPath, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError("");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");

    const isUOttawaEmail = /^[^\s@]+@uottawa\.ca$/i.test(email);
    const isWhitelisted = WHITELISTED_EMAILS.includes(email);

    if (!isUOttawaEmail && !isWhitelisted) {
      setLoginError("Please use a valid @uottawa.ca email.");
      return;
    }

    setIsSubmitting(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setIsSubmitting(false);
      setLoginError("Invalid email or password.");
      return;
    }

    // Extract the first name from user metadata if available
    const fullName = data.user?.user_metadata?.full_name;
    if (fullName) {
      const first = String(fullName).trim().split(" ")[0];
      setFirstName(first);
    }

    setIsSubmitting(false); 
    setSucceeded(true);
  }

  return (
    <AuthCard>
      <AnimatePresence mode="wait" initial={false}>
        {succeeded ? (
          <motion.div
            key="success"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={STEP_TRANSITION}
          >
            <AuthSuccessState
              icon={<LogIn className="w-6 h-6" />}
              eyebrow="// ACCESS GRANTED"
              title={firstName ? `Welcome back, ${firstName}.` : "Welcome back."}
              subtitle="Taking you to your dashboard..."
            />
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={STEP_TRANSITION}
          >
            <div className="flex flex-col items-center text-center mb-6">
              <div className="mb-3">
                <IconChip icon={<LogIn className="w-6 h-6" />} />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-brand-red font-bold mb-1">
                // MEMBER SIGN IN
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 font-sans uppercase">
                Welcome back.
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 font-light mt-1 max-w-xs">
                Log in to access and share uOttawa student notes.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate aria-label="Log in to UONotes" className="flex flex-col gap-3.5">
              <Field
                id="signin-email"
                label="Student email"
                name="email"
                type="email"
                placeholder="example@uottawa.ca"
                autoComplete="email"
                onChange={() => loginError && setLoginError("")}
                disabled={isSubmitting}
                required
              />

              <Field
                id="signin-password"
                label="Password"
                name="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                error={loginError}
                disabled={isSubmitting}
                required
              />

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-1.5 py-3 bg-gray-900 text-white text-xs font-mono uppercase tracking-widest rounded-xl hover:bg-brand-red transition-colors cursor-pointer shadow-md active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2 group"
              >
                <span>{isSubmitting ? "Signing in..." : "Sign in"}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="flex items-center justify-center gap-3 text-[11px] font-mono uppercase tracking-wide text-gray-500 pt-1">
                <Link
                  href={`/forgot-password?from=${encodeURIComponent(returnPath)}`}
                  prefetch={false}
                  className="hover:text-brand-red transition-colors"
                >
                  Forgot password
                </Link>
                <span className="text-gray-300">/</span>
                <Link
                  href={`/signup?from=${encodeURIComponent(returnPath)}`}
                  prefetch={false}
                  className="hover:text-brand-red transition-colors"
                >
                  Create account
                </Link>
              </div>
            </form>

            <FooterTag label="UONOTES // STUDENT ACCESS" />
          </motion.div>
        )}
      </AnimatePresence>
    </AuthCard>
  );
}

export function SignInForm() {
  return (
    <Suspense fallback={<div className="w-full h-[480px] rounded-3xl bg-white/50 animate-pulse" />}>
      <SignInFormLogic />
    </Suspense>
  );
}