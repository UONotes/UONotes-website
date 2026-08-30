import { createAdminClient } from "@/lib/supabase/admin";

// SERVER-ONLY — uses the admin client, which bypasses RLS. Only import
// this from Route Handlers or other server-only code.

const MAX_ATTEMPTS = 3;
const LOCKOUT_MINUTES = 15;

type OtpType = "recovery" | "signup";

export async function checkOtpLock(email: string, otpType: OtpType) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("otp_verification_attempts")
    .select("locked_until")
    .eq("email", email)
    .eq("otp_type", otpType)
    .maybeSingle();

  if (error) {
    console.error("otpAttempts checkOtpLock error:", error);
  }

  if (data?.locked_until && new Date(data.locked_until) > new Date()) {
    return { locked: true as const };
  }
  return { locked: false as const };
}

export async function recordOtpFailure(email: string, otpType: OtpType) {
  const admin = createAdminClient();
  const { data, error: selectError } = await admin
    .from("otp_verification_attempts")
    .select("failed_attempts")
    .eq("email", email)
    .eq("otp_type", otpType)
    .maybeSingle();

  if (selectError) {
    console.error("otpAttempts select error:", selectError);
  }

  const newCount = (data?.failed_attempts ?? 0) + 1;
  const lockedUntil =
    newCount >= MAX_ATTEMPTS
      ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000).toISOString()
      : null;

  const { error: upsertError } = await admin
    .from("otp_verification_attempts")
    .upsert({ email, otp_type: otpType, failed_attempts: newCount, locked_until: lockedUntil });

  if (upsertError) {
    console.error("otpAttempts upsert error:", upsertError);
  }
}

export async function resetOtpAttempts(email: string, otpType: OtpType) {
  const admin = createAdminClient();
  const { error } = await admin
    .from("otp_verification_attempts")
    .delete()
    .eq("email", email)
    .eq("otp_type", otpType);

  if (error) {
    console.error("otpAttempts resetOtpAttempts error:", error);
  }
}