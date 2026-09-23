"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import TenantSwitcher from "@/components/TenantSwitcher";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Boxes,
  Building2,
  CircleDollarSign,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ShoppingCart,
  UserRound,
} from "lucide-react";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { user, isLoading, logout } = useAuth();

  useEffect(() => {
    const checkIsMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const navigation: { name: string; href: string; icon: LucideIcon }[] = [
    { name: "Panel", href: "/dashboard", icon: LayoutDashboard },
    { name: "Cari Hesaplar", href: "/current-accounts", icon: Building2 },
    { name: "Stok Yonetimi", href: "/inventory", icon: Boxes },
    { name: "Faturalar", href: "/invoices", icon: FileText },
    { name: "Hizli Satis", href: "/quick-sales", icon: ShoppingCart },
    { name: "Finans", href: "/finance", icon: CircleDollarSign },
    { name: "Raporlar", href: "/reports", icon: BarChart3 },
  ];

  return (
    <div className="flex h-screen bg-[var(--background)]">
      <div
        className={`${sidebarOpen ? "w-64" : "w-0 md:w-20"} ${
          isMobile && !sidebarOpen ? "hidden" : "block"
        } bg-[#122b3a] text-slate-200 shadow-[8px_0_30px_rgba(18,43,58,0.08)] transition-all duration-300 ease-in-out overflow-hidden fixed md:relative z-50 h-full`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-4 py-5 border-b border-white/10">
            {sidebarOpen ? (
              <div className="flex items-center gap-3 whitespace-nowrap">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#d9f1f1] text-[#122b3a]"><CircleDollarSign size={20} /></div>
                <div><h1 className="text-sm font-bold tracking-wide text-white">On Muhasebe</h1><p className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-slate-400">Business OS</p></div>
              </div>
            ) : (
              <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-[#d9f1f1] text-[#122b3a]"><CircleDollarSign size={20} /></div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white md:hidden"
              aria-label={sidebarOpen ? "Menuyu kapat" : "Menuyu ac"}
            >
              {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-6">
            <p className={`${sidebarOpen ? "px-3" : "text-center"} mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500`}>Workspace</p>
            <ul className="space-y-1.5">
              {navigation.map((item) => (
                <li key={item.name}>
                  {(() => { const Icon = item.icon; const active = pathname === item.href; return (
                  <Link
                    href={item.href}
                    title={!sidebarOpen ? item.name : undefined}
                    className={`group flex items-center rounded-xl px-3 py-3 text-sm font-medium transition-all ${active ? "bg-[#d9f1f1] text-[#122b3a] shadow-sm" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}
                    onClick={() => isMobile && setSidebarOpen(false)}
                  >
                    <Icon size={19} strokeWidth={active ? 2.4 : 2} />
                    {sidebarOpen && <span className="ml-3 whitespace-nowrap">{item.name}</span>}
                  </Link>
                  ); })()}
                </li>
              ))}
            </ul>
          </nav>

          <div className="border-t border-white/10 p-3">
            <div className={`flex items-center ${sidebarOpen ? "justify-between" : "justify-center"} rounded-xl bg-white/5 p-2`}>
              <div className="flex items-center">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e7c88a] text-sm font-bold text-[#122b3a]">
                  {user?.name?.charAt(0) || "U"}
                </div>
                {sidebarOpen && (
                  <div className="ml-3">
                    <p className="max-w-[135px] truncate text-xs font-semibold text-white">{user?.email || user?.name || "Kullanici"}</p>
                    <p className="mt-0.5 text-[11px] text-slate-400">Hesabiniz</p>
                  </div>
                )}
              </div>
              <div className="relative">
                <button onClick={logout} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white" title="Cikis yap" aria-label="Cikis yap">
                  <LogOut size={17} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed left-4 top-4 z-50 rounded-xl bg-[#122b3a] p-3 text-white shadow-lg md:hidden"
          aria-label="Menuyu ac"
        >
          <Menu size={19} />
        </button>
      )}

      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 z-40 bg-[#122b3a]/50 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden transition-all duration-300 md:ml-0">
        <header className="z-30 border-b border-[var(--line)] bg-[var(--surface)]/95 backdrop-blur">
          <div className="flex min-h-[76px] items-center justify-between px-5 py-4 sm:px-8">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">On Muhasebe</p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-[#182230]">
              {navigation.find((item) => item.href === pathname)?.name || "Ana Sayfa"}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 text-xs text-[var(--muted)] sm:flex"><UserRound size={15} /><span>Calisma alani</span></div>
              <TenantSwitcher />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-[var(--background)] p-5 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
