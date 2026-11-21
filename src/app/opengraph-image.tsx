import { renderOgImage, ogContentType, ogSize } from "@/lib/og";
import { siteTagline, siteTitle } from "@/lib/site";

export const alt = siteTitle;
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOgImage({
    eyebrow: "Online ön muhasebe",
    title: "Online Cari Hesap ve Ön Muhasebe Programı",
    subtitle: siteTagline,
  });
}
