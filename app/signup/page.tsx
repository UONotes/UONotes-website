import type { Metadata } from "next";

import { AuthPageShell } from "@/components/Auth/AuthPageShell";
import { SignUpForm } from "@/components/Auth/SignUpForm";

export const metadata: Metadata = {
  title: "Create account | UONotes",
  description:
    "Create a UONotes account to access and share student notes.",
};

export default function SignUpPage() {
  return (
    <AuthPageShell>
      <SignUpForm />
    </AuthPageShell>
  );
}