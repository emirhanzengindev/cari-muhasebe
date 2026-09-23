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

const path = "/cari-hesap-programi";
const description =
  "Cari hesap programı ile müşteri ve tedarikçi hesaplarınızı tek panelden yönetin. Borç ve alacak takibi, tahsilat hareketleri ve cari ekstre aynı iş akışında.";

export const metadata: Metadata = {
  title: "Cari Hesap Programı",
  description,
  alternates: { canonical: path },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: path,
    title: "Cari Hesap Programı | CariOnline",
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: "Cari Hesap Programı | CariOnline",
    description,
  },
};

const accountFeatures = [
  {
    title: "Hesap kartları",
    description:
      "Her müşteri ve tedarikçi için ayrı hesap kartı oluşturun. Telefon, adres, vergi numarası ve vergi dairesi bilgilerini aynı kartta saklayın.",
  },
  {
    title: "Aktif ve pasif hesap yönetimi",
    description:
      "Çalışmadığınız firmaları pasife alarak listeyi sade tutun. Hesap geçmişi korunur, istediğinizde tekrar aktif hale getirebilirsiniz.",
  },
  {
    title: "Hareket geçmişi",
    description:
      "Fatura, tahsilat ve ödeme kayıtları cari hesabın altında birikir. Hesabın güncel bakiyesi her hareketten sonra güncellenir.",
  },
  {
    title: "Toplu kayıt ve dışa aktarma",
    description:
      "Mevcut hesap listenizi Excel ile içe aktarın; listeyi ihtiyaç duyduğunuzda yeniden dışa aktarın.",
  },
];

const balanceRules = [
  "Satış faturası kesildiğinde ilgili hesabın borcu artar.",
  "Tahsilat kaydedildiğinde hesabın borcu azalır.",
  "Alış faturası ve tedarikçi ödemeleri tedarikçi hesabında izlenir.",
  "Her hareket sonrası bakiye anlık olarak görünür.",
];

const collectionSteps = [
  {
    title: "Tahsilat kaydını girin",
    description:
      "Tutar, tarih, belge numarası ve açıklama ile tahsilatı cari hesaba işleyin.",
  },
  {
    title: "Kapatılacak faturayı seçin",
    description:
      "Tahsilatın hangi faturayı kapattığını belirtin. Kısmi ödemelerde kalan tutar açık kalır.",
  },
  {
    title: "Ödeme yöntemini belirtin",
    description:
      "Nakit, banka veya diğer yöntemlerden birini seçin; kasa veya banka hesabı seçildiğinde finans bakiyesi de güncellenir.",
  },
  {
    title: "Bakiyeyi kontrol edin",
    description:
      "Hareket sonrası bakiye ve kalan açık faturalar cari ekranda görünür durumdadır.",
  },
];

export default function CariHesapProgramiPage() {
  return (
    <>
      <JsonLd
        data={[
          softwareApplicationSchema({
            name: "Cari Hesap Programı",
            description,
            path,
            featureList: accountFeatures.map((feature) => feature.title),
          }),
          breadcrumbSchema([
            { name: "Ana sayfa", path: "/" },
            { name: "Cari Hesap Programı", path },
          ]),
        ]}
      />

      <PageHero
        eyebrow="Cari hesap yönetimi"
        title="Cari Hesap Programı"
        lead="Müşteri ve tedarikçi hesaplarınızı tek panelde tutun. Fatura, tahsilat ve ödeme hareketleri doğrudan hesap bakiyesine işlensin."
        actions={
          <>
            <LinkButton href="/auth/signup" label="Hesap oluştur" />
            <LinkButton
              href="/blog/cari-hesap-nedir"
              label="Cari hesap nedir?"
              variant="outline"
            />
          </>
        }
      />

      <Section>
        <SectionHeading
          eyebrow="Hesap yapısı"
          title="Cari Hesap Yönetimi"
          description="Cari hesaplar; satış yaptığınız müşterileri ve alış yaptığınız tedarikçileri kapsar. Hesabın bakiye ve hareket bilgisi tek ekranda toplanır."
        />
        <FeatureGrid items={accountFeatures} />
      </Section>

      <Section muted>
        <SectionHeading
          eyebrow="Hesap kartı"
          title="Müşteri ve Tedarikçi Takibi"
          description="Müşteri ve tedarikçi hesapları aynı listede tutulur ve hesap tipine göre ayrılır. Böylece hem tahsil edilecek hem ödenecek hesaplar bir arada görünür."
        />
        <div className="mt-8">
          <ChecklistBlock
            title="Her hesapta tutulan bilgiler"
            items={[
              "Firma veya kişi adı, telefon, adres",
              "Vergi numarası ve vergi dairesi",
              "Müşteri / tedarikçi hesap tipi",
              "Aktif veya pasif durum bilgisi",
              "Güncel bakiye ve hareket geçmişi",
              "Açık faturalar ve vade tarihleri",
            ]}
          />
        </div>
      </Section>

      <Section>
        <ChecklistBlock
          title="Borç ve Alacak Takibi"
          description="Cari hesapta bakiye elle güncellenmez; hareketler üzerinden oluşur. Bu sayede bakiyenin hangi işlemden geldiği geriye dönük izlenebilir."
          items={balanceRules}
        />
        <BodyCopy>
          Panel özeti toplam alacak, toplam borç ve net bakiye tutarlarını
          birleşik gösterir. Böylece işletmenin genel tablosu ile hesap detayı
          arasında geçiş yapmak gerekmez.
        </BodyCopy>
      </Section>

      <Section muted>
        <SectionHeading
          eyebrow="Hareketler"
          title="Tahsilat Hareketleri"
          description="Tahsilat ve ödemeler cari hesaba kaydedilir ve açık faturalarla ilişkilendirilir."
        />
        <StepList items={collectionSteps} />
      </Section>

      <Section>
        <SectionHeading
          eyebrow="Mutabakat"
          title="Cari Ekstre"
          description="Cari ekstre, bir hesabın belirli dönemdeki tüm hareketlerini kronolojik sırayla gösterir."
        />
        <BodyCopy>
          Ekstre ekranda görüntülenebilir ve PDF olarak indirilebilir. Ay sonu
          mutabakatlarında ve bakiye tartışmalarında karşı tarafa gönderilecek
          belge olarak kullanılabilir.
        </BodyCopy>
        <div className="mt-8">
          <ChecklistBlock
            title="Ekstrede görünen bilgiler"
            items={[
              "Dönem hareketleri ve tarihleri",
              "Borcun oluştuğu fatura kayıtları",
              "Tahsilat ve ödemeler",
              "Hareket sonrası bakiye",
              "Açık faturalar ve vadesi geçen tutarlar",
            ]}
          />
        </div>
      </Section>

      <Section muted>
        <SectionHeading
          eyebrow="Erişim"
          title="Online Cari Hesap Takibi"
          description="CariOnline tarayıcı üzerinden çalışır; kayıtlara masaüstü veya mobil cihazdan erişebilirsiniz."
        />
        <BodyCopy>
          Her işletmenin verisi kendi hesabı altında ayrıştırılır ve panele
          erişim oturum doğrulamasıyla korunur. Kayıtlar ekip arkadaşlarınızla
          aynı panelden görülebilir; hareketler tek kaynak üzerinden ilerler.
        </BodyCopy>
      </Section>

      <Section>
        <FaqList
          items={[
            {
              question: "Cari hesap programı hangi işletmeler için uygundur?",
              answer:
                "Müşteri veya tedarikçiyle vadeli çalışan, stok ve fatura takibi yapan küçük ve orta ölçekli işletmeler için uygundur.",
            },
            {
              question: "Kısmi tahsilat kaydedilebilir mi?",
              answer:
                "Evet. Tahsilatın bir bölümünü faturayla eşleştirebilirsiniz; kalan tutar açık fatura olarak izlenmeye devam eder.",
            },
            {
              question: "Cari ekstre paylaşılabilir mi?",
              answer:
                "Ekstre ekranda görüntülenebilir ve PDF olarak indirilebilir; indirdiğiniz dosyayı müşterinizle paylaşabilirsiniz.",
            },
          ]}
        />
      </Section>

      <Section muted>
        <RelatedLinks
          description="Cari hesap süreçlerini diğer modüllerle birlikte kullandığınızda hareketler tek akışta ilerler."
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
              description:
                "Hazırlık, günlük kayıt ve mutabakat adımlarını anlatan rehber.",
            },
            {
              href: "/blog/borc-alacak-takibi",
              label: "Borç ve alacak takibi nedir?",
              description:
                "Cari bakiyenin nasıl yorumlandığını ve vade takibini açıklayan yazı.",
            },
          ]}
        />
      </Section>

      <Section>
        <CtaBanner
          title="Cari hesaplarınızı tek panelden yönetmeye başlayın."
          description="Hesap kartlarını oluşturun, faturaları kesin ve tahsilatları eşleştirin. Bakiye ve vade durumu panelde güncel kalır."
          primary={{ label: "Hesap oluştur", href: "/auth/signup" }}
          secondary={{ label: "Giriş yap", href: "/auth/signin" }}
        />
      </Section>
    </>
  );
}