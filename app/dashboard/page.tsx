import type { Metadata } from "next";
import { DashboardView } from "@/components/dashboard/DashboardView";

export const metadata: Metadata = {
  title: "Dashboard | UONotes",
  description: "View your note submissions, earned volunteer hours, and feedback.",
};

export default function DashboardPage() {
  return <DashboardView />;
}