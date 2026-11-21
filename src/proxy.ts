import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isProtectedPath } from "@/lib/routes";

/**
 * Yalnızca uygulama alanı (src/lib/routes.ts) korunur. Buradaki kontrol
 * "iyimser"dir (çerez var mı); asıl yetki kontrolü (app)/layout içindeki
 * ProtectedPage ve API rotalarındaki Supabase oturum doğrulamasıdır.
 *
 * Listede olmayan yollar (pazarlama sayfaları, blog ve bilinmeyen adresler)
 * olduğu gibi geçer; böylece olmayan bir sayfa giriş sayfasına yönlenmek
 * yerine gerçek 404 döner.
 */
const AUTH_PATH_PREFIX = "/auth";
const AUTHENTICATED_HOME = "/dashboard";

function hasSupabaseAuthCookie(request: NextRequest) {
  return request.cookies
    .getAll()
    .some(({ name }) => name.startsWith("sb-") && name.includes("auth-token"));
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSessionCookie = hasSupabaseAuthCookie(request);

  if (!hasSessionCookie && isProtectedPath(pathname)) {
    return NextResponse.redirect(new URL("/auth/signin", request.url));
  }

  if (hasSessionCookie && pathname.startsWith(AUTH_PATH_PREFIX)) {
    return NextResponse.redirect(new URL(AUTHENTICATED_HOME, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
