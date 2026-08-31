import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createClient } from "@/lib/supabase/server";
import { createR2Client, R2_BUCKET_NAME } from "@/lib/r2";
import { isAllowedFileType, isAllowedFileSize } from "@/lib/fileValidation";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { fileName, fileType, fileSize } = await request.json();

  if (!fileName || !fileType || !fileSize) {
    return NextResponse.json({ error: "Missing file details." }, { status: 400 });
  }

  if (!isAllowedFileType(fileType)) {
    return NextResponse.json({ error: "That file type isn't supported." }, { status: 400 });
  }

  if (typeof fileSize !== "number" || !isAllowedFileSize(fileSize)) {
    return NextResponse.json({ error: "File is too large (25MB max)." }, { status: 400 });
  }

  const safeExtension = fileName.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") || "bin";
  const fileKey = `notes/${crypto.randomUUID()}.${safeExtension}`;

  const r2 = createR2Client();
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: fileKey,
    ContentType: fileType,
  });

  const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 300 });

  return NextResponse.json({ uploadUrl, fileKey });
}