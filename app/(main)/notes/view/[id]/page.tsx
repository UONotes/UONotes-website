import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NoteViewer } from "@/components/notes/NoteViewer";
import { createClient } from "@/lib/supabase/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createR2Client, R2_BUCKET_NAME } from "@/lib/r2";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  return {
    title: `View Note #${resolvedParams.id} | UONotes`,
    description: "Inspect student study materials and documents securely.",
  };
}

export default async function ViewNoteRoute({ params }: PageProps) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  const supabase = await createClient();

  // 1. Fetch the actual note data from Postgres
  const { data: note, error } = await supabase
    .from("notes")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !note) {
    console.error("Database fetch failed for ID:", id, "Error:", error?.message);
    notFound();
  }

  // 1b. Look up the translation pair, if one exists — an English note
  // checks if any French note points back at it; a French note just
  // follows its own translation_of column directly.
  let translationPair: { id: string; title: string; language: string } | null = null;

  if (note.language === "FR" && note.translation_of) {
    const { data: original } = await supabase
      .from("notes")
      .select("id, title, language")
      .eq("id", note.translation_of)
      .single();
    translationPair = original ?? null;
  } else {
    const { data: translation } = await supabase
      .from("notes")
      .select("id, title, language")
      .eq("translation_of", note.id)
      .eq("status", "approved")
      .maybeSingle();
    translationPair = translation ?? null;
  }

  // 2. Generate secure presigned URL for Cloudflare R2
  const r2 = createR2Client();
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: note.file_key,
    ResponseContentType: "application/pdf",
    ResponseContentDisposition: "inline",
  });

  const fileUrl = await getSignedUrl(r2, command, { expiresIn: 3600 });

  // 3. Pass down to client component
  return <NoteViewer note={note} fileUrl={fileUrl} translationPair={translationPair} />;
}