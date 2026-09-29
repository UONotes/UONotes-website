import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseRange } from "@/lib/analytics";
import { getAnalytics, isSuperAdmin } from "@/lib/analytics-loader";

// Live-refresh endpoint for the analytics dashboard. Lives under /api so
// the admin middleware (which records "last active") doesn't run on it —
// an analytics tab left open shouldn't make its owner look active.
// ?fresh=1 skips the shared 10s cache; the dashboard sends it when a
// Realtime change event arrives, so the update isn't hidden by the cache.
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  if (!(await isSuperAdmin(supabase, user.id))) {
    return NextResponse.json({ error: "Insufficient privileges." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  try {
    const data = await getAnalytics(parseRange(searchParams.get("range") ?? undefined), {
      fresh: searchParams.get("fresh") === "1",
    });
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Couldn't load analytics." }, { status: 500 });
  }
}
