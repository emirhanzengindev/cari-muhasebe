import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/marketing/blocks";
import { Section } from "@/components/marketing/sections";
import { H2, LI, Lead, P, UL } from "@/content/blog/prose";
import { formatLegalDate, legalInfo, legalInfoComplete, privacyPath, termsPath } from "@/lib/legal";

const title = "Gizlilik Politikası ve KVKK Aydınlatma Metni";
const description =
  "CariOnline'ın hangi kişisel verileri hangi amaçla işlediği, nerede sakladığı ve KVKK kapsamındaki haklarınız.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: privacyPath },
  robots: legalInfoComplete ? { index: true, follow: true } : { index: false, follow: true },
};

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        eyebrow="Yasal"
        title={title}
        lead="6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında sizi bilgilendirmek için hazırlanmıştır."
        meta={`Son güncelleme: ${formatLegalDate(legalInfo.lastUpdated)}`}
      />
      <Section>
        <div className="mx-auto max-w-[720px]">
          <Lead>
            Bu metin, CariOnline web sitesini ve uygulamasını kullanırken kişisel verilerinizin nasıl işlendiğini
            açıklar.
          </Lead>

          <H2 id="veri-sorumlusu">1. Veri sorumlusu</H2>
          <P>
            Kişisel verileriniz, veri sorumlusu sıfatıyla <strong className="text-co-ink">{legalInfo.controllerName}</strong>{" "}
            ({legalInfo.address}) tarafından işlenir. Sorularınız ve başvurularınız için{" "}
            <strong className="text-co-ink">{legalInfo.email}</strong> adresine yazabilirsiniz.
          </P>

          <H2 id="islenen-veriler">2. İşlenen kişisel veriler</H2>
          <UL>
            <LI>
              <strong className="text-co-ink">Hesap bilgileri:</strong> ad soyad, e-posta adresi, şirket adı ve
              şifre. Şifreler düz metin olarak saklanmaz; kimlik doğrulama sağlayıcısı tarafından tek yönlü
              şifrelenir.
            </LI>
            <LI>
              <strong className="text-co-ink">Uygulamaya girdiğiniz işletme verileri:</strong> cari hesaplar,
              faturalar, stok, tahsilat ve ödeme kayıtları. Bu kayıtlar müşterilerinize veya tedarikçilerinize ait
              ad, telefon, adres ve vergi numarası gibi bilgiler içerebilir.
            </LI>
            <LI>
              <strong className="text-co-ink">Teknik veriler:</strong> oturumun sürdürülmesi için gereken çerezler
              ile güvenlik ve hata tespiti amacıyla tutulan sunucu kayıtları (IP adresi, tarayıcı bilgisi, istek
              zamanı).
            </LI>
          </UL>

          <H2 id="amaclar">3. İşleme amaçları ve hukuki sebepler</H2>
          <UL>
            <LI>Hesabınızın oluşturulması ve hizmetin sunulması (sözleşmenin kurulması ve ifası, KVKK m.5/2-c).</LI>
            <LI>Hizmetin güvenliğinin sağlanması ve kötüye kullanımın önlenmesi (meşru menfaat, KVKK m.5/2-f).</LI>
            <LI>Yasal yükümlülüklerin yerine getirilmesi (KVKK m.5/2-ç).</LI>
          </UL>
          <P>
            Uygulamaya girdiğiniz müşteri ve tedarikçi verileri bakımından veri sorumlusu sizsiniz; CariOnline bu
            verileri yalnızca sizin adınıza ve hizmeti sunmak için işler.
          </P>

          <H2 id="aktarim">4. Verilerin aktarılması ve saklandığı yer</H2>
          <P>
            Hizmet, altyapı sağlayıcıları aracılığıyla sunulur: barındırma için Vercel, veritabanı ve kimlik
            doğrulama için Supabase. Bu sağlayıcıların sunucuları yurt dışında bulunabilir; aktarım KVKK m.9&apos;da
            öngörülen güvencelere uygun olarak yapılır. Verileriniz bunların dışında üçüncü kişilerle paylaşılmaz,
            satılmaz ve reklam amacıyla kullanılmaz; yetkili kamu kurumlarının yasal talepleri saklıdır.
          </P>

          <H2 id="cerezler">5. Çerezler</H2>
          <P>
            Sitede yalnızca oturumunuzu açık tutmak için zorunlu çerezler kullanılır. Analiz, reklam veya takip
            amaçlı çerez kullanılmaz.
          </P>

          <H2 id="saklama">6. Saklama süresi</H2>
          <P>
            Verileriniz hesabınız açık olduğu sürece saklanır. Hesabınızı kapattığınızda, yasal saklama
            yükümlülükleri saklı kalmak kaydıyla silinir veya anonim hâle getirilir.
          </P>

          <H2 id="haklar">7. KVKK kapsamındaki haklarınız</H2>
          <P>KVKK m.11 uyarınca veri sorumlusuna başvurarak şu haklarınızı kullanabilirsiniz:</P>
          <UL>
            <LI>Kişisel verilerinizin işlenip işlenmediğini öğrenme ve işlenmişse bilgi talep etme,</LI>
            <LI>İşlenme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme,</LI>
            <LI>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme,</LI>
            <LI>Eksik veya yanlış işlenmişse düzeltilmesini, şartları oluşmuşsa silinmesini isteme,</LI>
            <LI>Otomatik sistemlerle analiz sonucu aleyhinize bir sonuç çıkmasına itiraz etme,</LI>
            <LI>Kanuna aykırı işleme nedeniyle zarara uğramanız hâlinde zararın giderilmesini talep etme.</LI>
          </UL>
          <P>
            Başvurularınızı <strong className="text-co-ink">{legalInfo.email}</strong> adresine iletebilirsiniz.
            Talepleriniz en geç 30 gün içinde ücretsiz olarak sonuçlandırılır.
          </P>

          <H2 id="degisiklikler">8. Değişiklikler</H2>
          <P>
            Bu metin güncellenebilir; güncel sürüm her zaman bu sayfada yayımlanır. Hizmetin kullanımına ilişkin
            kurallar için{" "}
            <Link href={termsPath} className="font-medium text-co-ink underline decoration-co-lime-dark underline-offset-4">
              Kullanım Koşulları
            </Link>{" "}
            sayfasına bakabilirsiniz.
          </P>
        </div>
      </Section>
    </>
  );
}
