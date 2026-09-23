import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero, RelatedLinks } from "@/components/marketing/blocks";
import { Section } from "@/components/marketing/sections";
import JsonLd from "@/components/marketing/JsonLd";
import {
  articleSchema,
  breadcrumbSchema,
} from "@/components/marketing/structuredData";
import {
  blogPosts,
  formatPostDate,
  getBlogPost,
  getBlogPostPath,
} from "@/lib/blog";
import { getProductPage } from "@/lib/site";

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    return {
      title: "Yazı bulunamadı",
      robots: { index: false, follow: false },
    };
  }

  const canonical = getBlogPostPath(post.slug);

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      locale: "tr_TR",
      url: canonical,
      title: post.title,
      description: post.description,
      publishedTime: post.datePublished,
      modifiedTime: post.dateModified ?? post.datePublished,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

function resolveLinkLabel(href: string) {
  const product = getProductPage(href);
  if (product) return product.title;

  const post = blogPosts.find((item) => getBlogPostPath(item.slug) === href);
  if (post) return post.title;

  return href;
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    notFound();
  }

  const { Content } = post;
  const canonical = getBlogPostPath(post.slug);
  const publishedLabel = formatPostDate(post.datePublished);

  const relatedItems = [
    ...post.relatedPages.map((href) => ({
      href,
      label: resolveLinkLabel(href),
      description: undefined,
    })),
    {
      href: "/blog",
      label: "Tüm yazılar",
      description: "CariOnline blog yazılarının tamamını görüntüleyin.",
    },
  ];

  return (
    <>
      <JsonLd
        data={[
          articleSchema({
            headline: post.title,
            description: post.description,
            path: canonical,
            datePublished: post.datePublished,
            dateModified: post.dateModified,
            keywords: post.keywords,
          }),
          breadcrumbSchema([
            { name: "Ana sayfa", path: "/" },
            { name: "Blog", path: "/blog" },
            { name: post.title, path: canonical },
          ]),
        ]}
      />

      <PageHero
        eyebrow="Blog"
        title={post.title}
        lead={post.excerpt}
        meta={`${publishedLabel} · ${post.readingMinutes} dk okuma`}
      />

      <Section>
        <div className="mx-auto max-w-3xl">
          <nav aria-label="Site yolu" className="mb-6 text-sm text-[#5b7382]">
            <Link href="/" className="hover:text-[#176B87]">
              Ana sayfa
            </Link>
            <span className="mx-2" aria-hidden="true">
              /
            </span>
            <Link href="/blog" className="hover:text-[#176B87]">
              Blog
            </Link>
          </nav>
          <Content />
        </div>
      </Section>

      <Section muted>
        <RelatedLinks
          description="Bu yazıyla ilgili CariOnline sayfaları ve diğer rehberler."
          items={relatedItems}
        />
      </Section>
    </>
  );
}