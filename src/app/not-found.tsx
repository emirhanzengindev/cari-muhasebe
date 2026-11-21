import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/marketing/blocks";
import { LinkButton, marketingContainer } from "@/components/marketing/sections";
import SiteFooter, { CreamBand } from "@/components/marketing/SiteFooter";
import SiteHeader from "@/components/marketing/SiteHeader";
import { newsreader } from "@/lib/fonts";
import { blogIndexPath } from "@/lib/blog";
import { productPages } from "@/lib/site";

// Next.js de noindex ekler; root layout'taki "index, follow" ile çelişmesin diye açıkça eziyoruz.
export const metadata: Metadata = {
  title: "Sayfa bulunamadı",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div
      className={`${newsreader.variable} relative flex min-h-screen flex-col overflow-x-clip bg-white font-sans text-co-ink antialiased`}
    >
      <SiteHeader />
      <main id="main-content" className="flex-1">
        <PageHero
          eyebrow="404"
          title="Aradığınız sayfa bulunamadı"
          lead="Bağlantı eskimiş ya da adres yanlış yazılmış olabilir. Aşağıdaki sayfalardan devam edebilirsiniz."
          actions={
            <>
              <LinkButton href="/" label="Ana sayfaya dön" />
              <LinkButton href={blogIndexPath} label="Blog" variant="outline" />
            </>
          }
        />
        <section className={`${marketingContainer} py-14`}>
          <h2 className="font-serif text-[24px] font-normal text-co-ink">Programlar</h2>
          <ul className="mt-6 grid grid-cols-1 gap-x-14 sm:grid-cols-2">
            {productPages.map((page) => (
              <li key={page.href} className="border-b border-co-line first:border-t sm:nth-2:border-t">
                <Link href={page.href} className="group flex items-start justify-between gap-6 py-4">
                  <span>
                    <span className="block font-serif text-[19px] text-co-ink">{page.title}</span>
                    <span className="mt-1 block text-[13.5px] leading-6 text-co-ink-soft">{page.description}</span>
                  </span>
                  <span aria-hidden="true" className="mt-1 text-co-muted transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <CreamBand>
        <SiteFooter />
      </CreamBand>
    </div>
  );
}
