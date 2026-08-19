"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import { FormField } from "@/components/ui/FormField";

export function ForgotPasswordForm() {
  const [emailError, setEmailError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();

    const isValidUOttawaEmail = /^[^\s@]+@uottawa\.ca$/i.test(email);

    if (!isValidUOttawaEmail) {
      setEmailError("Invalid @uottawa.ca email");
      return;
    }

    setEmailError("");
  }

  return (
    <div className="w-full max-w-[480px] bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-brand-red/10">
      <h1 className="text-center font-logo text-3xl font-bold leading-tight text-brand-red mb-2">
        Forgot password?
      </h1>
      <p className="text-center text-sm text-gray-600 mb-8">
        Enter your student email to request a password reset link.
      </p>

      <form onSubmit={handleSubmit} noValidate aria-label="Request password reset" className="flex flex-col gap-5">
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

        <button type="submit" className="w-full mt-4 bg-brand-red text-white text-base font-semibold px-8 py-3.5 rounded-md transition-transform hover:bg-brand-red/90 active:scale-[0.98] shadow-md">
          Send reset link
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