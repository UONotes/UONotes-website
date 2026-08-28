"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormField } from "@/components/ui/FormField";
import { createClient } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [codeError, setCodeError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

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

    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "recovery",
    });

    setIsSubmitting(false);

    if (error) {
      setCodeError("That code is incorrect or has expired. Request a new one below.");
      return;
    }

    router.replace("/reset-password");
  }

  if (step === "code") {
    return (
      <div key="code-step" className="w-full flex flex-col">
        <h1 className="text-center font-logo text-3xl font-bold leading-tight text-brand-red mb-2">
          Enter your code
        </h1>
        <p className="text-center text-sm text-gray-600 mb-8">
          We sent a 8-digit code to <span className="font-semibold text-gray-900">{email}</span>.
        </p>

        <form onSubmit={handleCodeSubmit} noValidate aria-label="Enter reset code" className="flex flex-col gap-5">
          <div>
            <FormField
              id="reset-code"
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
            {isSubmitting ? "Verifying..." : "Verify code"}
          </button>

          <button
            type="button"
            className="text-sm font-medium text-gray-600 hover:text-brand-red transition-colors"
            onClick={() => { setStep("email"); setCodeError(""); }}
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