import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

// Paths that require being logged in regardless of admin status
const PROTECTED_PATHS = ["/submit", "/dashboard", "/settings", "/notes"];
// Paths that require being logged in AND having is_admin = true
const ADMIN_PATHS = ["/admin"];
// Paths that make no sense to show someone who's already logged in.
const LOGGED_OUT_ONLY_PATHS = ["/signin", "/signup", "/forgot-password"];

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
    if (!isIgnoredAsset) {
      try {
        const supabaseAdmin = createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        await supabaseAdmin
          .from("profiles")
          .update({ last_admin_active_at: new Date().toISOString() })
          .eq("id", user.id);
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