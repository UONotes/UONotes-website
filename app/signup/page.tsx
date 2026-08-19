import type { Metadata } from "next";
import { SignUpForm } from "@/components/Auth/SignUpForm";

export const metadata: Metadata = {
  title: "Create account | UONotes",
  description: "Create a UONotes account to access and share student notes.",
};

export default function SignUpPage() {
  return (
    <div className="w-full min-h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-[#fef5f6] py-12 px-4 overflow-hidden">
      <SignUpForm />
    </div>
  );
}