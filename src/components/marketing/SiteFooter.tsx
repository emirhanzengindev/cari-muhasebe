import Link from "next/link";
import { blogPosts, getBlogPostPath } from "@/lib/blog";
import { productPages, siteName, siteTagline } from "@/lib/site";
import { Logo } from "./SiteHeader";

const linkClass = "font-serif text-[15px] text-co-ink hover:underline";

/** Krem footer. Arka planı saydamdır; krem zemini kapsayıcı verir (bkz. CreamBand). */
export default function SiteFooter() {
  return (
    <footer className="relative border-t border-[#e6e0cc] pb-9 pt-16 sm:pt-[70px]">
      <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1.3fr_0.8fr]">
          <div>
            <Logo tone="dark" size="lg" />
            <p className="mt-4 max-w-[300px] text-[13.5px] leading-relaxed text-co-ink-soft">
              Cari hesap, stok, fatura, tahsilat ve raporlamayı tek panelde
              birleştiren ön muhasebe platformu.
            </p>
          </div>

          <nav aria-labelledby="footer-program">
            <h2 id="footer-program" className="mb-[18px] text-[12.5px] text-co-ink-soft">
              Programlar
            </h2>
            <ul className="grid gap-2.5">
              {productPages.map((page) => (
                <li key={page.href}>
                  <Link href={page.href} className={linkClass}>
                    {page.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-blog">
            <h2 id="footer-blog" className="mb-[18px] text-[12.5px] text-co-ink-soft">
              Blog
            </h2>
            <ul className="grid gap-2.5">
              {blogPosts.map((post) => (
                <li key={post.slug}>
                  <Link href={getBlogPostPath(post.slug)} className={linkClass}>
                    {post.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-hesap">
            <h2 id="footer-hesap" className="mb-[18px] text-[12.5px] text-co-ink-soft">
              Hesap
            </h2>
            <ul className="grid gap-2.5">
              <li>
                <Link href="/auth/signin" className={linkClass}>
                  Giriş Yap
                </Link>
              </li>
              <li>
                <Link href="/auth/signup" className={linkClass}>
                  Hesap Oluştur
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-14 flex flex-col gap-3 text-xs text-co-ink-soft sm:mt-20 sm:flex-row sm:justify-between">
          <span>{siteTagline}</span>
          <span>
            © {new Date().getFullYear()} {siteName}. Tüm hakları saklıdır.
          </span>
        </div>
      </div>
    </footer>
  );
}

/** Krem zemin + sol altta noktalı doku. CTA ve footer'ı birlikte sarar. */
export function CreamBand({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden bg-co-cream">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-50 [background-image:radial-gradient(rgba(60,60,40,0.18)_1px,transparent_1.2px)] [background-size:7px_7px] [mask-image:radial-gradient(ellipse_50%_60%_at_15%_75%,#000,transparent_70%)]"
      />
      {children}
    </div>
  );
}
