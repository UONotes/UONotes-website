"use client";

import type { FormEvent } from "react";
import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormField } from "@/components/ui/FormField";
import { createClient } from "@/lib/supabase/client";

const AUTH_PATHS = ["/signin", "/signup", "/forgot-password", "/reset-password"];

function ForgotPasswordFormLogic() {
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [resetError, setResetError] = useState("");
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
    await supabase.auth.resetPasswordForEmail(enteredEmail);

    setIsSubmitting(false);
    setEmail(enteredEmail);
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
    if (newPassword.length < 6) {
      setResetError("Password must be at least 6 characters.");
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
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: newPassword,
    });

    setIsSubmitting(false);

    if (signInError) {
      router.replace("/signin");
      return;
    }

    router.replace(returnPath);
  }

  if (step === "reset") {
    return (
      <div key="reset-step" className="w-full flex flex-col">
        <h1 className="text-center font-logo text-3xl font-bold leading-tight text-brand-red mb-2">
          Reset your password
        </h1>
        <p className="text-center text-sm text-gray-600 mb-8">
          Enter the 8-digit code we sent to <span className="font-semibold text-gray-900">{email}</span> along with your new password.
        </p>

        <form onSubmit={handleResetSubmit} noValidate aria-label="Reset password" className="flex flex-col gap-5">
          <FormField
            id="reset-code"
            label="8-Digit Code"
            name="code"
            type="text"
            inputMode="numeric"
            placeholder="12345678"
            maxLength={8}
            autoComplete="one-time-code"
            required
          />

          <FormField
            id="reset-new-password"
            label="New Password"
            name="newPassword"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            required
          />

          <FormField
            id="reset-confirm-password"
            label="Confirm New Password"
            name="confirmPassword"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            required
          />

          {resetError && <p className="text-xs font-medium text-brand-red text-center">{resetError}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-4 bg-brand-red text-white text-base font-semibold px-8 py-3.5 rounded-md transition-transform hover:bg-brand-red/90 active:scale-[0.98] shadow-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Updating password..." : "Update password"}
          </button>

          <button
            type="button"
            className="text-sm font-medium text-gray-600 hover:text-brand-red transition-colors"
            onClick={() => { setStep("email"); setResetError(""); }}
          >
            Use a different email
          </button>
        </form>
      </div>
    );
  }

  return (
    <div key="email-step" className="w-full flex flex-col">
      <h1 className="text-center font-logo text-3xl font-bold leading-tight text-brand-red mb-2">
        Forgot password?
      </h1>
      <p className="text-center text-sm text-gray-600 mb-8">
        Enter your student email and we&apos;ll send you a code to reset your password.
      </p>

      <form onSubmit={handleEmailSubmit} noValidate aria-label="Request password reset" className="flex flex-col gap-5">
        <div>
          <FormField
            id="forgot-email"
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

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-4 bg-brand-red text-white text-base font-semibold px-8 py-3.5 rounded-md transition-transform hover:bg-brand-red/90 active:scale-[0.98] shadow-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Sending..." : "Send code"}
        </button>

        <div className="mt-6 text-center">
          <Link href="/signin" className="text-sm font-medium text-gray-600 hover:text-brand-red transition-colors">
            Back to sign in
          </Link>
        </div>
      </form>
    </div>
  );
}

export function ForgotPasswordForm() {
  return (
    <Suspense fallback={<div className="w-full h-[450px] animate-pulse" />}>
      <ForgotPasswordFormLogic />
    </Suspense>
  );
}