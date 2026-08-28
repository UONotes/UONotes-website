import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/Auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset password | UONotes",
  description: "Set a new password for your UONotes account.",
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}