/**
 * Yasal metinlerde (Gizlilik Politikası / KVKK, Kullanım Koşulları) kullanılan
 * veri sorumlusu bilgileri. [DOLDUR] ile başlayan alanlar doldurulana kadar
 * sayfalar noindex kalır ve sitemap'e girmez.
 */
export const legalInfo = {
  controllerName: "[DOLDUR: şirket veya şahıs unvanı]",
  address: "[DOLDUR: açık adres]",
  email: "[DOLDUR: iletişim e-postası]",
  /** Metinlerin son güncellenme tarihi (YYYY-MM-DD). */
  lastUpdated: "2026-11-21",
};

export const legalInfoComplete = ![legalInfo.controllerName, legalInfo.address, legalInfo.email].some(
  (value) => value.startsWith("[DOLDUR")
);

export const privacyPath = "/gizlilik-politikasi";
export const termsPath = "/kullanim-kosullari";

export function formatLegalDate(value: string) {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
