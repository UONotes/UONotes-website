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

    const isValidUOttawaEmail = /^[^\s@]+@uottawa\.ca$/i.test(email);

    if (!isValidUOttawaEmail) {
      setEmailError("Please enter a valid @uottawa.ca email address.");
      return;
    }

    setEmailError("");
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
          <FormField id="signup-student-number" label="Student Number" name="studentNumber" type="text" inputMode="numeric" placeholder="123456789" autoComplete="off" required />
          <FormField id="signup-program" label="Program of Study" name="program" type="text" placeholder="Computer Science" autoComplete="organization-title" required />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FormField id="signup-password" label="Password" name="password" type="password" placeholder="••••••••" autoComplete="new-password" required />
          <FormField id="signup-confirm-password" label="Confirm Password" name="confirmPassword" type="password" placeholder="••••••••" autoComplete="new-password" required />
        </div>

        <button type="submit" className="w-full mt-4 bg-brand-red text-white text-base font-semibold px-8 py-3.5 rounded-md transition-transform hover:bg-brand-red/90 active:scale-[0.98] shadow-md cursor-pointer">
          Create account
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