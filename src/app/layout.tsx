import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Geist yerine Inter fontunu kullan
import "./globals.css";
import MainLayout from "@/components/MainLayout";
import dynamic from "next/dynamic";

const Providers = dynamic(() => import("@/components/Providers"), { ssr: false });

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Ön Muhasebe SaaS Platformu",
  description: "KOBİ'ler için kapsamlı ön muhasebe çözümü",
  other: {
    "google-site-verification": "PFqJVM9KwOTEeT1tsU4-8Yul2eh5aHK9h6tZd_oNMFU"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased`}
      >
        <Providers>
          <MainLayout>{children}</MainLayout>
        </Providers>
      </body>
    </html>
  );
}