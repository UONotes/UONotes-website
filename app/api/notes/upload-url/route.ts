import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createR2Client, R2_BUCKET_NAME } from "@/lib/r2";
import { isAllowedFileType, isAllowedFileSize } from "@/lib/fileValidation";
import { randomUUID } from "crypto";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const admin = createAdminClient();
  const [{ data: profile }, { data: settings }] = await Promise.all([
    supabase.from("profiles").select("is_admin").eq("id", user.id).single(),
    admin.from("platform_settings").select("maintenance_mode").eq("id", 1).single(),
  ]);

  if (settings?.maintenance_mode && !profile?.is_admin) {
    return NextResponse.json(
      { error: "Submissions are temporarily paused for maintenance. Please try again later." },
      { status: 503 }
    );
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
  const fileKey = `notes/${randomUUID()}.${safeExtension}`;

  const r2 = createR2Client();
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: fileKey,
    ContentType: fileType,
    ContentLength: fileSize, // Locks the signature to the exact verified byte count
  });

  // 5-minute expiry window for upload completion
  const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 300 });

  return NextResponse.json({ uploadUrl, fileKey });
}