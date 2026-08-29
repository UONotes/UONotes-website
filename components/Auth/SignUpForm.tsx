"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import { FormField } from "@/components/ui/FormField";
import { createClient } from "@/lib/supabase/client";

export function SignUpForm() {
  const [emailError, setEmailError] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const formData = new FormData(event.currentTarget);
    const fullName = String(formData.get("fullName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    const isValidUOttawaEmail = /^[^\s@]+@uottawa\.ca$/i.test(email);
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

    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/callback`,
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

    setSubmittedEmail(email);
  }

  if (submittedEmail) {
    return (
      <div className="w-full flex flex-col items-center text-center">
        <h1 className="font-logo text-3xl font-bold leading-tight text-brand-red mb-2">
          Check your email
        </h1>
        <p className="text-sm text-gray-600 mb-6">
          We sent a confirmation link to <span className="font-semibold text-gray-900">{submittedEmail}</span>.
          Click it to activate your account.
        </p>
        <p className="text-xs text-gray-500">
          Didn&apos;t get it? Check your spam folder, or{" "}
          <button
            type="button"
            className="font-semibold text-brand-red hover:underline underline-offset-2"
            onClick={() => setSubmittedEmail(null)}
          >
            try again
          </button>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col">
      <h1 className="text-center font-logo text-3xl font-bold leading-tight text-brand-red mb-2">
        Create an account
      </h1>
      <p className="text-center text-sm text-gray-600 mb-8">
        Gain access to bilingual resources. Share your notes, help students, and earn volunteer hours.
      </p>

      <form onSubmit={handleSubmit} noValidate aria-label="Create a UONotes account" className="flex flex-col gap-5">
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