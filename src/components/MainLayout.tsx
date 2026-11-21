"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Boxes,
  CircleDollarSign,
  FileText,
  LayoutGrid,
  LogOut,
  Menu,
  ShoppingCart,
  Users,
  X,
} from "lucide-react";

const navigation: { name: string; href: string; icon: LucideIcon }[] = [
  { name: "Panel", href: "/dashboard", icon: LayoutGrid },
  { name: "Cari Hesaplar", href: "/current-accounts", icon: Users },
  { name: "Stok Yönetimi", href: "/inventory", icon: Boxes },
  { name: "Faturalar", href: "/invoices", icon: FileText },
  { name: "Hızlı Satış", href: "/quick-sales", icon: ShoppingCart },
  { name: "Finans", href: "/finance", icon: CircleDollarSign },
  { name: "Raporlar", href: "/reports", icon: BarChart3 },
];

const shortcuts = [
  { name: "Yeni Fatura", href: "/invoices/new", color: "#f59e0b" },
  { name: "Yeni Cari Hesap", href: "/current-accounts/new", color: "var(--app-accent)" },
  { name: "Ürün Ekle", href: "/inventory", color: "#7c3aed" },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--app-bg)]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--app-line)] border-t-[var(--app-accent)]" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <AppShell userLabel={user.email || user.name || "Kullanıcı"} onLogout={logout}>
      {children}
    </AppShell>
  );
}

/** Kenar menü + içerik kabuğu. Oturum bilgisini MainLayout verir. */
export function AppShell({
  userLabel,
  onLogout,
  children,
}: {
  userLabel: string;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const [menuOpen, setMenuOpen] = useState(false);

  // Mobilde sayfa değişince menüyü kapat.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="flex h-dvh gap-3 bg-[var(--app-bg)] p-0 text-[13px] text-[var(--app-ink)] md:p-3">
      {/* ---------- Kenar menü ---------- */}
      <aside
        id="app-sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-[var(--app-line)] bg-white p-3 transition-transform duration-300 md:static md:z-auto md:w-[248px] md:shrink-0 md:translate-x-0 md:rounded-2xl md:border ${
          menuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-2.5 rounded-[10px] border border-[var(--app-line)] p-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--app-accent)] text-white">
            <CircleDollarSign size={16} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <b className="block text-[13px] font-semibold">CariOnline</b>
            <small className="text-[11.5px] text-[var(--app-ink-3)]">Ön Muhasebe</small>
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            className="ml-auto rounded-md p-1.5 text-[var(--app-ink-3)] hover:bg-[#f7f7f8] hover:text-[var(--app-ink)] md:hidden"
            aria-label="Menüyü kapat"
          >
            <X size={16} />
          </button>
        </div>

        <nav aria-label="Ana menü" className="mt-[22px] flex-1 overflow-y-auto">
          <ul className="grid gap-0.5">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-2.5 rounded-lg border px-2.5 py-2 font-medium transition-colors ${
                      active
                        ? "border-[var(--app-line)] bg-white text-[var(--app-ink)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                        : "border-transparent text-[var(--app-ink-2)] hover:bg-[#f7f7f8] hover:text-[var(--app-ink)]"
                    }`}
                  >
                    <Icon size={16} strokeWidth={active ? 2.2 : 1.8} aria-hidden="true" />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>

          <h2 className="mx-2.5 mb-2 mt-[26px] text-[11.5px] font-medium text-[var(--app-ink-3)]">Kısayollar</h2>
          <ul className="grid gap-0.5">
            {shortcuts.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[var(--app-ink-2)] transition-colors hover:bg-[#f7f7f8] hover:text-[var(--app-ink)]"
                >
                  <i className="h-2.5 w-2.5 rounded-[3px]" style={{ background: item.color }} aria-hidden="true" />
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-3 flex items-center gap-2.5 rounded-[10px] p-2">
          <span
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#e3a008] text-[11.5px] font-semibold text-white"
            aria-hidden="true"
          >
            {(userLabel.charAt(0) || "U").toLocaleUpperCase("tr-TR")}
          </span>
          <div className="min-w-0">
            <b className="block max-w-[140px] truncate text-[12.5px] font-semibold" title={userLabel}>
              {userLabel}
            </b>
            <small className="text-[11.5px] text-[var(--app-ink-3)]">Hesabınız</small>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="ml-auto rounded-lg p-2 text-[var(--app-ink-3)] transition-colors hover:bg-[#f7f7f8] hover:text-[var(--app-ink)]"
            title="Çıkış yap"
            aria-label="Çıkış yap"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] md:hidden"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ---------- İçerik ---------- */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-white md:rounded-2xl md:border md:border-[var(--app-line)]">
        <div className="flex items-center gap-3 border-b border-[var(--app-line)] px-4 py-3 md:hidden">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="rounded-lg border border-[var(--app-line)] p-2 text-[var(--app-ink-2)]"
            aria-label="Menüyü aç"
            aria-controls="app-sidebar"
            aria-expanded={menuOpen}
          >
            <Menu size={18} />
          </button>
          <b className="text-[14px] font-semibold">
            {navigation.find((item) => isActive(item.href))?.name ?? "CariOnline"}
          </b>
        </div>
        <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-7 sm:py-[26px]">{children}</main>
      </div>
    </div>
  );
}
