import { ImageResponse } from "next/og";
import { siteName, siteUrl } from "@/lib/site";

const siteHost = new URL(siteUrl).host;

/** Paylaşım görselleri (Open Graph / X) için ortak boyut ve tür. */
export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

/**
 * Sitenin koyu manzaralı hero diliyle 1200x630 paylaşım görseli üretir.
 * Yazı tipi next/og'un varsayılanı (Geist): Türkçe harfleri destekler ama ₺
 * işaretini içermez (görselde kullanmayın; yoksa build yazı tipi indirmeye çalışır).
 */
export function renderOgImage({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  const titleSize = title.length > 48 ? 58 : title.length > 30 ? 68 : 78;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          color: "#ffffff",
          background:
            "radial-gradient(ellipse 60% 55% at 78% 18%, rgba(140,170,70,0.55), transparent 70%), radial-gradient(ellipse 55% 50% at 20% 85%, rgba(150,90,50,0.45), transparent 70%), linear-gradient(180deg, #2c3a1f 0%, #141a0f 100%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: "#d9f53b",
              color: "#16201c",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            C
          </div>
          <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: -0.5 }}>{siteName}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", maxWidth: 980 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 24, color: "rgba(255,255,255,0.72)" }}>
            <div style={{ width: 10, height: 10, borderRadius: 999, background: "#d9f53b" }} />
            {eyebrow}
          </div>
          <div
            style={{
              marginTop: 20,
              fontSize: titleSize,
              lineHeight: 1.08,
              letterSpacing: -2,
              fontWeight: 600,
            }}
          >
            {title}
          </div>
          {subtitle ? (
            <div style={{ marginTop: 22, fontSize: 28, lineHeight: 1.4, color: "rgba(255,255,255,0.78)" }}>
              {subtitle}
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, color: "rgba(255,255,255,0.6)" }}>
          <div>{siteHost}</div>
          <div>Cari · Stok · Fatura · Tahsilat</div>
        </div>
      </div>
    ),
    ogSize
  );
}
