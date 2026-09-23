import type { MetadataRoute } from "next";
import { blogPosts, getBlogPostPath } from "@/lib/blog";
import { absoluteUrl, productPages } from "@/lib/site";

/**
 * Only public marketing / SEO pages are listed. Authenticated application
 * routes (dashboard, current accounts, inventory, invoices, finance, reports)
 * are excluded on purpose.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...productPages.map((page) => ({
      url: absoluteUrl(page.href),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    {
      url: absoluteUrl("/blog"),
      lastModified,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  const blogEntries: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: absoluteUrl(getBlogPostPath(post.slug)),
    lastModified: new Date(
      `${post.dateModified ?? post.datePublished}T00:00:00Z`
    ),
    changeFrequency: "yearly",
    priority: 0.6,
  }));

  return [...staticEntries, ...blogEntries];
}