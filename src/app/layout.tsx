import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import {
  absoluteUrl,
  siteDescription,
  siteName,
  siteTagline,
  siteTitle,
  siteUrl,
} from "@/lib/site";

// Variable font (100-900) served from Google Fonts by next/font.
// `latin-ext` is required for Turkish glyphs (ğ, ş, İ, Ğ, Ş) and is
// preloaded together with `latin`.
const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  applicationName: siteName,
  publisher: siteName,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: absoluteUrl("/"),
    siteName,
    title: siteTitle,
    description: `${siteTagline} ${siteDescription}`,
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: `${siteTagline} ${siteDescription}`,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large" as const,
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  other: {
    "google-site-verification":
      "PFqJVM9KwOTEeT1tsU4-8Yul2eh5aHK9h6tZd_oNMFU",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#EEF3F5",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body
        className={`${inter.variable} ${inter.className} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
