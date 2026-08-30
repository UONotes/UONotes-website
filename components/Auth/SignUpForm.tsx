"use client";

import type { FormEvent } from "react";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormField } from "@/components/ui/FormField";
import { createClient } from "@/lib/supabase/client";
import { isStrongPassword, PASSWORD_REQUIREMENTS_TEXT } from "@/lib/passwordValidation";

const AUTH_PATHS = ["/signin", "/signup", "/forgot-password", "/reset-password"];
const RESEND_COOLDOWN_SECONDS = 60;

function SignUpFormLogic() {
  const [step, setStep] = useState<"details" | "code">("details");
  const [email, setEmail] = useState("");
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

  async function handleDetailsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const formData = new FormData(event.currentTarget);
    const fullName = String(formData.get("fullName") ?? "").trim();
    const enteredEmail = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
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

    if (!isStrongPassword(password)) {
      setFormError(PASSWORD_REQUIREMENTS_TEXT);
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: enteredEmail,
      password,
      options: {
        data: { full_name: fullName },
      },
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

    setIsSubmitting(false);

    if (!response.ok) {
      setCodeError(result.error ?? "That code is incorrect or has expired. Request a new one below.");
      return;
    }

    // A full reload (not router.replace) is needed here: the session
    // cookie was set server-side by /verify-signup, but this browser's
    // already-running Supabase client has no way to notice that on its
    // own. Reloading forces everything — middleware, the Supabase
    // client, Navbar — to re-initialize against the real, current cookies.
    window.location.href = returnPath;
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

  if (step === "code") {
    return (
      <div key="code-step" className="w-full flex flex-col">
        <h1 className="text-center font-logo text-3xl font-bold leading-tight text-brand-red mb-2">
          Verify your email
        </h1>
        <p className="text-center text-sm text-gray-600 mb-8">
          We sent an 8-digit code to <span className="font-semibold text-gray-900">{email}</span>.
        </p>

        <form onSubmit={handleCodeSubmit} noValidate aria-label="Enter confirmation code" className="flex flex-col gap-5">
          <div>
            <FormField
              id="signup-code"
              label="8-Digit Code"
              name="code"
              type="text"
              inputMode="numeric"
              placeholder="12345678"
              maxLength={8}
              autoComplete="one-time-code"
              aria-invalid={codeError ? true : undefined}
              onChange={() => codeError && setCodeError("")}
              required
            />
            {codeError && <p className="mt-2 text-xs font-medium text-brand-red">{codeError}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-4 bg-brand-red text-white text-base font-semibold px-8 py-3.5 rounded-md transition-transform hover:bg-brand-red/90 active:scale-[0.98] shadow-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Verifying..." : "Verify and continue"}
          </button>

          <div className="flex flex-col items-center gap-2 mt-2">
            <button
              type="button"
              disabled={resendCooldown > 0}
              onClick={handleResendCode}
              className="text-sm font-medium text-brand-red hover:underline underline-offset-2 disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed transition-colors"
            >
              {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend code"}
            </button>
            {resendMessage && <p className="text-xs text-gray-600">{resendMessage}</p>}
          </div>

          <button
            type="button"
            className="text-sm font-medium text-gray-600 hover:text-brand-red transition-colors"
            onClick={() => { setStep("details"); setCodeError(""); setResendMessage(""); }}
          >
            Use a different email
          </button>
        </form>
      </div>
    );
  }

  return (
    <div key="details-step" className="w-full flex flex-col">
      <h1 className="text-center font-logo text-3xl font-bold leading-tight text-brand-red mb-2">
        Create an account
      </h1>
      <p className="text-center text-sm text-gray-600 mb-8">
        Gain access to bilingual resources. Share your notes, help students, and earn volunteer hours.
      </p>

      <form onSubmit={handleDetailsSubmit} noValidate aria-label="Create a UONotes account" className="flex flex-col gap-5">
        <FormField id="signup-full-name" label="Full Name" name="fullName" type="text" placeholder="John Doe" autoComplete="name" required />

        <div>
          <FormField
            id="signup-email"
            label="Student Email"
            name="email"
            type="email"
            placeholder="example@uottawa.ca"
            autoComplete="email"
            aria-invalid={emailError ? true : undefined}
            onChange={() => emailError && setEmailError("")}
            required
          />
          {emailError && <p className="mt-2 text-xs font-medium text-brand-red">{emailError}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FormField id="signup-password" label="Password" name="password" type="password" placeholder="••••••••" autoComplete="new-password" required />
          <FormField id="signup-confirm-password" label="Confirm Password" name="confirmPassword" type="password" placeholder="••••••••" autoComplete="new-password" required />
        </div>

        {formError && <p className="text-xs font-medium text-brand-red text-center">{formError}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-4 bg-brand-red text-white text-base font-semibold px-8 py-3.5 rounded-md transition-transform hover:bg-brand-red/90 active:scale-[0.98] shadow-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>

        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link href="/signin" className="font-semibold text-brand-red hover:underline underline-offset-2 transition-all">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}

export function SignUpForm() {
  return (
    <Suspense fallback={<div className="w-full h-[450px] animate-pulse" />}>
      <SignUpFormLogic />
    </Suspense>
  );
}