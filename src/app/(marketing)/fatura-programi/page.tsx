import type { Metadata } from "next";
import {
  BodyCopy,
  FeatureGrid,
  LinkButton,
  Section,
  SectionHeading,
  StepList,
} from "@/components/marketing/sections";
import {
  ChecklistBlock,
  CtaBanner,
  FaqList,
  PageHero,
  RelatedLinks,
} from "@/components/marketing/blocks";
import JsonLd from "@/components/marketing/JsonLd";
import {
  breadcrumbSchema,
  softwareApplicationSchema,
} from "@/components/marketing/structuredData";
import { productPages } from "@/lib/site";

const path = "/fatura-programi";
const description =
  "Online fatura programı ile satış ve alış faturalarını kalemli olarak oluşturun. Faturalar cari hesap ve stok hareketleriyle birlikte takip edilir.";

export const metadata: Metadata = {
  title: "Online Fatura Programı",
  description,
  alternates: { canonical: path },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: path,
    title: "Online Fatura Programı | CariOnline",
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: "Online Fatura Programı | CariOnline",
    description,
  },
};

const invoiceFeatures = [
  {
    title: "Satış ve alış faturaları",
    description:
      "Kesilen ve alınan faturaları aynı listede yönetin; fatura tipine göre filtreleyin.",
  },
  {
    title: "Taslak kayıt",
    description:
      "Hazır olmayan faturayı taslak olarak kaydedin ve listede taslak faturaları ayrı görün.",
  },
  {
    title: "Vade tarihi",
    description:
      "Faturaya vade tarihi ekleyin; açık faturalar ve vadesi geçen tutarlar panelde izlenebilir olsun.",
  },
  {
    title: "Arama ve düzenleme",
    description:
      "Fatura numarası veya cari hesap adıyla arama yapın; kaydı düzenleyip yeniden kaydedin.",
  },
];

const invoiceSteps = [
  {
    title: "Cari hesabı seçin",
    description:
      "Faturanın hangi müşteri veya tedarikçiye ait olduğunu belirtin.",
  },
  {
    title: "Kalemleri ekleyin",
    description:
      "Ürünleri seçip miktar ve birim fiyat girin; kalem toplamları fatura toplamına yansısın.",
  },
  {
    title: "Kaydedin",
    description:
      "Fatura kaydedildiğinde cari hesap hareketi oluşur ve faturadaki ürünler için stok hareketi işlenir.",
  },
];

const invoiceMovements = [
  "Satış faturası, müşteri cari hesabında borç oluşturur.",
  "Alış faturası, tedarikçi hesabına borç kaydı olarak işlenir.",
  "Tahsilat ve ödemeler, ilgili faturayla eşleştirilerek kapatılır.",
  "Fatura düzenlendiğinde kayıt güncellenir; geçmiş hareketler cari ekstrede görünür.",
];

export default function FaturaProgramiPage() {
  return (
    <>
      <JsonLd
        data={[
          softwareApplicationSchema({
            name: "Online Fatura Programı",
            description,
            path,
            featureList: invoiceFeatures.map((feature) => feature.title),
          }),
          breadcrumbSchema([
            { name: "Ana sayfa", path: "/" },
            { name: "Online Fatura Programı", path },
          ]),
        ]}
      />

      <PageHero
        eyebrow="Fatura yönetimi"
        title="Online Fatura Programı"
        lead="Satış ve alış faturalarınızı kalemli olarak oluşturun. Fatura kaydedildiğinde cari hesap ve stok hareketleri aynı işlem içinde güncellenir."
        actions={
          <>
            <LinkButton href="/auth/signup" label="Hesap oluştur" />
            <LinkButton
              href="/blog/on-muhasebe-programi-nedir"
              label="Ön muhasebe programı nedir?"
              variant="outline"
            />
          </>
        }
      />

      <Section>
        <SectionHeading
          eyebrow="Faturalar"
          title="Fatura Yönetimi"
          description="Kesilen satış faturaları ve alınan alış faturaları tek listede tutulur. Liste fatura tipine, taslak durumuna veya arama terimine göre filtrelenebilir."
        />
        <FeatureGrid items={invoiceFeatures} />
      </Section>

      <Section muted>
        <SectionHeading
          eyebrow="Kalemler"
          title="Fatura Kalemleri"
          description="Fatura, satır satır kalemlerden oluşur. Her kalem bir ürünü, miktarı ve birim fiyatı temsil eder."
        />
        <ChecklistBlock
          title="Kalemde tutulan alanlar"
          items={[
            "Ürün seçimi ve ürün adı",
            "Birim bilgisi (adet, kg, metre vb.)",
            "Miktar ve birim fiyat",
            "Kalem toplamı",
            "Fatura genel toplamı",
          ]}
        />
        <BodyCopy>
          Kalemler ürün kartına bağlı çalıştığı için aynı ürün hem faturada hem
          stok ekranında aynı kayıtla temsil edilir.
        </BodyCopy>
      </Section>

      <Section>
        <SectionHeading
          eyebrow="Akış"
          title="Ürün ve Fatura İlişkisi"
          description="Faturaya eklenen ürün, stok hareketini doğrudan etkiler."
        />
        <StepList items={invoiceSteps} />
      </Section>

      <Section muted>
        <SectionHeading
          eyebrow="Cari hesap"
          title="Cari Hesap ile Fatura Takibi"
          description="Fatura, cari hesabın hareket kaynağıdır. Fatura kesildiğinde ilgili hesabın bakiyesi güncellenir."
        />
        <BodyCopy>
          Müşteri hesabında bakiye, kesilen faturalar ve alınan tahsilatlar
          üzerinden oluşur. Vade tarihi girilen faturalar açık fatura listesinde
          görünür; vadesi geçen tutarlar cari ekranda ayrıca işaretlenir. Böylece
          hangi faturanın tahsil edilmeyi beklediği net biçimde izlenebilir.
        </BodyCopy>
        <BodyCopy>
          Fatura hareketleri,{" "}
          <a
            href="/tahsilat-takip-programi"
            className="font-semibold text-[#176B87] underline decoration-[#b7dfe0] decoration-2 underline-offset-2"
          >
            tahsilat takibi
          </a>{" "}
          süreciyle birlikte yürüdüğünde bakiye ve açık fatura listesi tutarlı
          kalır.
        </BodyCopy>
      </Section>

      <Section>
        <ChecklistBlock
          title="Fatura Hareketleri"
          description="Faturaların cari ve stok tarafındaki etkisi şu şekilde işler:"
          items={invoiceMovements}
        />
      </Section>

      <Section muted>
        <FaqList
          items={[
            {
              question: "Fatura kalemli olarak düzenlenebilir mi?",
              answer:
                "Evet. Faturaya birden fazla kalem ekleyebilir, her kalemde ürün, miktar ve birim fiyat belirtebilirsiniz.",
            },
            {
              question: "Fatura sonradan düzenlenebilir mi?",
              answer:
                "Fatura kaydı düzenleme ekranından güncellenebilir; cari ekstre geçmiş hareketleri listelemeye devam eder.",
            },
          ]}
        />
      </Section>

      <Section>
        <RelatedLinks
          description="Fatura süreçleri cari hesap ve stok kayıtlarıyla birlikte anlam kazanır."
          items={[
            ...productPages
              .filter((page) => page.href !== path)
              .map((page) => ({
                href: page.href,
                label: page.title,
                description: page.description,
              })),
            {
              href: "/blog/on-muhasebe-programi-nedir",
              label: "Ön muhasebe programı nedir?",
              description:
                "Ön muhasebenin kapsamını ve modüllerini anlatan yazı.",
            },
          ]}
        />
      </Section>

      <Section muted>
        <CtaBanner
          title="Faturalarınızı cari hesapla birlikte yönetin."
          description="Satış ve alış faturalarını oluşturun; cari hareket ve stok kayıtları aynı işlem içinde güncellensin."
          primary={{ label: "Hesap oluştur", href: "/auth/signup" }}
          secondary={{ label: "Giriş yap", href: "/auth/signin" }}
        />
      </Section>
    </>
  );
}