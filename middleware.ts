import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match only protected routes and auth endpoints, 
     * bypassing public marketing pages completely.
     */
    "/submit/:path*",
    "/dashboard/:path*",
    "/settings/:path*",
    "/admin/:path*",
    "/notes/:path*", // Keep if notes require login; remove if public
    "/signin",
    "/signup",
    "/forgot-password",
    "/reset-password"
  ],
};