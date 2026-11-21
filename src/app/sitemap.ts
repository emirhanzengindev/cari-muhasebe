import type { MetadataRoute } from "next";
import { blogPosts, getBlogPostPath } from "@/lib/blog";
import { legalInfo, legalInfoComplete, privacyPath, termsPath } from "@/lib/legal";
import { absoluteUrl, homeUpdatedAt, productPages } from "@/lib/site";

/**
 * Only public marketing / SEO pages are listed. Authenticated application
 * routes (dashboard, current accounts, inventory, invoices, finance, reports)
 * are excluded on purpose.
 *
 * lastModified always reflects the real content date (never the build time),
 * otherwise search engines learn to ignore it.
 */
const toDate = (value: string) => new Date(`${value}T00:00:00Z`);

export default function sitemap(): MetadataRoute.Sitemap {
  const postDate = (post: (typeof blogPosts)[number]) => post.dateModified ?? post.datePublished;
  const newestPostDate = blogPosts.map(postDate).sort().at(-1) ?? homeUpdatedAt;

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: toDate(homeUpdatedAt),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...productPages.map((page) => ({
      url: absoluteUrl(page.href),
      lastModified: toDate(page.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    {
      url: absoluteUrl("/blog"),
      lastModified: toDate(newestPostDate),
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  const blogEntries: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: absoluteUrl(getBlogPostPath(post.slug)),
    lastModified: toDate(postDate(post)),
    changeFrequency: "yearly",
    priority: 0.6,
  }));

  // Yasal metinler, veri sorumlusu bilgileri doldurulana kadar noindex; sitemap'e de girmez.
  const legalEntries: MetadataRoute.Sitemap = legalInfoComplete
    ? [privacyPath, termsPath].map((path) => ({
        url: absoluteUrl(path),
        lastModified: toDate(legalInfo.lastUpdated),
        changeFrequency: "yearly" as const,
        priority: 0.3,
      }))
    : [];

  return [...staticEntries, ...blogEntries, ...legalEntries];
}
