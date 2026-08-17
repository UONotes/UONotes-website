"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";

import { FormField } from "@/components/ui/FormField";

export function SignUpForm() {
  const [emailError, setEmailError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();

    const isValidUOttawaEmail =
      /^[^\s@]+@uottawa\.ca$/i.test(email);

    if (!isValidUOttawaEmail) {
      setEmailError("Please enter a valid uottawa email address");
      return;
    }

    setEmailError("");

    // Backend account creation will go here later.
  }

  return (
    <section className="flex min-h-0 flex-1 items-center justify-center overflow-hidden px-6 py-[clamp(8px,2vh,24px)]">
      <div className="w-full max-w-[700px]">
        <h1 className="text-center font-logo text-[clamp(1.6rem,3vh,2rem)] font-semibold leading-tight text-brand-red">
          Create a UONotes account
        </h1>

        <p className="mt-[clamp(6px,1.5vh,16px)] text-center text-[clamp(0.8rem,1.6vh,1rem)] leading-5 text-brand-dark">
          Gain access to bilingual resources from uOttawa students.
          <span className="block">
            Share your notes, help other students and obtain volunteer hours.
          </span>
        </p>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="mx-auto mt-[clamp(10px,2.5vh,28px)] w-full max-w-[360px]"
          aria-label="Create a UONotes account"
        >
          <div className="space-y-[clamp(6px,1.3vh,14px)]">
            <FormField
              id="signup-full-name"
              label="Full Name"
              name="fullName"
              type="text"
              autoComplete="name"
              required
            />

            <div>
              <FormField
                id="signup-email"
                label="Student email"
                name="email"
                type="email"
                placeholder="example@uottawa.ca"
                autoComplete="email"
                aria-invalid={emailError ? true : undefined}
                aria-describedby={
                  emailError ? "signup-email-error" : undefined
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
                  id="signup-email-error"
                  className="mt-1 text-xs text-brand-red"
                >
                  {emailError}
                </p>
              )}
            </div>

            <FormField
              id="signup-student-number"
              label="Student number"
              name="studentNumber"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              required
            />

            <FormField
              id="signup-program"
              label="Program of study"
              name="program"
              type="text"
              autoComplete="organization-title"
              required
            />

            <div className="grid grid-cols-1 gap-[clamp(6px,1.3vh,14px)] sm:grid-cols-2 sm:gap-5">
              <FormField
                id="signup-password"
                label="Password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
              />

              <FormField
                id="signup-confirm-password"
                label="Confirm password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
              />
            </div>
          </div>

          <div className="mt-[clamp(10px,2.5vh,28px)] flex justify-center">
            <button
              type="submit"
              className="w-[192px] rounded bg-brand-red py-2 text-sm font-medium text-white transition-colors hover:bg-brand-red-hover"
            >
              Create account
            </button>
          </div>

          <p className="mt-[clamp(8px,1.8vh,16px)] text-center text-sm text-brand-dark">
            Already have an account?{" "}
            <Link
              href="/signin"
              className="font-medium text-brand-red underline underline-offset-2 hover:text-brand-red-hover"
            >
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
}