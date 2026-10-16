import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createClient } from "@/lib/supabase/server";
import { createR2Client, R2_BUCKET_NAME } from "@/lib/r2";
import { DashboardView } from "@/components/dashboard/DashboardView";

export const metadata: Metadata = {
  title: "Dashboard | UONotes",
  description: "View your note submissions, earned volunteer hours, and feedback.",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/signin");

  const [{ data: notes, error }, { data: savedNotes, error: savedError }, { data: profile }] = await Promise.all([
    supabase
      .from("notes")
      .select("id, title, course_code, status, hours_awarded, flag_reason, feedback_attachment_key, file_key, file_type, created_at, reviewed_at")
      .eq("uploader_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("saved_notes")
      .select("id, note_id, notes(id, title, course_code, author_name, created_at, file_key, file_type)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
  ]);

  if (error) {
    console.error("Failed to fetch user's submissions:", error.message);
  }
  if (savedError) {
    console.error("Failed to fetch user's saved notes:", savedError.message);
  }

  // A short-lived link to each PDF so the dashboard can show its first page
  // (other file types just show a plain sheet). The storage key itself isn't sent to the browser.
  const r2 = createR2Client();
  const submissions = await Promise.all(
    (notes || []).map(async ({ file_key, ...note }) => {
      const isPdf = !note.file_type || note.file_type === "application/pdf";
      const fileUrl =
        file_key && isPdf
          ? await getSignedUrl(r2, new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: file_key }), { expiresIn: 3600 }).catch(() => null)
          : null;
      return { ...note, fileUrl };
    })
  );

  // Same for saved notes, so clicking one can show its first page and offer a download
  const saved = await Promise.all(
    (savedNotes || []).map(async (row) => {
      const note = Array.isArray(row.notes) ? row.notes[0] : row.notes;
      if (!note) return { ...row, notes: null };
      const { file_key, file_type, ...rest } = note;
      const isPdf = !file_type || file_type === "application/pdf";
      const fileUrl =
        file_key && isPdf
          ? await getSignedUrl(r2, new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: file_key }), { expiresIn: 3600 }).catch(() => null)
          : null;
      return { ...row, notes: { ...rest, fileUrl } };
    })
  );

  const firstName = profile?.full_name?.trim().split(" ")[0] || null;

  return <DashboardView submissions={submissions} savedNotes={saved} firstName={firstName} />;
}