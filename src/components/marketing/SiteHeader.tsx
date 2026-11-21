import Link from "next/link";
import { marketingNav, siteName } from "@/lib/site";

export function ArrowIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
      className={`${className} transition-transform group-hover:translate-x-[3px]`}
    >
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}

export function Logo({
  tone = "light",
  size = "md",
}: {
  tone?: "light" | "dark";
  size?: "md" | "lg";
}) {
  return (
    <Link
      href="/"
      aria-label={`${siteName} ana sayfa`}
      className={`flex items-center gap-2.5 font-serif font-medium tracking-[-0.01em] ${
        tone === "light" ? "text-white" : "text-co-ink"
      } ${size === "lg" ? "text-[30px]" : "text-[17px] sm:text-[19px]"}`}
    >
      <span
        aria-hidden="true"
        className={`grid place-items-center rounded-[7px] bg-co-lime font-sans font-semibold text-co-ink ${
          size === "lg" ? "h-[34px] w-[34px] text-base" : "h-[26px] w-[26px] text-[13px]"
        }`}
      >
        C
      </span>
      {siteName}
    </Link>
  );
}

/**
 * Koyu hero üzerine binen saydam menü. Kapsayıcının `relative` olması ve
 * ilk bölümün koyu bir hero olması beklenir (bkz. PageHero).
 */
export default function SiteHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-20 border-b border-white/12">
      <div className="mx-auto flex h-[68px] w-full max-w-[1180px] items-center justify-between gap-4 px-4 sm:px-8">
        <Logo />

        <nav aria-label="Ana menü" className="hidden gap-[30px] lg:flex">
          {marketingNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-white/80 transition-colors hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2.5">
          <Link
            href="/auth/signin"
            className="whitespace-nowrap rounded-full border border-white/55 px-3 py-2 text-[12.5px] font-medium text-white transition-colors hover:bg-white/12 sm:px-4 sm:text-[13px]"
          >
            Giriş Yap
          </Link>
          <Link
            href="/auth/signup"
            className="group inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-co-lime px-3 py-2 text-[12.5px] font-medium text-co-ink transition-colors hover:bg-co-lime-dark sm:px-4 sm:text-[13px]"
          >
            Hesap Oluştur
            <span className="hidden sm:inline">
              <ArrowIcon />
            </span>
          </Link>
        </div>
      </div>

      <nav aria-label="Ana menü (mobil)" className="border-t border-white/10 lg:hidden">
        <div className="mx-auto flex w-full max-w-[1180px] gap-5 overflow-x-auto px-4 py-2.5 sm:px-8">
          {marketingNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap text-[13px] text-white/75 transition-colors hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
