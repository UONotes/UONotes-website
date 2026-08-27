import type { Metadata } from "next";
import { SubmitFormView } from "@/components/submit/SubmitFormView";

export const metadata: Metadata = {
  title: "Submit Notes | UONotes",
  description: "Upload your study notes, help fellow students, and earn volunteer hours.",
};

export default function SubmitPage() {
  return <SubmitFormView />;
}