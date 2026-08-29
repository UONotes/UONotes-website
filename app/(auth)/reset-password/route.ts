import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const { email, code, newPassword } = await request.json();

  if (!email || !code || !newPassword) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }
  if (typeof newPassword !== "string" || newPassword.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }

  // A fresh, non-persisting client just to check the code is valid.
  // The anon key is fine here — verifyOtp is a public operation.
  // persistSession: false means whatever session this returns is never
  // saved anywhere; it's discarded the moment this function returns.
  const verifierClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );

  const { data, error: verifyError } = await verifierClient.auth.verifyOtp({
    email,
    token: code,
    type: "recovery",
  });

  if (verifyError || !data.user) {
    return NextResponse.json(
      { error: "That code is incorrect or has expired." },
      { status: 400 }
    );
  }

  // Only now, using the admin client, do we actually set the new
  // password — directly, without the browser ever holding a session.
  const adminClient = createAdminClient();
  const { error: updateError } = await adminClient.auth.admin.updateUserById(
    data.user.id,
    { password: newPassword }
  );

  if (updateError) {
    return NextResponse.json({ error: "Could not update password." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}