/**
 * Oturum gerektiren uygulama alanı. Hem proxy (giriş yönlendirmesi) hem de
 * robots.txt (Disallow) bu listeyi kullanır; yeni bir uygulama modülü
 * eklendiğinde buraya da eklenmeli.
 */
export const PROTECTED_PATHS = [
  "/dashboard",
  "/current-accounts",
  "/inventory",
  "/invoices",
  "/quick-sales",
  "/finance",
  "/reports",
] as const;

export function isProtectedPath(pathname: string) {
  return PROTECTED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}
