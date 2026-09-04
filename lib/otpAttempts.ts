import { createAdminClient } from "@/lib/supabase/admin";

// SERVER-ONLY — uses the admin client, which bypasses RLS. Only import
// this from Route Handlers or other server-only code.
const MAX_ATTEMPTS = 3;
// Each successive lockout for the same email gets longer
const ESCALATION_MINUTES = [1, 5, 15, 60];
const QUIET_RESET_HOURS = 24;

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
    const msRemaining = new Date(data.locked_until).getTime() - Date.now();
    const minutesRemaining = Math.max(1, Math.ceil(msRemaining / 60000));
    return { locked: true as const, minutesRemaining };
  }
  return { locked: false as const, minutesRemaining: 0 };
}

export async function recordOtpFailure(email: string, otpType: OtpType) {
  const admin = createAdminClient();
  const { data, error: selectError } = await admin
    .from("otp_verification_attempts")
    .select("failed_attempts, lockout_count, last_locked_at")
    .eq("email", email)
    .eq("otp_type", otpType)
    .maybeSingle();

  if (selectError) {
    console.error("otpAttempts select error:", selectError);
  }

  let failedAttempts = data?.failed_attempts ?? 0;
  let lockoutCount = data?.lockout_count ?? 0;

  // Enough quiet time has passed since the last lockout — start over
  // as if this were the first-ever failure.
  const lastLockedAt = data?.last_locked_at ? new Date(data.last_locked_at) : null;
  const quietResetPassed =
    lastLockedAt &&
    Date.now() - lastLockedAt.getTime() > QUIET_RESET_HOURS * 60 * 60 * 1000;

  if (quietResetPassed) {
    failedAttempts = 0;
    lockoutCount = 0;
  }

  const newFailedAttempts = failedAttempts + 1;
  const shouldLock = newFailedAttempts >= MAX_ATTEMPTS;

  const newLockoutCount = shouldLock ? lockoutCount + 1 : lockoutCount;
  const durationMinutes =
    ESCALATION_MINUTES[Math.min(newLockoutCount, ESCALATION_MINUTES.length) - 1];

  const { error: upsertError } = await admin
    .from("otp_verification_attempts")
    .upsert({
      email,
      otp_type: otpType,
      // Reset to 0 on lock so the NEXT round requires 3 genuinely new
      // wrong guesses, rather than one wrong guess immediately
      // re-triggering another lockout.
      failed_attempts: shouldLock ? 0 : newFailedAttempts,
      lockout_count: newLockoutCount,
      locked_until: shouldLock
        ? new Date(Date.now() + durationMinutes * 60 * 1000).toISOString()
        : null,
      last_locked_at: shouldLock ? new Date().toISOString() : data?.last_locked_at ?? null,
    });

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