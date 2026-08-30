import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  // CSRF check: a malicious site could otherwise trick a logged-in
  // user's browser into POSTing here using their real session cookie.
  // Browsers set the Origin header themselves on cross-origin requests
  // and it can't be spoofed by the requesting page, so comparing it
  // against this route's own origin reliably confirms the request
  // actually came from our own site.
  const origin = request.headers.get("origin");
  const expectedOrigin = new URL(request.url).origin;
  if (!origin || origin !== expectedOrigin) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  // Identify who's actually asking, using their real session cookie —
  // this ensures someone can only ever delete their OWN account, never
  // an arbitrary user id passed in from the client.
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  // Only the admin client can actually delete a user — this cascades to
  // delete their profiles row too (on delete cascade), while any notes
  // they submitted stay in place with uploader_id set to null.
  const adminClient = createAdminClient();
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);

  if (deleteError) {
    return NextResponse.json({ error: "Could not delete account." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}