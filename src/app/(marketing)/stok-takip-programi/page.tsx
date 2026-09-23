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

const path = "/stok-takip-programi";
const description =
  "Stok takip programı ile ürün, kategori ve depolarınızı yönetin. Stok hareketlerini, mevcut miktarları ve kritik seviyeleri tek panelden izleyin.";

export const metadata: Metadata = {
  title: "Stok Takip Programı",
  description,
  alternates: { canonical: path },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: path,
    title: "Stok Takip Programı | CariOnline",
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: "Stok Takip Programı | CariOnline",
    description,
  },
};

const productFeatures = [
  {
    title: "Ürün kartları",
    description:
      "Ürün adı, SKU, barkod, birim, kategori, alış ve satış fiyatı bilgilerini ürün kartında saklayın.",
  },
  {
    title: "Kategori yönetimi",
    description:
      "Ürünleri kategorilere ayırın; listede kategori ve depoya göre filtreleme yapın.",
  },
  {
    title: "Kritik seviye",
    description:
      "Her ürün için kritik stok seviyesi tanımlayın. Seviyenin altına düşen ürünler stok ekranında ayrı görünür.",
  },
  {
    title: "Toplu içe aktarma",
    description:
      "Mevcut ürün listenizi Excel dosyasıyla içe aktarın veya şablon üzerinden yeni liste oluşturun.",
  },
];

const movementSteps = [
  {
    title: "Giriş hareketi",
    description:
      "Alış faturası, iade veya sayım düzeltmesi ile stok miktarı artar.",
  },
  {
    title: "Çıkış hareketi",
    description:
      "Satış faturası veya hızlı satış ile stok miktarı düşer; hareket ürün geçmişine işlenir.",
  },
  {
    title: "Hareket geçmişi",
    description:
      "Ürün bazında yapılan tüm giriş ve çıkışlar tarih sırasıyla görüntülenebilir.",
  },
];

export default function StokTakipProgramiPage() {
  return (
    <>
      <JsonLd
        data={[
          softwareApplicationSchema({
            name: "Stok Takip Programı",
            description,
            path,
            featureList: productFeatures.map((feature) => feature.title),
          }),
          breadcrumbSchema([
            { name: "Ana sayfa", path: "/" },
            { name: "Stok Takip Programı", path },
          ]),
        ]}
      />

      <PageHero
        eyebrow="Stok yönetimi"
        title="Stok Takip Programı"
        lead="Ürünlerinizi, kategorilerinizi ve depolarınızı tek panelde tanımlayın. Stok giriş ve çıkışları kaydedildikçe mevcut miktar güncel kalır."
        actions={
          <>
            <LinkButton href="/auth/signup" label="Hesap oluştur" />
            <LinkButton
              href="/blog/stok-takibi-nasil-yapilir"
              label="Stok takibi nasıl yapılır?"
              variant="outline"
            />
          </>
        }
      />

      <Section>
        <SectionHeading
          eyebrow="Ürünler"
          title="Ürün Yönetimi"
          description="Ürün bilgileri tek kartta toplanır; stok, fatura ve raporlar aynı ürün kaydını kullanır."
        />
        <FeatureGrid items={productFeatures} />
      </Section>

      <Section muted>
        <SectionHeading
          eyebrow="Hareketler"
          title="Stok Hareketleri"
          description="Stok miktarı hareketler üzerinden oluşur; giriş ve çıkış kayıtları ürün geçmişinde saklanır."
        />
        <StepList items={movementSteps} />
      </Section>

      <Section>
        <ChecklistBlock
          title="Mevcut Stok Takibi"
          description="Stok ekranında ürünlerin güncel miktarı, kritik seviyesi ve bağlı olduğu depo birlikte görünür."
          items={[
            "Ürün bazında güncel stok miktarı",
            "Kritik seviyenin altına düşen ürünler",
            "Kategori ve depoya göre filtreleme",
            "Ürün arama ve barkod ile bulma",
            "Stok listesini Excel olarak dışa aktarma",
          ]}
        />
      </Section>

      <Section muted>
        <SectionHeading
          eyebrow="Depolar"
          title="Depo Yönetimi"
          description="Ürünler bir depoya bağlı olarak tanımlanır. Depo bilgisi ürün kartında seçilir ve stok listesinde filtre olarak kullanılır."
        />
        <BodyCopy>
          Tek depo ile çalışsanız bile depo tanımı oluşturmak, ileride ikinci depo
          veya şube açıldığında geçişi kolaylaştırır. Depo listesi panelden
          yönetilir.
        </BodyCopy>
      </Section>

      <Section>
        <SectionHeading
          eyebrow="Entegre akış"
          title="Stok ve Cari Süreçlerin Birlikte Yönetimi"
          description="Bir satış işlemi stok, fatura ve cari hesabı aynı anda etkiler."
        />
        <BodyCopy>
          CariOnline&apos;da satış kaydedildiğinde ürünün stok miktarı düşer,
          satış faturası oluşur ve ilgili cari hesaba borç kaydı işlenir. Böylece
          depoda olmayan bir ürünün satılması veya faturasız stok çıkışı gibi
          tutarsızlıkların oluşması engellenir.
        </BodyCopy>
        <BodyCopy>
          Alış tarafında gelen ürünlerin stoğu artar ve tedarikçi hesabı
          etkilenir. Stok ve cari hareketlerin aynı işlem içinde ilerlemesi,{" "}
          <a
            href="/fatura-programi"
            className="font-semibold text-[#176B87] underline decoration-[#b7dfe0] decoration-2 underline-offset-2"
          >
            fatura
          </a>{" "}
          ve cari bakiye tutarlılığını korur.
        </BodyCopy>
      </Section>

      <Section muted>
        <FaqList
          items={[
            {
              question: "Stok takip programı barkod destekliyor mu?",
              answer:
                "Ürün kartında barkod alanı tutulur. Hızlı satış ekranında barkod okutularak ürün sepete eklenebilir.",
            },
            {
              question: "Kritik seviye uyarısı nasıl çalışır?",
              answer:
                "Ürüne kritik seviye tanımlandığında, mevcut miktar bu seviyenin altına düştüğünde ürün stok ekranında ayrı olarak listelenir.",
            },
          ]}
        />
      </Section>

      <Section>
        <RelatedLinks
          description="Stok süreçleri fatura ve cari hesap hareketleriyle birlikte ilerler."
          items={[
            ...productPages
              .filter((page) => page.href !== path)
              .map((page) => ({
                href: page.href,
                label: page.title,
                description: page.description,
              })),
            {
              href: "/blog/stok-takibi-nasil-yapilir",
              label: "Stok takibi nasıl yapılır?",
              description:
                "Ürün yapısı, hareket kaydı ve sayım sürecini anlatan rehber.",
            },
          ]}
        />
      </Section>

      <Section muted>
        <CtaBanner
          title="Stok ve cari hareketleri tek panelde yönetin."
          description="Ürün kartlarınızı oluşturun, depo tanımlarını yapın ve stok hareketlerini satış kayıtlarıyla birlikte takip edin."
          primary={{ label: "Hesap oluştur", href: "/auth/signup" }}
          secondary={{ label: "Giriş yap", href: "/auth/signin" }}
        />
      </Section>
    </>
  );
}