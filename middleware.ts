import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { getAuthRedirect, isPublicRoute } from "@/lib/auth/routes";

export async function middleware(request: NextRequest) {
  // Update session and get user info
  const { supabaseResponse, user } = await updateSession(request);

  const pathname = request.nextUrl.pathname;
  const isAuthenticated = !!user;

  // Determine if we need to redirect based on auth state
  const redirect = getAuthRedirect(pathname, isAuthenticated);

  if (redirect === "dashboard") {
    // Authenticated user trying to access login/register -> redirect to dashboard
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (redirect === "login") {
    // Unauthenticated user trying to access protected route -> redirect to login
    const redirectUrl = new URL("/login", request.url);
    // Preserve the intended destination for post-login redirect
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // No redirect needed - allow access if public route or authenticated
  if (isPublicRoute(pathname) || isAuthenticated) {
    return supabaseResponse;
  }

  // Fallback - shouldn't reach here but redirect to login just in case
  return NextResponse.redirect(new URL("/login", request.url));
}

// Configure which routes the middleware runs on
// Exclude static files, api routes we want public, etc.
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
