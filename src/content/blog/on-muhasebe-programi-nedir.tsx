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
  slug: "on-muhasebe-programi-nedir",
  title: "Ön Muhasebe Programı Nedir?",
  description:
    "Ön muhasebe programı nedir, hangi modüllerden oluşur ve hangi işletmeler için uygundur? Cari, stok, fatura, tahsilat ve raporlama işlevlerini açıklıyoruz.",
  excerpt:
    "Ön muhasebe programının kapsamını, temel modüllerini ve program seçerken dikkat edilmesi gereken noktaları anlatıyoruz.",
  datePublished: "2026-09-18",
  keywords: [
    "ön muhasebe programı nedir",
    "ön muhasebe",
    "cari hesap programı",
    "işletme yönetim yazılımı",
  ],
  readingMinutes: 6,
  relatedPages: [
    "/cari-hesap-programi",
    "/stok-takip-programi",
    "/fatura-programi",
  ],
};

export default function Content() {
  return (
    <article>
      <Lead>
        Ön muhasebe programı, bir işletmenin günlük ticari işlemlerini kayıt
        altına alan ve bu işlemlerden cari hesap, stok ve finansal özetler üreten
        yazılımdır. Muhasebe kayıtlarının öncesinde yer alan operasyonel takibi
        üstlenir.
      </Lead>

      <P>
        Küçük ve orta ölçekli işletmelerde işlem hacmi arttıkça defter ve tablo
        takibi yetersiz kalır. Ön muhasebe programı; satış, satın alma, tahsilat
        ve stok hareketlerini aynı veri üzerinde birleştirerek tekrar eden işleri
        azaltır.
      </P>

      <H2>Ön Muhasebe Ne Kapsar?</H2>
      <P>
        Ön muhasebe, işletmenin ticari hafızasıdır. Amaç resmi beyan üretmek
        değil; işleyişin para ve mal hareketlerini düzenli tutmaktır.
      </P>
      <UL>
        <LI>Müşteri ve tedarikçi cari hesapları</LI>
        <LI>Satış ve alış faturaları</LI>
        <LI>Tahsilat ve ödeme kayıtları</LI>
        <LI>Ürün, stok ve depo hareketleri</LI>
        <LI>Kasa ve banka hareketleri</LI>
        <LI>Özet raporlar ve işletme değerlendirmesi</LI>
      </UL>

      <H2>Ön Muhasebe Programında Bulunması Beklenen Modüller</H2>

      <H3>Cari hesap yönetimi</H3>
      <P>
        Müşteri ve tedarikçi hesapları, borç ve alacak hareketleri, ekstre ve
        bakiye takibi bu modülde yürütülür. Ön muhasebenin merkezinde yer alır.{" "}
        <InternalLink href="/blog/cari-hesap-nedir">
          Cari hesap nedir?
        </InternalLink>{" "}
        yazımızda temel kavramları bulabilirsiniz.
      </P>

      <H3>Fatura yönetimi</H3>
      <P>
        Satış ve alış faturalarının kalemli biçimde oluşturulması, vade
        bilgisiyle kaydedilmesi ve cari hesaba işlenmesi beklenir.
      </P>

      <H3>Stok yönetimi</H3>
      <P>
        Ürün kartları, kategori ve depo tanımları, stok giriş çıkışları ve kritik
        seviye takibi bu modülde yer alır.
      </P>

      <H3>Tahsilat ve ödeme takibi</H3>
      <P>
        Alınan tahsilatlar ve yapılan ödemeler; hangi faturanın kapandığını
        gösterecek şekilde kaydedilmelidir.
      </P>

      <H3>Finansal hareketler</H3>
      <P>
        Kasa ve banka hesapları üzerinden günlük para hareketlerinin izlenmesi,
        nakit durumunu görünür kılar.
      </P>

      <H3>Raporlama</H3>
      <P>
        Güncel bakiyeler, ürün bazlı satışlar ve dönemsel kâr zarar özetleri
        işletmenin durumunu değerlendirmek için kullanılır.
      </P>

      <H2>Ön Muhasebe ile Muhasebe Arasındaki Fark</H2>
      <P>
        Ön muhasebe operasyonel takibi, muhasebe ise resmi kayıt ve beyan
        süreçlerini kapsar. İkisi birbirinin alternatifi değildir; ön muhasebe
        verisi, muhasebe sürecine sağlıklı bir kaynak oluşturur.
      </P>

      <H2>Ön Muhasebe Programı Seçerken Nelere Bakılmalı?</H2>
      <UL>
        <LI>Modüllerin birbirine bağlı çalışması: fatura cari hareketi doğrudan etkilemeli.</LI>
        <LI>Kısmi tahsilat ve fatura kapama desteği olması.</LI>
        <LI>Tarayıcı üzerinden erişim ve birden fazla kullanıcı desteği.</LI>
        <LI>Verileri Excel veya PDF olarak dışa aktarabilme.</LI>
        <LI>Kullanıcı verisinin işletme bazında ayrıştırılmış olması.</LI>
      </UL>
      <Note>
        Program ne kadar yetenekli olursa olsun, hareketlerin düzenli girilmesi
        gerekir. Haftalarca gecikmiş kayıtlar doğru rapor üretmez.
      </Note>

      <H2>CariOnline ile Ön Muhasebe</H2>
      <P>
        CariOnline; cari hesap, stok, fatura, hızlı satış, finans ve raporlama
        modüllerini aynı panelde birleştirir. Fatura kaydedildiğinde cari hareket
        otomatik oluşur, stok hareketi düşülür ve panel özetleri güncellenir.
        Modüllerin ayrıntıları için{" "}
        <InternalLink href="/cari-hesap-programi">
          cari hesap programı
        </InternalLink>
        ,{" "}
        <InternalLink href="/stok-takip-programi">
          stok takip programı
        </InternalLink>{" "}
        ve{" "}
        <InternalLink href="/fatura-programi">fatura programı</InternalLink>{" "}
        sayfalarını inceleyebilirsiniz.
      </P>

      <ArticleCta>
        <p>
          İşletmenizin operasyonunu tek panelde toplayın. Cari, stok, fatura ve
          tahsilat hareketleri aynı akışta ilerler.
        </p>
      </ArticleCta>
    </article>
  );
}