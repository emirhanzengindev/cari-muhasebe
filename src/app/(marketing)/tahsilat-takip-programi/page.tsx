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

const path = "/tahsilat-takip-programi";
const description =
  "Tahsilat takip programı ile tahsilat ve ödemeleri cari hesaba işleyin. Açık faturaları eşleştirin, cari bakiyeyi ve tahsilat geçmişini tek panelden izleyin.";

export const metadata: Metadata = {
  title: "Tahsilat Takip Programı",
  description,
  alternates: { canonical: path },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: path,
    title: "Tahsilat Takip Programı | CariOnline",
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: "Tahsilat Takip Programı | CariOnline",
    description,
  },
};

const collectionFeatures = [
  {
    title: "Tahsilat ve ödeme kaydı",
    description:
      "Alınan tahsilatları ve yapılan ödemeleri tutar, tarih, belge numarası ve açıklama ile kaydedin.",
  },
  {
    title: "Fatura kapama",
    description:
      "Tahsilatın hangi faturayı kapattığını belirtin. Kısmi ödemelerde kalan tutar açık kalır ve izlenmeye devam eder.",
  },
  {
    title: "Ödeme yöntemi",
    description:
      "Nakit, banka veya diğer yöntemlerden birini seçin. Kasa ya da banka hesabı seçildiğinde ilgili finans bakiyesi de güncellenir.",
  },
  {
    title: "Hareket kaydı",
    description:
      "Kaydedilen her tahsilat cari hesap hareketine işlenir; hangi tarihte ne kadar ödendiği ekstrede görünür.",
  },
];

const collectionFlow = [
  {
    title: "Cari hesabı seçin",
    description: "Tahsilatı kaydedeceğiniz müşteri veya tedarikçi hesabını belirleyin.",
  },
  {
    title: "Tutarı ve tarihi girin",
    description: "Tahsilat tutarını, işlem tarihini ve varsa belge numarasını kaydedin.",
  },
  {
    title: "Faturayla eşleştirin",
    description:
      "Kapamak istediğiniz faturaları seçin. Tek tahsilat birden fazla faturaya dağıtılabilir.",
  },
  {
    title: "Bakiyeyi kontrol edin",
    description: "Hareket sonrası bakiye ve kalan açık faturalar cari ekranda görünür.",
  },
];

const collectionHistory = [
  "Tahsilat ve ödemelerin tarih sırasıyla listesi",
  "Her hareketin hangi faturayı kapattığı bilgisi",
  "Hareket sonrası bakiye",
  "Açık fatura ve vadesi geçen tutarların özeti",
  "Cari ekstrenin PDF olarak indirilebilmesi",
];

export default function TahsilatTakipProgramiPage() {
  return (
    <>
      <JsonLd
        data={[
          softwareApplicationSchema({
            name: "Tahsilat Takip Programı",
            description,
            path,
            featureList: collectionFeatures.map((feature) => feature.title),
          }),
          breadcrumbSchema([
            { name: "Ana sayfa", path: "/" },
            { name: "Tahsilat Takip Programı", path },
          ]),
        ]}
      />

      <PageHero
        eyebrow="Tahsilat yönetimi"
        title="Tahsilat Takip Programı"
        lead="Alınan tahsilatları ve yapılan ödemeleri cari hesaba kaydedin. Açık faturaları eşleştirerek hangi tutarın kapandığını net biçimde takip edin."
        actions={
          <>
            <LinkButton href="/auth/signup" label="Hesap oluştur" />
            <LinkButton
              href="/blog/borc-alacak-takibi"
              label="Borç ve alacak takibi nedir?"
              variant="outline"
            />
          </>
        }
      />

      <Section>
        <SectionHeading
          eyebrow="Kayıt"
          title="Tahsilat Kaydı"
          description="Tahsilat ve ödemeler cari hesap üzerinden kaydedilir; her kayıt hareket geçmişine işlenir."
        />
        <FeatureGrid items={collectionFeatures} />
      </Section>

      <Section muted>
        <SectionHeading
          eyebrow="Akış"
          title="Cari Hesap Hareketleri"
          description="Tahsilat kaydı dört adımda tamamlanır ve cari bakiye doğrudan etkilenir."
        />
        <StepList items={collectionFlow} />
      </Section>

      <Section>
        <ChecklistBlock
          title="Borç ve Alacak Takibi"
          description="Satış faturası kesildiğinde müşterinin borcu artar, tahsilat kaydedildiğinde azalır. Tedarikçi tarafında ise alış faturası borç, yapılan ödeme borcun kapanması anlamına gelir."
          items={[
            "Hesabın güncel bakiyesi ve yönü",
            "Hareket sonrası bakiyenin görüntülenmesi",
            "Panel özetinde toplam alacak ve toplam borç",
            "Net bakiye ile işletmenin genel durumu",
          ]}
        />
      </Section>

      <Section muted>
        <SectionHeading
          eyebrow="Geçmiş"
          title="Tahsilat Geçmişi"
          description="Geçmiş hareketler cari ekstrede kronolojik olarak listelenir; ilgili faturayla ilişkisi korunur."
        />
        <div className="mt-8">
          <ChecklistBlock
            title="Geçmişte görünen bilgiler"
            items={collectionHistory}
          />
        </div>
      </Section>

      <Section>
        <SectionHeading
          eyebrow="Bakiye"
          title="Cari Bakiye Takibi"
          description="Bakiye yalnızca tahsilatla değil, vade durumuyla birlikte anlam kazanır."
        />
        <BodyCopy>
          CariOnline&apos;da hesabın açık faturaları ve vadesi geçen tutarları
          ayrı gösterilir. Böylece toplam alacak doğru görünse bile hangi
          faturanın gecikmede olduğu kolayca fark edilir. Tahsilat sonrası kalan
          tutar açık fatura olarak izlenmeye devam eder.
        </BodyCopy>
        <BodyCopy>
          Vade ve bakiye bilgisi,{" "}
          <a
            href="/cari-hesap-programi"
            className="font-semibold text-[#176B87] underline decoration-[#b7dfe0] decoration-2 underline-offset-2"
          >
            cari hesap
          </a>{" "}
          ekranında ve ekstre çıktısında birlikte yer alır.
        </BodyCopy>
      </Section>

      <Section muted>
        <FaqList
          items={[
            {
              question: "Tek tahsilatla birden fazla fatura kapatılabilir mi?",
              answer:
                "Evet. Tahsilat tutarını birden fazla faturaya dağıtabilirsiniz; her faturaya ne kadar kapama yapıldığı kaydedilir.",
            },
            {
              question: "Tahsilat silinebilir mi?",
              answer:
                "Tahsilat ve ödeme hareketleri kayıt ekranından silinebilir; silme işleminde ilgili cari bakiye yeniden hesaplanır.",
            },
          ]}
        />
      </Section>

      <Section>
        <RelatedLinks
          description="Tahsilat süreci fatura ve cari hesap kayıtlarıyla birlikte yürütülür."
          items={[
            ...productPages
              .filter((page) => page.href !== path)
              .map((page) => ({
                href: page.href,
                label: page.title,
                description: page.description,
              })),
            {
              href: "/blog/cari-hesap-takibi-nasil-yapilir",
              label: "Cari hesap takibi nasıl yapılır?",
              description: "Tahsilat eşleştirme ve mutabakat adımlarını anlatan rehber.",
            },
          ]}
        />
      </Section>

      <Section muted>
        <CtaBanner
          title="Tahsilatları cari hesapla birlikte takip edin."
          description="Tahsilat ve ödemeleri kaydedin, açık faturaları eşleştirin; bakiye ve vade durumu panelde güncel kalsın."
          primary={{ label: "Hesap oluştur", href: "/auth/signup" }}
          secondary={{ label: "Giriş yap", href: "/auth/signin" }}
        />
      </Section>
    </>
  );
}