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
  slug: "cari-hesap-nedir",
  title: "Cari Hesap Nedir?",
  description:
    "Cari hesap nedir, ne işe yarar ve nasıl tutulur? Müşteri ve tedarikçi cari hesaplarında borç, alacak ve bakiye kavramlarını örneklerle açıklıyoruz.",
  excerpt:
    "Cari hesabın ne olduğunu, borç ve alacak kavramlarını ve günlük işleyişte nasıl kullanıldığını sade bir dille anlatıyoruz.",
  datePublished: "2026-08-12",
  keywords: [
    "cari hesap nedir",
    "cari hesap takibi",
    "borç alacak",
    "müşteri tedarikçi hesabı",
  ],
  readingMinutes: 5,
  relatedPages: ["/cari-hesap-programi", "/tahsilat-takip-programi"],
};

export default function Content() {
  return (
    <article>
      <Lead>
        Cari hesap, bir işletmenin müşterileri ve tedarikçileriyle olan para
        ilişkisinin kayıt altında tutulduğu hesaptır. Kimden ne kadar alacağınız
        ve kime ne kadar borcunuz olduğu bu hesap üzerinden izlenir.
      </Lead>

      <P>
        Küçük ve orta ölçekli işletmelerde cari hesap, ön muhasebenin merkezinde
        yer alır. Satış, fatura ve tahsilat gibi işlemlerin tamamı sonuçta bir
        cari hesabı etkiler. Bu nedenle cari hesabın doğru tutulması, işletmenin
        nakit akışını görebilmesi için ilk adımdır.
      </P>

      <H2>Cari Hesap Ne İşe Yarar?</H2>
      <P>
        Cari hesap, dağınık notlar ve dosyalar yerine tek bir kayıt noktası
        oluşturur. Böylece aynı bilgiye birden fazla yerden bakmak zorunda
        kalmazsınız.
      </P>
      <UL>
        <LI>Bir müşterinin toplam borcunu ve ödeme geçmişini gösterir.</LI>
        <LI>Tedarikçiye olan borcunuzu vade tarihleriyle birlikte takip eder.</LI>
        <LI>Fatura, tahsilat ve ödeme gibi tüm hareketleri tek yerde toplar.</LI>
        <LI>Bakiye üzerinden işletmenin alacak ve borç dengesini gösterir.</LI>
      </UL>

      <H2>Cari Hesaptaki Borç ve Alacak Nasıl Oluşur?</H2>
      <P>
        Cari hesapta borç ve alacak, hesabın iki farklı yönünü ifade eder.
        Kavramlar ilk bakışta ters gelmese de mantığı basittir: işletmenin
        kazandığı tutar hesabı borçlandırır, işletmeye gelen para ise borcu
        azaltır.
      </P>
      <H3>Satış faturası hesabı borçlandırır</H3>
      <P>
        Bir müşteriye satış faturası kestiğinizde, müşterinin size olan borcu
        artar. Fatura bu nedenle cari hesapta borç tarafına işlenir.
      </P>
      <H3>Tahsilat borcu kapatır</H3>
      <P>
        Müşteri ödeme yaptığında hesabın bakiyesi azalır. Tahsilat kaydı,
        müşterinin borcunu kapattığı için alacak tarafında yer alır. Kısmi
        ödemelerde yalnızca ödenen tutar kapatılır ve kalan bakiye açık kalır.
        Bu akışın ayrıntılarını{" "}
        <InternalLink href="/blog/cari-hesap-takibi-nasil-yapilir">
          cari hesap takibi
        </InternalLink>{" "}
        yazımızda bulabilirsiniz.
      </P>

      <H2>Cari Hesap Türleri</H2>
      <UL>
        <LI>
          <strong className="font-semibold text-[#122B3A]">Müşteri cari hesapları:</strong>{" "}
          sattığınız ürün veya hizmetin karşılığında işletmeye borçlanan
          hesaplardır.
        </LI>
        <LI>
          <strong className="font-semibold text-[#122B3A]">Tedarikçi cari hesapları:</strong>{" "}
          mal veya hizmet aldığınız firmalara ait hesaplardır; burada borç
          işletmenin tarafındadır.
        </LI>
      </UL>
      <P>
        Bazı işletmeler aynı firmayla hem alış hem satış yapar. Böyle
        durumlarda hareketlerin aynı cari hesapta birikmesi, net bakiyenin
        görülmesini kolaylaştırır.
      </P>

      <H2>Cari Hesapta Tutulan Bilgiler</H2>
      <UL>
        <LI>Firma veya kişi adı, telefon ve adres bilgisi</LI>
        <LI>Vergi numarası ve vergi dairesi gibi resmi bilgiler</LI>
        <LI>Hesabın müşteri mi tedarikçi mi olduğu</LI>
        <LI>Hesabın aktif veya pasif durumu</LI>
        <LI>Güncel bakiye ve geçmiş hareketler</LI>
        <LI>Açık faturalar ve vade durumu</LI>
      </UL>

      <H2>Cari Hesap Ekstresi Neden Önemlidir?</H2>
      <P>
        Cari ekstre, bir hesabın belirli bir tarih aralığındaki tüm hareketlerini
        kronolojik olarak gösterir. Müşteriyle yaşanan bakiyetartışmalarında ve
        ay sonu mutabakatlarında başvurulan ilk belgedir. Ekstre, tek tek
        konuşmak yerine hareketleri tek sayfada göstererek süreci hızlandırır.
      </P>

      <Note>
        Cari hesap takibinin farklı bir yazılımla yapılması zorunlu değildir;
        ancak hesap sayısı arttığında hareketlerin tek bir yerde tutulması
        hataları belirgin şekilde azaltır.
      </Note>

      <H2>CariOnline ile Cari Hesap Yönetimi</H2>
      <P>
        CariOnline&apos;da müşteri ve tedarikçi hesaplarını oluşturup, fatura ve
        tahsilat hareketlerini aynı ekranda izleyebilirsiniz. Hesabın güncel
        bakiyesi, açık faturaları ve vadesi geçen tutarları görünür durumdadır.
        Detaylar için{" "}
        <InternalLink href="/cari-hesap-programi">
          cari hesap programı
        </InternalLink>{" "}
        sayfasına göz atabilirsiniz.
      </P>

      <ArticleCta>
        <p>
          Cari hesaplarınızı tek panelden yönetmeye başlayın. Fatura, tahsilat ve
          stok hareketlerini aynı iş akışında takip edin.
        </p>
      </ArticleCta>
    </article>
  );
}