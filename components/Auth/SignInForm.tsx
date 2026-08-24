"use client";

import type { FormEvent } from "react";
import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormField } from "@/components/ui/FormField";

function SignInFormLogic() {
  const [loginError, setLoginError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  const fromParam = searchParams.get("from");
  const returnPath = fromParam && fromParam.startsWith("/") && !fromParam.startsWith("//") ? fromParam : "/";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();

    const isValidUOttawaEmail = /^[^\s@]+@uottawa\.ca$/i.test(email);

    if (!isValidUOttawaEmail) {
      setLoginError("Please use a valid @uottawa.ca email.");
      return;
    }

    setLoginError("");
    router.replace(returnPath);
  }

  return (
    <div className="w-full flex flex-col">
      <h1 className="text-center font-logo text-3xl font-bold leading-tight text-brand-red mb-2">
        Welcome back
      </h1>
      <p className="text-center text-sm text-gray-600 mb-8">
        Log in to access and share uOttawa student notes.
      </p>

      <form onSubmit={handleSubmit} noValidate aria-label="Log in to UONotes" className="flex flex-col gap-5">
        <div>
          <FormField
            id="signin-email"
            label="Student Email"
            name="email"
            type="email"
            placeholder="example@uottawa.ca"
            autoComplete="email"
            aria-invalid={loginError ? true : undefined}
            onChange={() => loginError && setLoginError("")}
            required
          />
          {loginError && (
            <p className="mt-2 text-xs font-medium text-brand-red">{loginError}</p>
          )}
        </div>

        <FormField
          id="signin-password"
          label="Password"
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />

        <button
          type="submit"
          className="w-full mt-4 bg-brand-red text-white text-base font-semibold px-8 py-3.5 rounded-md transition-transform hover:bg-brand-red/90 active:scale-[0.98] shadow-md cursor-pointer"
        >
          Sign in
        </button>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between text-sm gap-4">
          <Link href={`/forgot-password?from=${encodeURIComponent(returnPath)}`} className="text-gray-600 font-medium hover:text-brand-red transition-colors">
            Forgot password?
          </Link>
          <Link href={`/signup?from=${encodeURIComponent(returnPath)}`} className="text-gray-600 font-medium hover:text-brand-red transition-colors">
            Create an account
          </Link>
        </div>
      </form>
    </div>
  );
}

export function SignInForm() {
  return (
    <Suspense fallback={<div className="w-full h-[450px] animate-pulse" />}>
      <SignInFormLogic />
    </Suspense>
  );
}