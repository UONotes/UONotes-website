import { createClient } from "@supabase/supabase-js";

// SERVER-ONLY. This client uses the secret/service_role key, which
// bypasses RLS entirely. NEVER import this file from
// any "use client" component, or from anything that ends up in a
// browser bundle. Only import it from Route Handlers or other
// server-only code (files under app/api/, for example).
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}