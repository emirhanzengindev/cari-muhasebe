import Link from "next/link";
import type { ReactNode } from "react";
import { forestBackground } from "@/components/marketing/blocks";
import { ArrowIcon } from "@/components/marketing/SiteHeader";

/**
 * Small typography kit so blog articles keep a consistent, calm reading
 * rhythm and remain plain server components.
 */

export function Lead({ children }: { children: ReactNode }) {
  return (
    <p className="font-serif text-[21px] font-light leading-[1.55] text-co-ink">
      {children}
    </p>
  );
}

export function P({ children }: { children: ReactNode }) {
  return <p className="mt-5 text-[16px] leading-[1.8] text-[#3d4641]">{children}</p>;
}

export function H2({
  children,
  id,
}: {
  children: ReactNode;
  id?: string;
}) {
  return (
    <h2
      id={id}
      className="mt-14 font-serif text-[28px] font-normal leading-tight tracking-[-0.015em] text-co-ink sm:text-[32px]"
    >
      {children}
    </h2>
  );
}

export function H3({
  children,
  id,
}: {
  children: ReactNode;
  id?: string;
}) {
  return (
    <h3 id={id} className="mt-9 font-serif text-[21px] font-normal leading-snug text-co-ink">
      {children}
    </h3>
  );
}

export function UL({ children }: { children: ReactNode }) {
  return <ul className="mt-5 space-y-2.5">{children}</ul>;
}

export function OL({ children }: { children: ReactNode }) {
  return <ol className="mt-5 list-decimal space-y-2.5 pl-6">{children}</ol>;
}

export function LI({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-3 text-[16px] leading-[1.75] text-[#3d4641]">
      <span
        aria-hidden="true"
        className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-co-lime-dark"
      />
      <span>{children}</span>
    </li>
  );
}

export function OLI({ children }: { children: ReactNode }) {
  return (
    <li className="pl-1 text-[16px] leading-[1.75] text-[#3d4641] marker:font-serif marker:text-co-ink-soft">
      {children}
    </li>
  );
}

export function InternalLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="font-medium text-co-ink underline decoration-co-lime-dark decoration-2 underline-offset-[3px] transition-colors hover:decoration-co-ink"
    >
      {children}
    </Link>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return (
    <div className="mt-8 rounded-xl border border-[#ebe4cc] bg-co-cream p-5 text-[15px] leading-7 text-co-ink">
      {children}
    </div>
  );
}

export function ArticleCta({ children }: { children: ReactNode }) {
  return (
    <div className={`mt-14 rounded-2xl px-6 py-9 text-white sm:px-9 ${forestBackground}`}>
      <h2 className="font-serif text-[26px] font-normal leading-tight">
        CariOnline&apos;ı deneyin
      </h2>
      <div className="mt-3 text-[15px] leading-7 text-white/75">{children}</div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/auth/signup"
          className="group inline-flex items-center gap-2 rounded-full bg-co-lime px-5 py-3 text-sm font-medium text-co-ink transition-colors hover:bg-co-lime-dark"
        >
          Hesap oluştur
          <ArrowIcon />
        </Link>
        <Link
          href="/cari-hesap-programi"
          className="inline-flex items-center rounded-full border border-white/55 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
        >
          Cari hesap programı
        </Link>
      </div>
    </div>
  );
}
