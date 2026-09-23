import Link from "next/link";
import type { ReactNode } from "react";

export const marketingContainer = "mx-auto w-full max-w-6xl px-5 sm:px-8";

type HeadingLevel = 2 | 3;

function Heading({
  level,
  children,
  className,
}: {
  level: HeadingLevel;
  children: ReactNode;
  className?: string;
}) {
  const Tag = (`h${level}`) as "h2" | "h3";
  return <Tag className={className}>{children}</Tag>;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  level = 2,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  level?: HeadingLevel;
  align?: "left" | "center";
}) {
  return (
    <div
      className={
        align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"
      }
    >
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#176B87]">
          {eyebrow}
        </p>
      ) : null}
      <Heading
        level={level}
        className={
          level === 2
            ? "mt-2 text-2xl font-bold tracking-tight text-[#122B3A] sm:text-3xl"
            : "mt-2 text-lg font-semibold tracking-tight text-[#122B3A]"
        }
      >
        {title}
      </Heading>
      {description ? (
        <p className="mt-3 text-base leading-7 text-[#4d6472]">{description}</p>
      ) : null}
    </div>
  );
}

export type FeatureItem = {
  title: string;
  description: string;
  points?: string[];
};

export function FeatureGrid({ items }: { items: FeatureItem[] }) {
  return (
    <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <li
          key={item.title}
          className="rounded-2xl border border-white bg-white p-5 shadow-[0_10px_30px_rgba(18,43,58,0.06)]"
        >
          <h3 className="text-base font-semibold text-[#122B3A]">
            {item.title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-[#4d6472]">
            {item.description}
          </p>
          {item.points?.length ? (
            <ul className="mt-3 space-y-1.5">
              {item.points.map((point) => (
                <li
                  key={point}
                  className="flex gap-2 text-sm leading-6 text-[#3c5464]"
                >
                  <span
                    aria-hidden="true"
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#176B87]"
                  />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function StepList({
  items,
}: {
  items: { title: string; description: string }[];
}) {
  return (
    <ol className="mt-8 space-y-4">
      {items.map((item, index) => (
        <li
          key={item.title}
          className="flex gap-4 rounded-2xl border border-[#dbe6ea] bg-white p-5"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#122B3A] text-sm font-bold text-white">
            {index + 1}
          </span>
          <div>
            <h3 className="text-base font-semibold text-[#122B3A]">
              {item.title}
            </h3>
            <p className="mt-1 text-sm leading-6 text-[#4d6472]">
              {item.description}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function Section({
  children,
  muted = false,
  className = "",
}: {
  children: ReactNode;
  muted?: boolean;
  className?: string;
}) {
  return (
    <section className={muted ? `bg-white ${className}` : className}>
      <div className={`${marketingContainer} py-12 sm:py-16`}>{children}</div>
    </section>
  );
}

export function BodyCopy({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={`mt-4 text-base leading-7 text-[#4d6472] ${className}`}>
      {children}
    </p>
  );
}

export function LinkButton({
  href,
  label,
  variant = "primary",
}: {
  href: string;
  label: string;
  variant?: "primary" | "outline";
}) {
  const className =
    variant === "primary"
      ? "inline-flex items-center rounded-xl bg-[#176B87] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0f526b]"
      : "inline-flex items-center rounded-xl border border-[#176B87] px-5 py-3 text-sm font-semibold text-[#176B87] transition-colors hover:bg-white";

  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}