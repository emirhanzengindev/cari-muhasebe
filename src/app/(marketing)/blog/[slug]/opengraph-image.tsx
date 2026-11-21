import { renderOgImage, ogContentType, ogSize } from "@/lib/og";
import { blogPosts, getBlogPost } from "@/lib/blog";

export const alt = "CariOnline Blog yazısı";
export const size = ogSize;
export const contentType = ogContentType;

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  return renderOgImage({
    eyebrow: post ? `Blog · ${post.readingMinutes} dk okuma` : "Blog",
    title: post?.title ?? "CariOnline Blog",
  });
}
