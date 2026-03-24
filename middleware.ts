import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/privacy", "/terms"];
const AUTH_PATH_PREFIX = "/auth";

function hasSupabaseAuthCookie(request: NextRequest) {
  return request.cookies
    .getAll()
    .some(({ name }) => name.startsWith("sb-") && name.includes("auth-token"));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthPage = pathname.startsWith(AUTH_PATH_PREFIX);
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
  const hasSessionCookie = hasSupabaseAuthCookie(request);

  if (!hasSessionCookie && !isAuthPage && !isPublicPath) {
    return NextResponse.redirect(new URL("/auth/signin", request.url));
  }

  if (hasSessionCookie && isAuthPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
