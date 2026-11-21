import Link from "next/link";
import type { ReactNode } from "react";
import Mountains, { HeroBackdrop } from "@/components/marketing/Mountains";
import { Logo } from "@/components/marketing/SiteHeader";

const modules = [
  "Cari hesaplar",
  "Stok yönetimi",
  "Faturalar",
  "Hızlı satış",
  "Kasa & banka",
  "Raporlar",
];

/**
 * Giriş / kayıt ekranlarının ortak iskeleti: solda koyu manzaralı tanıtım
 * paneli, sağda form. Mobilde sol panel kısa bir başlık şeridine dönüşür.
 */
export default function AuthShell({
  title,
  description,
  topLink,
  children,
}: {
  title: string;
  description: string;
  topLink: { prompt: string; label: string; href: string };
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-screen grid-rows-[auto_1fr] bg-white font-sans text-co-ink antialiased lg:grid-cols-[1.05fr_1fr] lg:grid-rows-1">
      {/* Sol panel */}
      <aside className="relative overflow-hidden text-white">
        <HeroBackdrop />
        <Mountains
          idPrefix="auth"
          className="absolute inset-x-0 bottom-0 h-[55%] w-full lg:h-[48%]"
        />
        <div className="relative flex h-full flex-col px-5 py-6 sm:px-10 lg:px-14 lg:py-10">
          <Logo />

          <div className="pb-10 pt-10 lg:my-auto lg:pb-40 lg:pt-16">
            <p className="inline-flex items-center gap-2 text-[12.5px] text-white/70">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-co-lime" />
              Ön muhasebe paneli
            </p>
            <p className="mt-4 max-w-md font-serif text-[30px] font-normal leading-[1.1] tracking-[-0.02em] sm:text-[44px]">
              Tüm operasyonu tek panelde yönetin.
            </p>
            <p className="mt-5 hidden max-w-sm text-[15px] leading-7 text-white/75 sm:block">
              Cari, stok, fatura ve tahsilat hareketleri birbirini otomatik
              günceller.
            </p>
            <ul className="mt-8 hidden max-w-sm grid-cols-2 gap-x-6 gap-y-3 lg:grid">
              {modules.map((m) => (
                <li key={m} className="flex items-center gap-2.5 text-[14px] text-white/80">
                  <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-co-lime" />
                  {m}
                </li>
              ))}
            </ul>
          </div>

          <p className="relative mt-auto hidden items-center gap-2 text-xs text-white/65 lg:flex">
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <rect x="3" y="7" width="10" height="7" rx="1.5" />
              <path d="M5 7V5a3 3 0 016 0v2" />
            </svg>
            Oturum doğrulaması ve işletme bazlı veri ayrımı
          </p>
        </div>
      </aside>

      {/* Form alanı */}
      <main className="flex flex-col px-5 py-6 sm:px-10 lg:px-14 lg:py-10">
        <p className="text-right text-[13.5px] text-co-ink-soft">
          {topLink.prompt}{" "}
          <Link
            href={topLink.href}
            className="font-medium text-co-ink underline decoration-co-lime-dark decoration-2 underline-offset-[3px] hover:decoration-co-ink"
          >
            {topLink.label}
          </Link>
        </p>

        <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-10 lg:py-16">
          <h1 className="font-serif text-[34px] font-normal leading-[1.1] tracking-[-0.02em] text-co-ink sm:text-[40px]">
            {title}
          </h1>
          <p className="mt-3 text-[14.5px] leading-6 text-co-ink-soft">{description}</p>
          <div className="mt-9">{children}</div>
        </div>

        <p className="text-center text-xs text-co-ink-soft lg:text-left">
          <Link href="/" className="hover:text-co-ink hover:underline">
            ← Ana sayfaya dön
          </Link>
        </p>
      </main>
    </div>
  );
}

/** Ortak form öğesi sınıfları. */
export const authInputClass =
  "h-12 w-full rounded-lg border border-co-line bg-white px-4 text-[15px] text-co-ink outline-none transition placeholder:text-co-muted focus:border-co-ink focus:ring-4 focus:ring-co-lime/40";

export const authLabelClass = "mb-2 block text-[13px] font-medium text-co-ink";

export const authSubmitClass =
  "group flex h-12 w-full items-center justify-center gap-2 rounded-full bg-co-lime text-[15px] font-medium text-co-ink transition-colors hover:bg-co-lime-dark disabled:cursor-wait disabled:opacity-60";

export function AuthAlert({
  tone,
  children,
}: {
  tone: "error" | "success";
  children: ReactNode;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`mb-6 rounded-lg border px-4 py-3 text-[14px] leading-6 ${
        tone === "error"
          ? "border-[#f0c4bf] bg-[#fbeceb] text-[#8a2219]"
          : "border-[#cfe8bd] bg-[#eef8e6] text-[#2e5d17]"
      }`}
    >
      {children}
    </div>
  );
}
