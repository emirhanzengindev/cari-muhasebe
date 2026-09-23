import Link from "next/link";
import type { ReactNode } from "react";
import { marketingContainer, SectionHeading } from "./sections";

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
    <section className="border-b border-[#dbe6ea] bg-white">
      <div className={`${marketingContainer} py-12 sm:py-16`}>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#176B87]">
          {eyebrow}
        </p>
        <h1 className="mt-3 max-w-3xl text-3xl font-bold leading-tight tracking-tight text-[#122B3A] sm:text-5xl">
          {title}
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-[#4d6472]">{lead}</p>
        {meta ? <p className="mt-4 text-sm text-[#5b7382]">{meta}</p> : null}
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
    <div className="rounded-2xl border border-[#dbe6ea] bg-[#EEF3F5] p-6">
      <h2 className="text-xl font-bold tracking-tight text-[#122B3A]">
        {title}
      </h2>
      {description ? (
        <p className="mt-2 text-sm leading-6 text-[#4d6472]">{description}</p>
      ) : null}
      <ul className="mt-4 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-sm leading-6 text-[#3c5464]">
            <span
              aria-hidden="true"
              className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#176B87]"
            />
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
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <article
            key={item.question}
            className="rounded-2xl border border-white bg-white p-5"
          >
            <h3 className="text-base font-semibold text-[#122B3A]">
              {item.question}
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#4d6472]">
              {item.answer}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}

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
    <div className="rounded-3xl bg-[#122B3A] px-6 py-10 text-white sm:px-10">
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
      <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">
        {description}
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link
          href={primary.href}
          className="inline-flex items-center rounded-xl bg-[#176B87] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0f526b]"
        >
          {primary.label}
        </Link>
        {secondary ? (
          <Link
            href={secondary.href}
            className="inline-flex items-center rounded-xl border border-white/30 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
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
      <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="block rounded-2xl border border-white bg-white p-5 transition-colors hover:border-[#b7dfe0] hover:bg-[#f7fbfc]"
            >
              <span className="block text-base font-semibold text-[#176B87]">
                {item.label}
              </span>
              {item.description ? (
                <span className="mt-1 block text-sm leading-6 text-[#4d6472]">
                  {item.description}
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}