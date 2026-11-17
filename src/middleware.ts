import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const adminHost = process.env.ADMIN_PORTAL_HOST || "admin.celebratingyou.com";
  const { pathname } = request.nextUrl;

  // 1. If accessing via Admin Subdomain / Domain
  if (host.toLowerCase().includes(adminHost.toLowerCase())) {
    // If accessing root on admin domain, redirect to admin portal login or dashboard
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/admin-portal/login", request.url));
    }
    // Block non-admin and non-api routes on admin domain
    if (!pathname.startsWith("/admin-portal") && !pathname.startsWith("/api")) {
      return NextResponse.redirect(new URL("/admin-portal/login", request.url));
    }
  }

  // 2. Strict isolation mode for production:
  // If request is accessing /admin-portal on main customer domain in production, redirect to dedicated admin domain
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ADMIN_DOMAIN_ISOLATED === "true" &&
    pathname.startsWith("/admin-portal") &&
    !host.toLowerCase().includes(adminHost.toLowerCase())
  ) {
    return NextResponse.redirect(new URL(`https://${adminHost}/admin-portal/login`));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

