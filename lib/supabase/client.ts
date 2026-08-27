import { createBrowserClient } from "@supabase/ssr";

// Use this client inside "use client" components (e.g. the sign up / sign in forms).
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}