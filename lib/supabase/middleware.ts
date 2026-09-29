import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

// Paths that require being logged in regardless of admin status
const PROTECTED_PATHS = ["/submit", "/dashboard", "/settings", "/notes"];
// Paths that require being logged in AND having is_admin = true
const ADMIN_PATHS = ["/admin"];
// Paths that make no sense to show someone who's already logged in.
const LOGGED_OUT_ONLY_PATHS = ["/signin", "/signup", "/forgot-password"];
// Throttles the "last active in admin" write (see below)
const ADMIN_SEEN_COOKIE = "uon_admin_seen";
const ADMIN_SEEN_THROTTLE_MS = 60 * 1000;

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptionsWithName }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refreshes the auth token if needed and keeps cookies in sync.
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // 1. Ignore static files, chunks, and assets so your logs stay clean
  const isIgnoredAsset = pathname.startsWith('/_next') || pathname.includes('.');

  if (!isIgnoredAsset) {
    // 2. Prints user identity and target path into Vercel runtime logs
    console.log(JSON.stringify({
      email: user?.email ?? 'anonymous',
      userId: user?.id ?? 'unauthenticated',
      path: pathname,
      method: request.method,
      timestamp: new Date().toISOString(),
    }));
  }

  const isProtectedPath = PROTECTED_PATHS.some((path) => pathname.startsWith(path));
  const isAdminPath = ADMIN_PATHS.some((path) => pathname.startsWith(path));

  if ((isProtectedPath || isAdminPath) && !user) {
    const signInUrl = new URL(
      `/signin?from=${encodeURIComponent(pathname)}`,
      request.url
    );
    return NextResponse.redirect(signInUrl);
  }

  if (isAdminPath && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Record real "last active in admin" time, separate from — and more
    // accurate than — inferring it from their last review decision. Uses
    // the service-role client since this writes a column the user's own
    // RLS policy may not grant them write access to. Best-effort: a
    // failure here should never block the actual page from loading.
    //
    // Skips link prefetches (the admin didn't actually open anything) and
    // writes at most once a minute per browser, tracked with a cookie, so
    // normal navigation doesn't cost a database write per click. Background
    // data refreshes (e.g. live analytics) go through /api, which this
    // middleware doesn't run on, so an idle open tab doesn't count as active.
    const isPrefetch =
      request.headers.get("next-router-prefetch") === "1" ||
      request.headers.get("purpose") === "prefetch" ||
      (request.headers.get("sec-purpose") ?? "").includes("prefetch");
    const lastRecorded = Number(request.cookies.get(ADMIN_SEEN_COOKIE)?.value) || 0;

    if (!isIgnoredAsset && !isPrefetch && Date.now() - lastRecorded > ADMIN_SEEN_THROTTLE_MS) {
      try {
        const supabaseAdmin = createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        await supabaseAdmin
          .from("profiles")
          .update({ last_admin_active_at: new Date().toISOString() })
          .eq("id", user.id);
        response.cookies.set(ADMIN_SEEN_COOKIE, String(Date.now()), {
          httpOnly: true,
          sameSite: "lax",
          path: "/admin",
          maxAge: 60 * 60,
        });
      } catch (err) {
        console.error("Failed to record admin activity:", err);
      }
    }
  }

  const isLoggedOutOnlyPath = LOGGED_OUT_ONLY_PATHS.some((path) => pathname.startsWith(path));
  if (isLoggedOutOnlyPath && user) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}