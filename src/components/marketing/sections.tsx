import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowIcon } from "./SiteHeader";

export const marketingContainer = "mx-auto w-full max-w-[1180px] px-4 sm:px-8";

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

/** Küçük yuvarlak ikonlu etiket ("chip"). */
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="inline-flex items-center gap-2 text-[12.5px] text-co-ink-soft">
      <span
        aria-hidden="true"
        className="grid h-[18px] w-[18px] place-items-center rounded-full border border-co-line bg-[#fdfcf5]"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-co-lime-dark" />
      </span>
      {children}
    </p>
  );
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
        align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-[640px]"
      }
    >
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <Heading
        level={level}
        className={
          level === 2
            ? "mt-4 font-serif text-[30px] font-normal leading-[1.12] tracking-[-0.02em] text-co-ink sm:text-[40px]"
            : "mt-3 font-serif text-[22px] font-normal leading-tight text-co-ink"
        }
      >
        {title}
      </Heading>
      {description ? (
        <p className="mt-4 text-[15px] leading-7 text-co-ink-soft">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export type FeatureItem = {
  title: string;
  description: string;
  points?: string[];
};

/** İnce çizgili ızgara (ana sayfadaki modül ızgarası ile aynı dil). */
export function FeatureGrid({ items }: { items: FeatureItem[] }) {
  return (
    <ul className="mt-10 grid grid-cols-1 border-l border-t border-co-line sm:grid-cols-2">
      {items.map((item, index) => (
        <li
          key={item.title}
          className="border-b border-r border-co-line px-6 pb-8 pt-7 transition-colors hover:bg-[#fbfbf6]"
        >
          <span aria-hidden="true" className="block font-serif text-sm text-co-muted">
            {String(index + 1).padStart(2, "0")}
          </span>
          <h3 className="mt-5 font-serif text-[21px] font-normal leading-tight text-co-ink">
            {item.title}
          </h3>
          <p className="mt-2.5 text-[14px] leading-6 text-co-ink-soft">
            {item.description}
          </p>
          {item.points?.length ? (
            <ul className="mt-3 space-y-1.5">
              {item.points.map((point) => (
                <li key={point} className="flex gap-2.5 text-[14px] leading-6 text-co-ink">
                  <span
                    aria-hidden="true"
                    className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-co-lime-dark"
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
    <ol className="mt-10 border-t border-co-line">
      {items.map((item, index) => (
        <li
          key={item.title}
          className="grid grid-cols-[44px_1fr] gap-4 border-b border-co-line py-6 sm:grid-cols-[80px_1fr]"
        >
          <span aria-hidden="true" className="font-serif text-[28px] leading-none text-co-muted">
            {index + 1}
          </span>
          <div>
            <h3 className="font-serif text-[20px] font-normal leading-tight text-co-ink">
              {item.title}
            </h3>
            <p className="mt-1.5 max-w-2xl text-[14px] leading-6 text-co-ink-soft">
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
    <section className={`${muted ? "bg-co-paper" : ""} ${className}`}>
      <div className={`${marketingContainer} py-16 sm:py-24`}>{children}</div>
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
    <p className={`mt-5 max-w-3xl text-[15px] leading-7 text-co-ink-soft ${className}`}>
      {children}
    </p>
  );
}

/**
 * Hap biçimli buton. `outline` metin rengini üst öğeden alır; böylece hem
 * koyu hero'da (beyaz) hem açık bölümlerde (koyu) doğru görünür.
 */
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
      ? "group inline-flex items-center gap-2 rounded-full bg-co-lime px-5 py-3 text-sm font-medium text-co-ink transition-colors hover:bg-co-lime-dark"
      : "inline-flex items-center rounded-full border border-current/55 px-5 py-3 text-sm font-medium transition-colors hover:bg-current/10";

  return (
    <Link href={href} className={className}>
      {label}
      {variant === "primary" ? <ArrowIcon /> : null}
    </Link>
  );
}
