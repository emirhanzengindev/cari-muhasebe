import Link from "next/link";
import type { ReactNode } from "react";
import Mountains, { HeroBackdrop } from "./Mountains";
import { ArrowIcon } from "./SiteHeader";
import { marketingContainer, SectionHeading } from "./sections";

/** Koyu, dağ manzaralı sayfa başlığı. SiteHeader bunun üzerine biner. */
export function PageHero({
  eyebrow,
  title,
  lead,
  meta,
  actions,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  meta?: string;
  actions?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden text-white">
      <HeroBackdrop />
      <Mountains
        idPrefix="ph"
        className="absolute inset-x-0 bottom-0 h-[62%] w-full opacity-90"
      />
      <div className={`${marketingContainer} relative pb-24 pt-40 sm:pb-28 lg:pt-44`}>
        <p className="inline-flex items-center gap-2 text-[12.5px] text-white/70">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-co-lime" />
          {eyebrow}
        </p>
        <h1 className="mt-4 max-w-3xl font-serif text-[36px] font-normal leading-[1.08] tracking-[-0.02em] sm:text-[52px]">
          {title}
        </h1>
        <p className="mt-6 max-w-2xl text-[16px] leading-7 text-white/80">{lead}</p>
        {meta ? <p className="mt-4 text-[13px] text-white/60">{meta}</p> : null}
        {actions ? (
          <div className="mt-8 flex flex-wrap items-center gap-3">{actions}</div>
        ) : null}
      </div>
    </section>
  );
}

export function ChecklistBlock({
  title,
  items,
  description,
}: {
  title: string;
  items: string[];
  description?: string;
}) {
  return (
    <div className="rounded-xl border border-co-line bg-white p-6 sm:p-8">
      <h2 className="font-serif text-[24px] font-normal leading-tight tracking-[-0.01em] text-co-ink">
        {title}
      </h2>
      {description ? (
        <p className="mt-2.5 max-w-3xl text-[14px] leading-6 text-co-ink-soft">
          {description}
        </p>
      ) : null}
      <ul className="mt-5 grid gap-x-8 sm:grid-cols-2">
        {items.map((item) => (
          <li
            key={item}
            className="flex gap-3 border-t border-co-line py-3 text-[14px] leading-6 text-co-ink"
          >
            <span
              aria-hidden="true"
              className="mt-[5px] grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full bg-co-lime"
            >
              <svg viewBox="0 0 12 12" className="h-2 w-2" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2.5 6.5l2.2 2L9.5 3.5" />
              </svg>
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FaqList({
  items,
  title = "Sık sorulan sorular",
}: {
  items: { question: string; answer: string }[];
  title?: string;
}) {
  return (
    <div>
      <SectionHeading eyebrow="SSS" title={title} level={2} />
      <div className="mt-10 grid grid-cols-1 border-l border-t border-co-line sm:grid-cols-2">
        {items.map((item) => (
          <article key={item.question} className="border-b border-r border-co-line bg-white p-6">
            <h3 className="font-serif text-[19px] font-normal leading-snug text-co-ink">
              {item.question}
            </h3>
            <p className="mt-2.5 text-[14px] leading-6 text-co-ink-soft">
              {item.answer}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}

/** Ana sayfadaki "erişim" bölümüyle aynı koyu yeşil zemin. */
export const forestBackground =
  "bg-[radial-gradient(ellipse_50%_45%_at_55%_55%,rgba(150,90,50,0.5),transparent_70%),radial-gradient(ellipse_70%_50%_at_80%_0%,rgba(110,140,60,0.55),transparent_70%),linear-gradient(180deg,#2c3a1f,#141a0f)]";

export function CtaBanner({
  title,
  description,
  primary,
  secondary,
}: {
  title: string;
  description: string;
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
}) {
  return (
    <div className={`overflow-hidden rounded-2xl px-6 py-12 text-white sm:px-12 sm:py-14 ${forestBackground}`}>
      <h2 className="max-w-2xl font-serif text-[30px] font-normal leading-[1.1] tracking-[-0.02em] sm:text-[38px]">
        {title}
      </h2>
      <p className="mt-4 max-w-2xl text-[15px] leading-7 text-white/75">
        {description}
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Link
          href={primary.href}
          className="group inline-flex items-center gap-2 rounded-full bg-co-lime px-5 py-3 text-sm font-medium text-co-ink transition-colors hover:bg-co-lime-dark"
        >
          {primary.label}
          <ArrowIcon />
        </Link>
        {secondary ? (
          <Link
            href={secondary.href}
            className="inline-flex items-center rounded-full border border-white/55 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            {secondary.label}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export function RelatedLinks({
  title = "İlgili sayfalar",
  description,
  items,
}: {
  title?: string;
  description?: string;
  items: { href: string; label: string; description?: string }[];
}) {
  return (
    <div>
      <SectionHeading
        eyebrow="Bağlantılar"
        title={title}
        description={description}
        level={2}
      />
      <ul className="mt-10 grid grid-cols-1 gap-x-14 sm:grid-cols-2">
        {items.map((item) => (
          <li
            key={item.href}
            className="border-b border-co-line first:border-t sm:nth-2:border-t"
          >
            <Link
              href={item.href}
              className="group flex items-start justify-between gap-6 py-5 transition-[padding] duration-200 hover:pl-2"
            >
              <span>
                <span className="block font-serif text-[20px] leading-snug text-co-ink">
                  {item.label}
                </span>
                {item.description ? (
                  <span className="mt-1 block text-[13.5px] leading-6 text-co-ink-soft">
                    {item.description}
                  </span>
                ) : null}
              </span>
              <span
                aria-hidden="true"
                className="mt-1 text-co-muted transition-transform duration-200 group-hover:translate-x-1 group-hover:text-co-ink"
              >
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
