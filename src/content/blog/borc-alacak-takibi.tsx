import type { BlogPostMeta } from "./types";
import {
  ArticleCta,
  H2,
  H3,
  InternalLink,
  Lead,
  LI,
  Note,
  P,
  UL,
} from "./prose";

export const meta: BlogPostMeta = {
  slug: "borc-alacak-takibi",
  title: "Borç ve Alacak Takibi Nedir?",
  description:
    "Borç ve alacak takibi nedir, nasıl yapılır? Cari bakiyenin nasıl yorumlandığını, vade takibini ve düzenli mutabakatın neden gerekli olduğunu anlatıyoruz.",
  excerpt:
    "İşletmenin kimden alacaklı, kime borçlu olduğunu net görmek için borç ve alacak takibinin temel kuralları.",
  datePublished: "2026-09-02",
  keywords: [
    "borç alacak takibi",
    "cari bakiye",
    "alacak takibi",
    "borç takibi",
  ],
  readingMinutes: 5,
  relatedPages: ["/cari-hesap-programi", "/tahsilat-takip-programi"],
};

export default function Content() {
  return (
    <article>
      <Lead>
        Borç ve alacak takibi, işletmenin müşterilerinden ne kadar alacağı ve
        tedarikçilerine ne kadar borcu olduğunun düzenli olarak izlenmesidir.
        Amaç yalnızca geçmişi kaydetmek değil, yaklaşan ödeme ve tahsilatları
        önceden görmektir.
      </Lead>

      <P>
        Bu takip, cari hesap yapısının üzerine kurulur. Her müşteri ve tedarikçi
        için tutulan hesap, hareketlerle birlikte bir bakiye üretir. Bakiye,
        işletmenin o firmayla olan net durumunu gösterir.
      </P>

      <H2>Borç ve Alacak Arasındaki Fark</H2>
      <UL>
        <LI>
          <strong className="font-semibold text-[#122B3A]">Alacak:</strong>{" "}
          işletmenin tahsil etmeyi beklediği tutardır. Genellikle satış
          faturalarından doğar.
        </LI>
        <LI>
          <strong className="font-semibold text-[#122B3A]">Borç:</strong>{" "}
          işletmenin ödemesi gereken tutardır. Genellikle alış faturalarından ve
          tedarikçi hareketlerinden doğar.
        </LI>
      </UL>
      <P>
        Bir satış faturası müşteri hesabında borç oluşturur; yapılan tahsilat bu
        borcu azaltır. Alış faturasında ise durum tersidir: işletme borçlanır,
        yapılan ödeme borcu kapatır.
      </P>

      <H2>Cari Bakiye Nasıl Yorumlanır?</H2>
      <H3>Bakiye müşteri lehine (alacak) ise</H3>
      <P>
        Müşteri, işletmeye borçludur. Tahsil edilmesi gereken bir tutar vardır ve
        bu tutarın vade durumu takip edilmelidir.
      </P>
      <H3>Bakiye işletme lehine (borç) ise</H3>
      <P>
        İşletme, tedarikçiye borçludur ya da müşteri avans/fazla ödeme yapmıştır.
        Ödeme planı bu bakiyeye göre yapılır.
      </P>
      <H3>Bakiye sıfır ise</H3>
      <P>
        Hesap kapanmıştır; açık fatura kalmadığı anlamına gelir. Ancak vadesi
        gelmemiş hareketler varsa bu durum ayrıca kontrol edilmelidir.
      </P>

      <H2>Vade Takibi Neden Bakiye Kadar Önemli?</H2>
      <P>
        Toplam alacak tutarı doğru olsa bile tahsilat zamanı bilinmiyorsa nakit
        planlaması yapılamaz. Vadesi geçen faturaların ayrı izlenmesi, gecikmeyi
        büyümeden fark etmeyi sağlar.
      </P>
      <Note>
        Vadesi geçen bir fatura ödenmediğinde, bakiyenin tamamı alacak olarak
        görünmeye devam eder. Bu nedenle alacak takibi bakiyenin yanında vade
        bilgisiyle birlikte yürütülmelidir.
      </Note>
      <UL>
        <LI>Vadesi yaklaşan faturalar için hatırlatma planı yapın.</LI>
        <LI>Vadesi geçenleri listeyi ayrı tutarak önceliklendirin.</LI>
        <LI>Kısmi ödemelerde kalan bakiyeyi yeniden vadelendirin.</LI>
      </UL>

      <H2>Borç ve Alacak Takibini Düzenli Tutmanın Yolları</H2>
      <UL>
        <LI>Tüm faturaları cari hesaba bağlı kaydedin.</LI>
        <LI>Tahsilat ve ödemeleri aynı gün sisteme işleyin.</LI>
        <LI>Hareket açıklamalarını anlaşılır yazın.</LI>
        <LI>Ay sonunda cari ekstre ile karşı tarafın kaydını karşılaştırın.</LI>
        <LI>Birden fazla kullanıcı varsa yetki ve sorumluluğu netleştirin.</LI>
      </UL>

      <H2>CariOnline ile Borç ve Alacak Takibi</H2>
      <P>
        CariOnline&apos;da her cari hesabın güncel bakiyesi, borç ve alacak
        toplamları ve açık faturaları tek ekranda görünür. Panel özetinde
        toplam alacak, toplam borç ve net bakiye birlikte gösterilir. Böylece
        işletmenin genel tablosu tek bakışta anlaşılır. Ayrıntılar için{" "}
        <InternalLink href="/cari-hesap-programi">
          cari hesap programı
        </InternalLink>{" "}
        sayfasını, tahsilat sürecinin işleyişi için{" "}
        <InternalLink href="/blog/cari-hesap-takibi-nasil-yapilir">
          cari hesap takibi
        </InternalLink>{" "}
        yazısını inceleyebilirsiniz.
      </P>

      <ArticleCta>
        <p>
          Borç ve alacak dengesini tek panelden izleyin. Fatura ve tahsilat
          hareketleri aynı akışta kaydedilir.
        </p>
      </ArticleCta>
    </article>
  );
}