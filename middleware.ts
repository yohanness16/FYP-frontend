import { NextRequest, NextResponse } from "next/server";

/**
 * Public routes that don't require authentication.
 * /bus-dashboard and /driver are device-facing and have their own auth flow.
 */
const PUBLIC_ROUTES = [
  "/login",
  "/bus-dashboard",
  "/driver",
];

/**
 * Asset paths that should always be accessible.
 */
const ASSET_PREFIXES = [
  "/_next/",
  "/icons/",
  "/images/",
  "/favicon.ico",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow static assets
  if (ASSET_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // Allow public routes
  const isPublic = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );
  if (isPublic) {
    return NextResponse.next();
  }

  // Check for token in cookies (set by the login page)
  const token = request.cookies.get("auth_token")?.value;

  // If no token, redirect to login
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
