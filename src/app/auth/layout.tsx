import type { Metadata } from "next";
import { ReactNode } from "react";
import { newsreader } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "Giriş Yap",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <div className={newsreader.variable}>{children}</div>;
}