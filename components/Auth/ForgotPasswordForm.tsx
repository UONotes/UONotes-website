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

    const isValidUOttawaEmail =
      /^[^\s@]+@uottawa\.ca$/i.test(email);

    if (!isValidUOttawaEmail) {
      setEmailError("Invalid Email");
      return;
    }

    setEmailError("");

    // Backend password reset will go here later.
  }

  return (
    <section className="flex flex-1 justify-center px-6 pb-16 pt-16">
      <div className="w-full max-w-[650px]">
        <h1 className="text-center font-logo text-[32px] font-semibold leading-tight text-brand-red">
          Forgot your password?
        </h1>

        <p className="mt-4 text-center text-base text-brand-dark">
          Enter your student email to request a password reset.
        </p>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="mx-auto mt-10 w-full max-w-[420px]"
          aria-label="Request password reset"
        >
          <div>
            <FormField
              id="forgot-email"
              label="Student email"
              name="email"
              type="email"
              placeholder="example@uottawa.ca"
              autoComplete="email"
              aria-invalid={emailError ? true : undefined}
              aria-describedby={
                emailError ? "forgot-email-error" : undefined
              }
              onChange={() => {
                if (emailError) {
                  setEmailError("");
                }
              }}
              required
            />

            {emailError && (
              <p
                id="forgot-email-error"
                className="mt-1 text-xs text-brand-red"
              >
                {emailError}
              </p>
            )}
          </div>

          <div className="mt-7 flex justify-center">
            <button
              type="submit"
              className="w-[168px] rounded bg-brand-red py-2 text-sm font-medium text-white transition-colors hover:bg-brand-red-hover"
            >
              Send reset link
            </button>
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/signin"
              className="text-sm text-brand-dark underline underline-offset-2 hover:text-brand-red"
            >
              Back to sign in
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
}