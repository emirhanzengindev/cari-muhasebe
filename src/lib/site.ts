/**
 * Central site configuration for SEO metadata, structured data and internal linking.
 * Only imported from server components / server-only modules so the resolved URL
 * is computed at build time and never shipped to the browser bundle.
 */

const FALLBACK_SITE_URL = "https://cari-muhasebe-alpha.vercel.app";

function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function resolveSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  // The production deployment URL wins over a local development value.
  const vercelUrl =
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
    process.env.VERCEL_URL?.trim();

  if (explicit && !/localhost|127\.0\.0\.1/.test(explicit)) {
    return stripTrailingSlash(explicit);
  }

  if (vercelUrl) {
    return `https://${stripTrailingSlash(vercelUrl)}`;
  }

  return explicit ? stripTrailingSlash(explicit) : FALLBACK_SITE_URL;
}

export const siteUrl = resolveSiteUrl();

export const siteName = "CariOnline";

export const siteTagline = "Tüm operasyonu tek panelde yönet.";

export const siteTitle =
  "Online Cari Hesap ve Ön Muhasebe Programı | CariOnline";

export const siteDescription =
  "Cari hesap, stok, fatura ve tahsilat işlemlerinizi tek panelden yönetin. CariOnline ile işletmenizin operasyonunu daha net ve düzenli takip edin.";

export const twitterHandle = "";

export function absoluteUrl(path = "/") {
  if (/^https?:\/\//i.test(path)) return path;
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export type ProductPageLink = {
  href: string;
  title: string;
  shortTitle: string;
  description: string;
};

/** Public product pages, reused for navigation, footer and internal linking. */
export const productPages: ProductPageLink[] = [
  {
    href: "/cari-hesap-programi",
    title: "Cari Hesap Programı",
    shortTitle: "Cari Hesap",
    description:
      "Müşteri ve tedarikçi hesaplarını, borç ve alacak hareketlerini tek ekranda takip edin.",
  },
  {
    href: "/stok-takip-programi",
    title: "Stok Takip Programı",
    shortTitle: "Stok Takip",
    description:
      "Ürün, kategori ve depolarınızı yönetin; stok hareketlerini ve kritik seviyeleri izleyin.",
  },
  {
    href: "/fatura-programi",
    title: "Online Fatura Programı",
    shortTitle: "Fatura",
    description:
      "Satış ve alış faturalarını kalemleriyle oluşturun, cari hareketlerle birlikte takip edin.",
  },
  {
    href: "/tahsilat-takip-programi",
    title: "Tahsilat Takip Programı",
    shortTitle: "Tahsilat",
    description:
      "Tahsilat ve ödemeleri cari hesaba işleyin, açık faturaları ve bakiyeleri izleyin.",
  },
];

export function getProductPage(href: string) {
  return productPages.find((page) => page.href === href);
}

/** Header navigation for the public marketing pages. */
export const marketingNav: { label: string; href: string }[] = [
  ...productPages.map((page) => ({ label: page.shortTitle, href: page.href })),
  { label: "Blog", href: "/blog" },
];