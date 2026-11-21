import type { ReactNode } from "react";
import SiteFooter, { CreamBand } from "@/components/marketing/SiteFooter";
import SiteHeader from "@/components/marketing/SiteHeader";
import { newsreader } from "@/lib/fonts";

export default function MarketingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div
      className={`${newsreader.variable} relative flex min-h-screen flex-col overflow-x-clip bg-white font-sans text-co-ink antialiased`}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-co-ink focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        İçeriğe geç
      </a>
      <SiteHeader />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <CreamBand>
        <SiteFooter />
      </CreamBand>
    </div>
  );
}
