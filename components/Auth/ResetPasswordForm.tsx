"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormField } from "@/components/ui/FormField";
import { createClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password.length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    const supabase = createClient();


    const { error } = await supabase.auth.updateUser({ password });
    setIsSubmitting(false);

    if (error) {
      setFormError(error.message);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.replace("/dashboard"), 1500);
  }

  if (success) {
    return (
      <div className="w-full flex flex-col items-center text-center">
        <h1 className="font-logo text-3xl font-bold leading-tight text-brand-red mb-2">
          Password updated
        </h1>
        <p className="text-sm text-gray-600">Redirecting you now...</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col">
      <h1 className="text-center font-logo text-3xl font-bold leading-tight text-brand-red mb-2">
        Set a new password
      </h1>
      <p className="text-center text-sm text-gray-600 mb-8">
        Choose a new password for your account.
      </p>

      <form onSubmit={handleSubmit} noValidate aria-label="Set a new password" className="flex flex-col gap-5">
        <FormField id="reset-password" label="New Password" name="password" type="password" placeholder="••••••••" autoComplete="new-password" required />
        <FormField id="reset-confirm-password" label="Confirm Password" name="confirmPassword" type="password" placeholder="••••••••" autoComplete="new-password" required />

        {formError && <p className="text-xs font-medium text-brand-red text-center">{formError}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-4 bg-brand-red text-white text-base font-semibold px-8 py-3.5 rounded-md transition-transform hover:bg-brand-red/90 active:scale-[0.98] shadow-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Updating..." : "Update password"}
        </button>
      </form>
    </div>
  );
}