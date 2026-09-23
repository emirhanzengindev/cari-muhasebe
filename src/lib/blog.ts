import type { ComponentType } from "react";
import type { BlogPost, BlogPostMeta } from "@/content/blog/types";
import CariHesapNedirContent, {
  meta as cariHesapNedirMeta,
} from "@/content/blog/cari-hesap-nedir";
import CariHesapTakibiContent, {
  meta as cariHesapTakibiMeta,
} from "@/content/blog/cari-hesap-takibi-nasil-yapilir";
import BorcAlacakTakibiContent, {
  meta as borcAlacakTakibiMeta,
} from "@/content/blog/borc-alacak-takibi";
import StokTakibiContent, {
  meta as stokTakibiMeta,
} from "@/content/blog/stok-takibi-nasil-yapilir";
import OnMuhasebeContent, {
  meta as onMuhasebeMeta,
} from "@/content/blog/on-muhasebe-programi-nedir";

type RegisteredPost = BlogPostMeta & { Content: ComponentType };

const registeredPosts: RegisteredPost[] = [
  { ...cariHesapNedirMeta, Content: CariHesapNedirContent },
  { ...cariHesapTakibiMeta, Content: CariHesapTakibiContent },
  { ...borcAlacakTakibiMeta, Content: BorcAlacakTakibiContent },
  { ...stokTakibiMeta, Content: StokTakibiContent },
  { ...onMuhasebeMeta, Content: OnMuhasebeContent },
].filter(Boolean) as RegisteredPost[];

/** Blog posts sorted newest first. */
export const blogPosts: BlogPost[] = [...registeredPosts].sort((a, b) =>
  b.datePublished.localeCompare(a.datePublished)
);

export const blogIndexPath = "/blog";

export function getBlogPostPath(slug: string) {
  return `${blogIndexPath}/${slug}`;
}

export function getBlogPost(slug: string) {
  return blogPosts.find((post) => post.slug === slug);
}

export function getBlogSlugs() {
  return blogPosts.map((post) => post.slug);
}

const dateFormatter = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function formatPostDate(isoDate: string) {
  const parsed = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return dateFormatter.format(parsed);
}