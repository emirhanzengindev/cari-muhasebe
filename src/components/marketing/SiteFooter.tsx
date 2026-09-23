import Link from "next/link";
import { CircleDollarSign } from "lucide-react";
import { blogPosts, getBlogPostPath } from "@/lib/blog";
import { productPages, siteName, siteTagline } from "@/lib/site";

export default function SiteFooter() {
  return (
    <footer className="border-t border-[#dbe6ea] bg-white">
      <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <div>
            <Link href="/" className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#176B87] text-white">
                <CircleDollarSign size={20} aria-hidden="true" />
              </span>
              <span className="text-sm font-bold tracking-wide text-[#122B3A]">
                {siteName}
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-[#4d6472]">
              {siteTagline} Cari hesap, stok, fatura, tahsilat ve raporlama
              süreçlerini tek panelde birleştiren ön muhasebe platformu.
            </p>
          </div>

          <nav aria-labelledby="footer-program">
            <h2
              id="footer-program"
              className="text-sm font-semibold text-[#122B3A]"
            >
              Program
            </h2>
            <ul className="mt-4 space-y-2">
              {productPages.map((page) => (
                <li key={page.href}>
                  <Link
                    href={page.href}
                    className="text-sm text-[#4d6472] transition-colors hover:text-[#176B87]"
                  >
                    {page.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-blog">
            <h2 id="footer-blog" className="text-sm font-semibold text-[#122B3A]">
              Blog
            </h2>
            <ul className="mt-4 space-y-2">
              {blogPosts.map((post) => (
                <li key={post.slug}>
                  <Link
                    href={getBlogPostPath(post.slug)}
                    className="text-sm text-[#4d6472] transition-colors hover:text-[#176B87]"
                  >
                    {post.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-[#dbe6ea] pt-6 text-xs text-[#5b7382] sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {siteName}
          </p>
          <div className="flex gap-4">
            <Link href="/auth/signin" className="hover:text-[#176B87]">
              Giriş yap
            </Link>
            <Link href="/auth/signup" className="hover:text-[#176B87]">
              Hesap oluştur
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}