import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, decodeSession } from "@/lib/auth";

export function middleware(request: NextRequest) {
  const protectedPaths = ["/dashboard", "/profile", "/settings", "/help"];
  const isProtectedPath = protectedPaths.some(
    (path) =>
      request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(`${path}/`)
  );

  if (!isProtectedPath) {
    return NextResponse.next();
  }

  const cookieValue = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = cookieValue ? decodeSession(cookieValue) : null;

  if (!session || session.role !== "hospital_staff") {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*", "/settings/:path*", "/help/:path*"],
};
