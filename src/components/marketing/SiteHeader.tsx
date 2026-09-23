import Link from "next/link";
import { CircleDollarSign } from "lucide-react";
import { marketingNav, siteName } from "@/lib/site";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#dbe6ea] bg-[#EEF3F5]/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-1 py-1"
          aria-label={`${siteName} ana sayfa`}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#176B87] text-white">
            <CircleDollarSign size={20} aria-hidden="true" />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-bold tracking-wide text-[#122B3A]">
              {siteName}
            </span>
            <span className="block text-[10px] uppercase tracking-[0.18em] text-[#5b7382]">
              İşletme Yönetimi
            </span>
          </span>
        </Link>

        <nav aria-label="Ana menü" className="hidden items-center gap-1 lg:flex">
          {marketingNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-[#3c5464] transition-colors hover:bg-white hover:text-[#122B3A]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/auth/signin"
            className="rounded-lg px-3 py-2 text-sm font-semibold text-[#176B87] transition-colors hover:bg-white"
          >
            Giriş Yap
          </Link>
          <Link
            href="/auth/signup"
            className="rounded-lg bg-[#176B87] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0f526b]"
          >
            Hesap Oluştur
          </Link>
        </div>
      </div>

      <nav
        aria-label="Ana menü (mobil)"
        className="border-t border-[#dbe6ea] lg:hidden"
      >
        <div className="mx-auto flex w-full max-w-6xl gap-1 overflow-x-auto px-5 py-2 sm:px-8">
          {marketingNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold text-[#3c5464] transition-colors hover:bg-white hover:text-[#122B3A]"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}