import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/Auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot password | UONotes",
  description: "Request a password reset for your UONotes account.",
};

export default function ForgotPasswordPage() {
  return (
    <div className="w-full min-h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-[#fef5f6] py-12 px-4 overflow-hidden">
      <ForgotPasswordForm />
    </div>
  );
}