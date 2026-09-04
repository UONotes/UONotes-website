import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
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

    const body = await request.json();
    const {
      title,
      courseCode,
      courseName,
      professor,
      authorName,
      authorEmail,
      language,
      noteTypes,
      fileKey,
      fileSize, // <--- Extracted from frontend payload
      fileType, // <--- Extracted from frontend payload
      comments,
    } = body;

    if (!title || !courseCode || !fileKey) {
      return NextResponse.json({ error: "Missing required note identifiers." }, { status: 400 });
    }

    const { data, error: insertError } = await supabase
      .from("notes")
      .insert({
        uploader_id: user.id, 
        title,
        course_code: courseCode,
        course_name: courseName || null,
        professor: professor || null,
        author_name: authorName || null,
        author_email: authorEmail || null,
        language: language || "EN",
        note_types: noteTypes || [],
        file_key: fileKey,
        file_size: fileSize || null, // <--- Inserted into database
        file_type: fileType || null, // <--- Inserted into database
        comments: comments || null,
        status: "pending",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Supabase note insertion error:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, note: data }, { status: 201 });
  } catch (err: any) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}