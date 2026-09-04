import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkOtpLock, recordOtpFailure, resetOtpAttempts } from "@/lib/otpAttempts";

export async function POST(request: Request) {
  const { email, code } = await request.json();

  if (!email || !code) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const { locked, minutesRemaining } = await checkOtpLock(email, "signup");
  if (locked) {
    return NextResponse.json(
      { error: `Too many incorrect attempts. Please try again in ${minutesRemaining} minute${minutesRemaining === 1 ? "" : "s"}.` },
      { status: 429 }
    );
  }

  // Using the cookie-aware server client here (not a throwaway one) is
  // intentional — unlike password reset, signup confirmation SHOULD log
  // the user in immediately, so this session needs to actually persist
  // to the browser via cookies.
  const supabase = await createClient();
  const { error: verifyError } = await supabase.auth.verifyOtp({
    email,
    token: code,
    type: "signup",
  });

  if (verifyError) {
    await recordOtpFailure(email, "signup");
    return NextResponse.json(
      { error: "That code is incorrect or has expired." },
      { status: 400 }
    );
  }

  await resetOtpAttempts(email, "signup");

  return NextResponse.json({ success: true });
}