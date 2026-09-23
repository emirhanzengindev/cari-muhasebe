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
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {blogPosts.map((post) => (
            <li key={post.slug}>
              <article className="flex h-full flex-col rounded-2xl border border-white bg-white p-6 shadow-[0_10px_30px_rgba(18,43,58,0.06)]">
                <h2 className="text-lg font-semibold leading-snug text-[#122B3A]">
                  <Link
                    href={getBlogPostPath(post.slug)}
                    className="transition-colors hover:text-[#176B87]"
                  >
                    {post.title}
                  </Link>
                </h2>
                <p className="mt-3 flex-1 text-sm leading-6 text-[#4d6472]">
                  {post.excerpt}
                </p>
                <p className="mt-4 text-xs text-[#5b7382]">
                  <time dateTime={post.datePublished}>
                    {formatPostDate(post.datePublished)}
                  </time>
                  {" · "}
                  {post.readingMinutes} dk okuma
                </p>
              </article>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}