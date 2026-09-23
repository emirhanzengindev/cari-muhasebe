import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Small typography kit so blog articles keep a consistent, calm reading
 * rhythm and remain plain server components.
 */

export function Lead({ children }: { children: ReactNode }) {
  return <p className="text-lg leading-8 text-[#3c5464]">{children}</p>;
}

export function P({ children }: { children: ReactNode }) {
  return <p className="mt-4 text-base leading-7 text-[#4d6472]">{children}</p>;
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
      className="mt-10 text-2xl font-bold tracking-tight text-[#122B3A]"
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
    <h3 id={id} className="mt-8 text-lg font-semibold text-[#122B3A]">
      {children}
    </h3>
  );
}

export function UL({ children }: { children: ReactNode }) {
  return <ul className="mt-4 space-y-2">{children}</ul>;
}

export function OL({ children }: { children: ReactNode }) {
  return <ol className="mt-4 list-decimal space-y-2 pl-5">{children}</ol>;
}

export function LI({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-3 text-base leading-7 text-[#4d6472]">
      <span
        aria-hidden="true"
        className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#176B87]"
      />
      <span>{children}</span>
    </li>
  );
}

export function OLI({ children }: { children: ReactNode }) {
  return (
    <li className="text-base leading-7 text-[#4d6472] marker:text-[#176B87]">
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
      className="font-semibold text-[#176B87] underline decoration-[#b7dfe0] decoration-2 underline-offset-2 transition-colors hover:text-[#0f526b]"
    >
      {children}
    </Link>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return (
    <div className="mt-6 rounded-2xl border border-[#b7dfe0] bg-[#f2fafb] p-5 text-sm leading-6 text-[#3c5464]">
      {children}
    </div>
  );
}

export function ArticleCta({ children }: { children: ReactNode }) {
  return (
    <div className="mt-10 rounded-3xl bg-[#122B3A] px-6 py-8 text-white sm:px-8">
      <h2 className="text-xl font-bold tracking-tight">
        CariOnline&apos;ı deneyin
      </h2>
      <div className="mt-3 text-sm leading-6 text-slate-300">{children}</div>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href="/auth/signup"
          className="inline-flex items-center rounded-xl bg-[#176B87] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0f526b]"
        >
          Hesap oluştur
        </Link>
        <Link
          href="/cari-hesap-programi"
          className="inline-flex items-center rounded-xl border border-white/30 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
        >
          Cari hesap programı
        </Link>
      </div>
    </div>
  );
}