import { renderOgImage, ogContentType, ogSize } from "@/lib/og";
import { getProductPage } from "@/lib/site";

const page = getProductPage("/cari-hesap-programi");

export const alt = page?.title ?? "CariOnline";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOgImage({
    eyebrow: "Program",
    title: page?.title ?? "CariOnline",
    subtitle: page?.description,
  });
}
