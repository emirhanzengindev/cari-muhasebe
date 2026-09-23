import {
  absoluteUrl,
  siteDescription,
  siteName,
  siteTagline,
  siteUrl,
} from "@/lib/site";

/**
 * Structured data builders. Only facts that are verifiable in the application
 * are described (no ratings, prices, offers or unsupported schema types).
 */

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    url: siteUrl,
    description: siteDescription,
    slogan: siteTagline,
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: siteUrl,
    inLanguage: "tr-TR",
    description: siteDescription,
  };
}

export function softwareApplicationSchema({
  name,
  description,
  path,
  featureList,
}: {
  name: string;
  description: string;
  path: string;
  featureList: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `${name} - ${siteName}`,
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "Ön muhasebe, cari hesap ve stok yönetimi",
    operatingSystem: "Web tarayıcı",
    url: absoluteUrl(path),
    description,
    inLanguage: "tr-TR",
    featureList,
    publisher: {
      "@type": "Organization",
      name: siteName,
      url: siteUrl,
    },
  };
}

export function articleSchema({
  headline,
  description,
  path,
  datePublished,
  dateModified,
  keywords,
}: {
  headline: string;
  description: string;
  path: string;
  datePublished: string;
  dateModified?: string;
  keywords?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    inLanguage: "tr-TR",
    datePublished,
    dateModified: dateModified ?? datePublished,
    keywords: keywords?.join(", "),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": absoluteUrl(path),
    },
    author: {
      "@type": "Organization",
      name: siteName,
      url: siteUrl,
    },
    publisher: {
      "@type": "Organization",
      name: siteName,
      url: siteUrl,
    },
  };
}

export function breadcrumbSchema(
  items: { name: string; path: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}