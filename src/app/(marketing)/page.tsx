import type { Metadata } from "next";
import Link from "next/link";
import {
  FeatureGrid,
  LinkButton,
  Section,
  SectionHeading,
  StepList,
} from "@/components/marketing/sections";
import { CtaBanner, PageHero, RelatedLinks } from "@/components/marketing/blocks";
import JsonLd from "@/components/marketing/JsonLd";
import {
  organizationSchema,
  softwareApplicationSchema,
  websiteSchema,
} from "@/components/marketing/structuredData";
import { blogPosts, getBlogPostPath } from "@/lib/blog";
import {
  productPages,
  siteDescription,
  siteName,
  siteTagline,
  siteTitle,
} from "@/lib/site";

const panelFeatures = [
  {
    title: "Cari hesap yönetimi",
    description:
      "Müşteri ve tedarikçi hesaplarını tek listede tutun; hesap bilgilerini, durumunu ve hareketlerini aynı ekranda görün.",
  },
  {
    title: "Borç ve alacak takibi",
    description:
      "Hareketler kaydedildikçe hesap bakiyesi güncellenir. Panel özetinde toplam alacak, toplam borç ve net bakiye birlikte görünür.",
  },
  {
    title: "Stok yönetimi",
    description:
      "Ürünleri kategori ve depo bazında tanımlayın, stok giriş ve çıkışlarını ürün bazında izleyin.",
    points: ["Kritik seviyenin altına düşen ürünler ayrı görünür"],
  },
  {
    title: "Fatura yönetimi",
    description:
      "Satış ve alış faturalarını kalemli olarak oluşturun, taslak kaydedin, vade tarihiyle izleyin.",
    points: ["Fatura kaydedildiğinde cari hareket otomatik oluşur"],
  },
  {
    title: "Tahsilat takibi",
    description:
      "Tahsilat ve ödemeleri kaydedin; kısmi ödemeleri ilgili faturayla eşleştirerek açık faturaları doğru takip edin.",
  },
  {
    title: "Satış takibi",
    description:
      "Hızlı satış ekranında ürün arayın veya barkod okutun; satış kaydedildiğinde stok ve cari hareket birlikte işlenir.",
  },
  {
    title: "Finansal hareketler",
    description:
      "Kasa ve banka hesaplarını tanımlayın, günlük para hareketlerini ve vadeli çek-senet kayıtlarını izleyin.",
  },
  {
    title: "Raporlama",
    description:
      "Ürün bazlı satış, dönemsel kâr-zarar ve cari bakiye raporlarını görüntüleyin.",
    points: ["Listeleri Excel veya PDF olarak dışa aktarın"],
  },
];

const workFlowSteps = [
  {
    title: "Cari hesabı oluşturun",
    description:
      "Müşteri veya tedarikçi hesabını bilgileriyle kaydedin. Aktif ve pasif hesapları ayırarak listeyi düzenli tutun.",
  },
  {
    title: "Faturayı kesin",
    description:
      "Satış faturasını kalemleriyle oluşturun. Fatura kaydedildiği anda ilgili cari hesaba borç kaydı işlenir.",
  },
  {
    title: "Stok hareketini izleyin",
    description:
      "Faturaya eklenen ürünlerin stok miktarı düşer; ürün bazında hareket geçmişini görebilirsiniz.",
  },
  {
    title: "Tahsilatı eşleştirin",
    description:
      "Gelen ödemeyi kaydedin ve kapatacağı faturayı seçin. Kısmi ödemelerde kalan tutar açık kalır.",
  },
  {
    title: "Durumu raporlayın",
    description:
      "Panel özeti ve raporlar üzerinden alacak, borç, stok değeri ve satış tablosunu değerlendirin.",
  },
];

const accessNotes = [
  {
    title: "Tarayıcıdan erişim",
    description:
      "CariOnline tarayıcı üzerinden çalışır; ayrı bir kurulum adımı gerekmez.",
  },
  {
    title: "İşletme bazlı veri ayrımı",
    description:
      "Her işletmenin kayıtları kendi hesabı altında tutulur; kullanıcılar yalnızca yetkili oldukları işletmenin verisini görür.",
  },
  {
    title: "Oturum güvenliği",
    description:
      "Panele erişim oturum doğrulamasıyla korunur. Oturum açmadan uygulama sayfalarına erişilemez.",
  },
];

export const metadata: Metadata = {
  title: {
    absolute: siteTitle,
  },
  description: siteDescription,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: "/",
    siteName,
    title: siteTitle,
    description: `${siteTagline} ${siteDescription}`,
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: `${siteTagline} ${siteDescription}`,
  },
};

export default function HomePage() {
  return (
    <>
      <JsonLd
        data={[
          organizationSchema(),
          websiteSchema(),
          softwareApplicationSchema({
            name: "Online Cari Hesap ve Ön Muhasebe Programı",
            description: siteDescription,
            path: "/",
            featureList: panelFeatures.map((feature) => feature.title),
          }),
        ]}
      />

      <PageHero
        eyebrow="İşletme yönetim platformu"
        title="Online Cari Hesap ve Ön Muhasebe Programı"
        lead="Cari hesap, stok, fatura, tahsilat ve finansal hareketlerinizi tek panelden yönetin. CariOnline ile işletmenizin operasyonu daha net ve düzenli takip edilir."
        meta="Tüm operasyonu tek panelde yönet."
        actions={
          <>
            <LinkButton href="/auth/signup" label="Hesap oluştur" />
            <LinkButton
              href="/cari-hesap-programi"
              label="Cari hesap programı"
              variant="outline"
            />
          </>
        }
      />

      <Section>
        <SectionHeading
          eyebrow="Panel"
          title="Tek panelde birleşen iş akışı"
          description="Cari hesap, stok, fatura ve tahsilat kayıtları birbirinden bağımsız ilerlemez. Aynı işlem içinde oluşan hareketler birbirini etkiler; böylece hangi verinin güncel olduğunu aramak zorunda kalmazsınız."
        />
        <FeatureGrid items={panelFeatures} />
      </Section>

      <Section muted>
        <SectionHeading
          eyebrow="İş akışı"
          title="Günlük işleyiş nasıl ilerliyor?"
          description="Kayıt sırası, panelin veriyi nasıl birleştirdiğini gösterir."
        />
        <StepList items={workFlowSteps} />
      </Section>

      <Section>
        <SectionHeading
          eyebrow="Erişim"
          title="Panele erişim ve veri ayrımı"
          description="İşletme verisi, oturum doğrulaması ve işletme bazlı ayrım ile korunur."
        />
        <FeatureGrid items={accessNotes} />
      </Section>

      <Section muted>
        <RelatedLinks
          title="Programları inceleyin"
          description="Her modülün ayrıntılarını kendi sayfasında bulabilirsiniz."
          items={productPages.map((page) => ({
            href: page.href,
            label: page.title,
            description: page.description,
          }))}
        />
      </Section>

      <Section>
        <SectionHeading
          eyebrow="Blog"
          title="Ön muhasebe rehberleri"
          description="Cari hesap, borç-alacak ve stok takibi konularında temel bilgiler."
        />
        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {blogPosts.map((post) => (
            <li key={post.slug}>
              <Link
                href={getBlogPostPath(post.slug)}
                className="block rounded-2xl border border-white bg-white p-5 transition-colors hover:border-[#b7dfe0] hover:bg-[#f7fbfc]"
              >
                <span className="block text-base font-semibold text-[#176B87]">
                  {post.title}
                </span>
                <span className="mt-2 block text-sm leading-6 text-[#4d6472]">
                  {post.excerpt}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section muted>
        <CtaBanner
          title="Cari hesaplarınızı tek panelden yönetmeye başlayın."
          description="Cari hesaplar, stok, faturalar, tahsilat ve raporlama tek iş akışında. Hesabınızı oluşturup paneli kullanmaya başlayabilirsiniz."
          primary={{ label: "Hesap oluştur", href: "/auth/signup" }}
          secondary={{ label: "Giriş yap", href: "/auth/signin" }}
        />
      </Section>
    </>
  );
}