import { renderOgImage, ogContentType, ogSize } from "@/lib/og";

export const alt = "CariOnline Blog";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOgImage({
    eyebrow: "Blog",
    title: "Cari, stok ve ön muhasebe rehberleri",
    subtitle: "İşletme süreçlerini daha düzenli yönetmek için temel bilgiler.",
  });
}
