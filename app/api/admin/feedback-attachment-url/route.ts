import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createClient } from "@/lib/supabase/server";
import { createR2Client, R2_BUCKET_NAME } from "@/lib/r2";
import { isAllowedFileType, isAllowedFileSize } from "@/lib/fileValidation";
import { randomUUID } from "crypto";

// Admin-only presign for the optional document an admin can attach to
// "changes requested" feedback (e.g. an annotated PDF showing what to
// fix). Deliberately separate from /api/notes/upload-url — that route
// is for students uploading their own notes and doesn't check
// is_admin, so it's the wrong place to reuse for reviewer attachments.
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Insufficient privileges." }, { status: 403 });
  }

  const { fileName, fileType, fileSize } = await request.json();

  if (!fileName || !fileType || typeof fileSize !== "number") {
    return NextResponse.json({ error: "Missing or invalid file metadata." }, { status: 400 });
  }

  if (!isAllowedFileType(fileType)) {
    return NextResponse.json({ error: "Unsupported file format." }, { status: 400 });
  }

  if (!isAllowedFileSize(fileSize)) {
    return NextResponse.json({ error: "File exceeds 25MB limit." }, { status: 400 });
  }

  const safeExtension = fileName.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") || "pdf";
  const fileKey = `feedback/${randomUUID()}.${safeExtension}`;

  const r2 = createR2Client();
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: fileKey,
    ContentType: fileType,
    ContentLength: fileSize,
  });

  const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 300 });

  return NextResponse.json({ uploadUrl, fileKey });
}