import type { ReactNode } from "react";
import SiteFooter from "@/components/marketing/SiteFooter";
import SiteHeader from "@/components/marketing/SiteHeader";

export default function MarketingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#EEF3F5] text-[#122B3A]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-[#122B3A] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        İçeriğe geç
      </a>
      <SiteHeader />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}