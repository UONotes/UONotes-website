import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/Auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot password | UONotes",
  description: "Request a password reset for your UONotes account.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}