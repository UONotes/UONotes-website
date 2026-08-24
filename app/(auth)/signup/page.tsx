import type { Metadata } from "next";
import { SignUpForm } from "@/components/Auth/SignUpForm";

export const metadata: Metadata = {
  title: "Create account | UONotes",
  description: "Create a UONotes account to access and share student notes.",
};

export default function SignUpPage() {
  return <SignUpForm />;
}