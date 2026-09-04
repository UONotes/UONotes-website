import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { isStrongPassword, PASSWORD_REQUIREMENTS_TEXT } from "@/lib/passwordValidation";
import { checkOtpLock, recordOtpFailure, resetOtpAttempts } from "@/lib/otpAttempts";

export async function POST(request: Request) {
  const { email, code, newPassword } = await request.json();

  if (!email || !code || !newPassword) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }
  if (typeof newPassword !== "string" || !isStrongPassword(newPassword)) {
    return NextResponse.json({ error: PASSWORD_REQUIREMENTS_TEXT }, { status: 400 });
  }

  const { locked, minutesRemaining } = await checkOtpLock(email, "recovery");
  if (locked) {
    return NextResponse.json(
      { error: `Too many incorrect attempts. Please try again in ${minutesRemaining} minute${minutesRemaining === 1 ? "" : "s"}.` },
      { status: 429 }
    );
  }

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
    await recordOtpFailure(email, "recovery");
    return NextResponse.json(
      { error: "That code is incorrect or has expired." },
      { status: 400 }
    );
  }

  await resetOtpAttempts(email, "recovery");

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