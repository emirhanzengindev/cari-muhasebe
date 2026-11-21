import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/marketing/blocks";
import { Section } from "@/components/marketing/sections";
import { H2, LI, Lead, P, UL } from "@/content/blog/prose";
import { formatLegalDate, legalInfo, legalInfoComplete, privacyPath, termsPath } from "@/lib/legal";

const title = "Kullanım Koşulları";
const description = "CariOnline hizmetini kullanırken geçerli olan kurallar, sorumluluklar ve hesap koşulları.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: termsPath },
  robots: legalInfoComplete ? { index: true, follow: true } : { index: false, follow: true },
};

const linkClass = "font-medium text-co-ink underline decoration-co-lime-dark underline-offset-4";

export default function TermsPage() {
  return (
    <>
      <PageHero
        eyebrow="Yasal"
        title={title}
        lead="CariOnline'a hesap oluşturarak veya hizmeti kullanarak aşağıdaki koşulları kabul etmiş olursunuz."
        meta={`Son güncelleme: ${formatLegalDate(legalInfo.lastUpdated)}`}
      />
      <Section>
        <div className="mx-auto max-w-[720px]">
          <Lead>
            Bu koşullar, {legalInfo.controllerName} tarafından sunulan CariOnline çevrim içi ön muhasebe hizmetinin
            kullanımını düzenler.
          </Lead>

          <H2 id="hizmet">1. Hizmetin kapsamı</H2>
          <P>
            CariOnline; cari hesap, stok, fatura, tahsilat ve ödeme kayıtlarınızı tutmanızı ve raporlamanızı
            sağlayan bir yazılımdır. Hizmet, resmî e-Fatura/e-Arşiv entegrasyonu ya da mali müşavirlik hizmeti
            yerine geçmez; yasal defter ve beyan yükümlülükleriniz size aittir.
          </P>

          <H2 id="hesap">2. Hesap ve güvenlik</H2>
          <UL>
            <LI>Kayıt sırasında doğru ve güncel bilgi vermeniz gerekir.</LI>
            <LI>Şifrenizin gizliliğinden ve hesabınızla yapılan işlemlerden siz sorumlusunuz.</LI>
            <LI>Hesabınızda yetkisiz bir kullanım fark ederseniz bize hemen bildirin.</LI>
          </UL>

          <H2 id="veriler">3. Verileriniz</H2>
          <P>
            Uygulamaya girdiğiniz tüm kayıtlar size aittir. Bu kayıtlardaki müşteri ve tedarikçi bilgilerini
            işlerken KVKK dahil ilgili mevzuata uymak sizin sorumluluğunuzdadır. Kişisel verilerin nasıl
            işlendiğini{" "}
            <Link href={privacyPath} className={linkClass}>
              Gizlilik Politikası
            </Link>{" "}
            sayfasında açıklıyoruz.
          </P>

          <H2 id="kullanim">4. Kabul edilemez kullanım</H2>
          <UL>
            <LI>Hizmeti hukuka aykırı amaçlarla veya başkalarının haklarını ihlal edecek şekilde kullanmak,</LI>
            <LI>Sisteme yetkisiz erişim denemek, güvenlik önlemlerini aşmaya çalışmak,</LI>
            <LI>Hizmetin işleyişini bozacak yoğunlukta otomatik istek göndermek.</LI>
          </UL>
          <P>Bu durumlarda hesabınız uyarı yapılmaksızın askıya alınabilir.</P>

          <H2 id="sorumluluk">5. Sorumluluğun sınırlandırılması</H2>
          <P>
            Hizmeti kesintisiz ve hatasız sunmak için makul özeni gösteririz; ancak hizmet &quot;olduğu gibi&quot;
            sunulur. Verilerinizin düzenli yedeğini almanızı öneririz. Kanunen izin verilen ölçüde, dolaylı
            zararlardan ve kâr kaybından sorumlu değiliz.
          </P>

          <H2 id="degisiklik">6. Değişiklikler ve fesih</H2>
          <P>
            Bu koşullar güncellenebilir; önemli değişiklikleri site üzerinden duyururuz. Hesabınızı dilediğiniz
            zaman kapatabilirsiniz.
          </P>

          <H2 id="iletisim">7. İletişim ve uygulanacak hukuk</H2>
          <P>
            Sorularınız için <strong className="text-co-ink">{legalInfo.email}</strong> adresine yazabilirsiniz. Bu
            koşullar Türkiye Cumhuriyeti hukukuna tabidir.
          </P>
        </div>
      </Section>
    </>
  );
}
