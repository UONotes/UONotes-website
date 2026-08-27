import type { Metadata } from "next";
import { SignInForm } from "@/components/Auth/SignInForm";

export const metadata: Metadata = {
  title: "Sign in | UONotes",
  description: "Sign in to share and access notes from uOttawa students.",
};

export default function SignInPage() {
  return <SignInForm />;
}