import type { ComponentType } from "react";

export type BlogPostMeta = {
  slug: string;
  /** H1 + <title> base used by the Metadata API. */
  title: string;
  /** Meta description (also used for Open Graph / Twitter cards). */
  description: string;
  /** Short summary used in the blog index and in related post lists. */
  excerpt: string;
  /** ISO date (YYYY-MM-DD). */
  datePublished: string;
  dateModified?: string;
  keywords: string[];
  /** Reading time in minutes, shown in the article header. */
  readingMinutes: number;
  /** Public CariOnline pages this article links to. */
  relatedPages: string[];
};

export type BlogPost = BlogPostMeta & {
  /** Server rendered article body. */
  Content: ComponentType;
};