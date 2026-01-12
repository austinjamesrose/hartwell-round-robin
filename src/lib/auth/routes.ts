// Routes that don't require authentication
export const PUBLIC_ROUTES = ["/", "/login", "/register", "/auth/callback"];

// Routes that authenticated users shouldn't access (they redirect to dashboard)
export const AUTH_ROUTES = ["/login", "/register"];

/**
 * Check if a path matches any public route (routes accessible without authentication)
 * Matches exact paths and paths that start with the route followed by "/"
 */
export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

/**
 * Check if a path is an auth route (login/register - should redirect if already authenticated)
 */
export function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.includes(pathname);
}

/**
 * Determines the redirect action needed based on auth state and current path
 * Returns:
 * - null if no redirect needed
 * - "dashboard" if authenticated user should be redirected to dashboard
 * - "login" if unauthenticated user should be redirected to login
 */
export function getAuthRedirect(
  pathname: string,
  isAuthenticated: boolean
): "dashboard" | "login" | null {
  // Authenticated user trying to access login/register -> redirect to dashboard
  if (isAuthenticated && isAuthRoute(pathname)) {
    return "dashboard";
  }

  // Unauthenticated user trying to access protected route -> redirect to login
  if (!isAuthenticated && !isPublicRoute(pathname)) {
    return "login";
  }

  // No redirect needed
  return null;
}
