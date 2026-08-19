import type { Metadata } from "next";
import { SignInForm } from "@/components/Auth/SignInForm";

export const metadata: Metadata = {
  title: "Sign in | UONotes",
  description: "Sign in to share and access notes from uOttawa students.",
};

export default function SignInPage() {
  return (
    <div className="w-full min-h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-[#fef5f6] py-12 px-4 overflow-hidden">
      <SignInForm />
    </div>
  );
}