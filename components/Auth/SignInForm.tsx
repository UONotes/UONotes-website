"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { FormField } from "@/components/ui/FormField";

type SignInFormProps = {
  returnPath: string;
};

export function SignInForm({
  returnPath,
}: SignInFormProps) {
  const [loginError, setLoginError] = useState("");
  const router = useRouter();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();

    const isValidUOttawaEmail =
      /^[^\s@]+@uottawa\.ca$/i.test(email);

    if (!isValidUOttawaEmail) {
      setLoginError("Incorrect login");
      return;
    }

    setLoginError("");

    // Temporary testing behaviour:
    // any @uottawa.ca email is treated as a successful login.
    router.replace(returnPath);
  }

  return (
    <section className="flex flex-1 justify-center px-6 pb-16 pt-16">
      <div className="w-full max-w-[650px]">
        <h1 className="text-center font-logo text-[32px] font-semibold leading-[1.3] text-brand-red">
          Log in to share and access notes
          <span className="block">
            from uOttawa students.
          </span>
        </h1>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="mx-auto mt-12 w-full max-w-[420px]"
          aria-label="Log in to UONotes"
        >
          <div className="space-y-5">
            <div>
              <FormField
                id="signin-email"
                label="Email"
                name="email"
                type="email"
                placeholder="example@uottawa.ca"
                autoComplete="email"
                aria-invalid={loginError ? true : undefined}
                aria-describedby={
                  loginError ? "signin-error" : undefined
                }
                onChange={() => {
                  if (loginError) {
                    setLoginError("");
                  }
                }}
                required
              />

              {loginError && (
                <p
                  id="signin-error"
                  className="mt-1 text-xs text-brand-red"
                >
                  {loginError}
                </p>
              )}
            </div>

            <FormField
              id="signin-password"
              label="Password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>

          <div className="mt-7 flex justify-center">
            <button
              type="submit"
              className="w-[168px] rounded bg-brand-red py-2 text-sm font-medium text-white transition-colors hover:bg-brand-red-hover"
            >
              Sign in
            </button>
          </div>

          <div className="mt-9 flex items-center justify-center gap-14 text-sm">
            <Link
              href={`/forgot-password?from=${encodeURIComponent(returnPath)}`}
              className="text-brand-dark underline underline-offset-2 hover:text-brand-red"
            >
              Forgot password?
            </Link>

            <Link
              href={`/signup?from=${encodeURIComponent(returnPath)}`}
              className="text-brand-dark underline underline-offset-2 hover:text-brand-red"
            >
              Create account
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
}