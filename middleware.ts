import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Public marketing / SEO paths. Everything else is treated as the private
 * application area and requires a Supabase session cookie.
 */
const PUBLIC_PATHS = [
  "/cari-hesap-programi",
  "/stok-takip-programi",
  "/fatura-programi",
  "/tahsilat-takip-programi",
  "/blog",
  "/privacy",
  "/terms",
];
const AUTH_PATH_PREFIX = "/auth";
const AUTHENTICATED_HOME = "/dashboard";

function hasSupabaseAuthCookie(request: NextRequest) {
  return request.cookies
    .getAll()
    .some(({ name }) => name.startsWith("sb-") && name.includes("auth-token"));
}

function isPublicPath(pathname: string) {
  if (pathname === "/") return true;
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthPage = pathname.startsWith(AUTH_PATH_PREFIX);
  const isPublic = isPublicPath(pathname);
  const hasSessionCookie = hasSupabaseAuthCookie(request);

  if (!hasSessionCookie && !isAuthPage && !isPublic) {
    return NextResponse.redirect(new URL("/auth/signin", request.url));
  }

  if (hasSessionCookie && isAuthPage) {
    return NextResponse.redirect(new URL(AUTHENTICATED_HOME, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
