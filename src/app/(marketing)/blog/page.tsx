import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/marketing/blocks";
import { Section } from "@/components/marketing/sections";
import JsonLd from "@/components/marketing/JsonLd";
import { breadcrumbSchema } from "@/components/marketing/structuredData";
import { blogPosts, formatPostDate, getBlogPostPath } from "@/lib/blog";

const description =
  "Cari hesap, borç ve alacak takibi, stok takibi ve ön muhasebe konularında CariOnline rehberleri. İşletme süreçlerinizi daha düzenli yönetmek için temel bilgiler.";

export const metadata: Metadata = {
  title: "Blog",
  description,
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: "/blog",
    title: "Blog | CariOnline",
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog | CariOnline",
    description,
  },
};

export default function BlogIndexPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Ana sayfa", path: "/" },
          { name: "Blog", path: "/blog" },
        ])}
      />

      <PageHero
        eyebrow="Rehberler"
        title="CariOnline Blog"
        lead="Cari hesap, borç ve alacak takibi, stok yönetimi ve ön muhasebe süreçlerine dair temel bilgiler. Yazılar, günlük işleyişte karşılaşılan soruları sade biçimde ele alır."
      />

      <Section>
        <ul className="border-t border-co-line">
          {blogPosts.map((post, index) => (
            <li key={post.slug} className="border-b border-co-line">
              <article className="group relative grid gap-3 py-8 sm:grid-cols-[80px_1fr_auto] sm:gap-8">
                <span
                  aria-hidden="true"
                  className="font-serif text-sm text-co-muted sm:pt-2"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h2 className="font-serif text-[26px] font-normal leading-tight tracking-[-0.01em] text-co-ink">
                    <Link
                      href={getBlogPostPath(post.slug)}
                      className="after:absolute after:inset-0 after:content-['']"
                    >
                      {post.title}
                    </Link>
                  </h2>
                  <p className="mt-2.5 max-w-2xl text-[14.5px] leading-6 text-co-ink-soft">
                    {post.excerpt}
                  </p>
                  <p className="mt-3 text-xs text-co-ink-soft">
                    <time dateTime={post.datePublished}>
                      {formatPostDate(post.datePublished)}
                    </time>
                    {" · "}
                    {post.readingMinutes} dk okuma
                  </p>
                </div>
                <span
                  aria-hidden="true"
                  className="hidden pt-2 text-lg text-co-muted transition-transform duration-200 group-hover:translate-x-1 group-hover:text-co-ink sm:block"
                >
                  →
                </span>
              </article>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}