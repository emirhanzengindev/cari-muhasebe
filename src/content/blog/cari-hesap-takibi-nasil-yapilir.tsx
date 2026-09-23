import type { BlogPostMeta } from "./types";
import {
  ArticleCta,
  H2,
  H3,
  InternalLink,
  Lead,
  LI,
  Note,
  OLI,
  OL,
  P,
  UL,
} from "./prose";

export const meta: BlogPostMeta = {
  slug: "cari-hesap-takibi-nasil-yapilir",
  title: "Cari Hesap Takibi Nasıl Yapılır?",
  description:
    "Cari hesap takibi nasıl yapılır? Hesap kartlarının hazırlanması, günlük hareket girişi, tahsilat eşleştirme ve ay sonu mutabakat adımlarını anlatıyoruz.",
  excerpt:
    "Cari hesap takibini düzenli yürütmek için izlenebilecek adımlar: hazırlık, günlük kayıt, tahsilat eşleştirme ve mutabakat.",
  datePublished: "2026-08-20",
  keywords: [
    "cari hesap takibi nasıl yapılır",
    "cari hesap takip programı",
    "tahsilat eşleştirme",
    "cari mutabakat",
  ],
  readingMinutes: 6,
  relatedPages: ["/cari-hesap-programi", "/tahsilat-takip-programi"],
};

export default function Content() {
  return (
    <article>
      <Lead>
        Cari hesap takibi, müşteri ve tedarikçilerle olan para hareketlerinin
        düzenli olarak kaydedilmesi ve bakiyelerin güncel tutulmasıdır. Doğru
        kurgulandığında hangi faturanın açık, hangi ödemenin beklediği tek
        bakışta görülür.
      </Lead>

      <P>
        Takibin kalitesi, kullanılan programdan çok sürecin düzenine bağlıdır.
        Aşağıdaki adımlar küçük bir işletmede de, birden fazla kullanıcının
        çalıştığı bir yapıda da uygulanabilir.
      </P>

      <H2>1. Hesap Kartlarını Hazırlayın</H2>
      <P>
        Takibe başlamadan önce her müşteri ve tedarikçi için ayrı bir hesap
        kartı oluşturulmalıdır. Aynı firmayı iki farklı isimle kaydetmek,
        bakiyelerin bölünmesine ve yanlış mutabakata yol açar.
      </P>
      <UL>
        <LI>Firma adını resmi unvanıyla kaydedin.</LI>
        <LI>Müşteri / tedarikçi ayrımını net yapın.</LI>
        <LI>Vergi numarası ve iletişim bilgilerini ekleyin.</LI>
        <LI>Varsa açılış bakiyesini tek hareket olarak girin.</LI>
        <LI>Ödeme alışkanlığını not edin: peşin, vadeli veya kısmi ödeme.</LI>
      </UL>

      <H2>2. Hareketleri Günlük Olarak Kaydedin</H2>
      <P>
        Cari takibinde en sık yapılan hata, hareketleri haftalık veya aylık
        olarak toplu girmektir. Toplu girişlerde tarih ve tutar hataları
        birikerek büyür. Günlük kayıt alışkanlığı bu riski ortadan kaldırır.
      </P>
      <OL>
        <LI>Kesilen ve alınan faturaları aynı gün sisteme işleyin.</LI>
        <LI>Tahsilat ve ödemeleri belge numarasıyla kaydedin.</LI>
        <LI>Kısmi ödemelerde ödenen tutarı faturayla eşleştirin.</LI>
        <LI>Bakiyeyi hareketten sonra kontrol edin.</LI>
      </OL>

      <H2>3. Tahsilatı Faturayla Eşleştirin</H2>
      <P>
        Bir müşteri birden fazla faturasını tek ödemede kapatabilir. Bu durumda
        ödemenin hangi faturaya ne kadar kapama yaptığının kaydedilmesi gerekir.
        Aksi halde toplam bakiye doğru görünse bile açık fatura listesi yanlış
        kalır.
      </P>
      <H3>Neden eşleştirme önemlidir?</H3>
      <UL>
        <LI>Vadesi geçen faturalar doğru belirlenir.</LI>
        <LI>Hangi müşterinin gerçekten gecikmede olduğu görülür.</LI>
        <LI>Müşteriye gönderilen ekstre tutarlı olur.</LI>
      </UL>
      <Note>
        Kısmi tahsilat, bakiyenin bir bölümünü kapatır ve kalan tutar açık fatura
        olarak izlenmeye devam eder. Bu nedenle her tahsilat kaydında kapama
        bilgisi tutulmalıdır.
      </Note>

      <H2>4. Vade Tarihlerini İzleyin</H2>
      <P>
        Cari bakiyenin tek başına doğru olması yeterli değildir; ne zaman
        tahsil edileceği de bilinmelidir. Vadesi yaklaşan ve vadesi geçen
        faturaların ayrı bir listede takip edilmesi, nakit akışını önceden
        görmeyi sağlar.
      </P>

      <H2>5. Ay Sonunda Mutabakat Yapın</H2>
      <P>
        Her ayın sonunda cari ekstreleri gözden geçirin. Müşterinin defterindeki
        bakiye ile kendi bakiyeniz farklıysa farkın kaynağı mutlaka bulunmalıdır.
        En sık nedenler şunlardır:
      </P>
      <UL>
        <LI>Karşı tarafa ulaşmayan fatura</LI>
        <LI>Sisteme girilmeyen tahsilat</LI>
        <LI>Yanlış cari hesaba işlenen hareket</LI>
        <LI>İade veya düzeltme kayıtlarının eksik olması</LI>
      </UL>

      <H2>Cari Hesap Takibinde Sık Yapılan Hatalar</H2>
      <UL>
        <LI>Hareketleri geciktirerek toplu girmek</LI>
        <LI>Fatura ile tahsilatı ilişkilendirmemek</LI>
        <LI>Aynı firmayı farklı hesaplarda çoğaltmak</LI>
        <LI>Pasif hesapları arşivlemeyip listeyi şişirmek</LI>
        <LI>Vade tarihi bilgisini sisteme hiç girmemek</LI>
      </UL>

      <H2>CariOnline&apos;da Cari Hesap Takibi</H2>
      <P>
        CariOnline&apos;da fatura kaydedildiğinde cari hareket otomatik oluşur;
        tahsilat kaydı ise ilgili faturayla eşleştirilebilir. Hesabın güncel
        bakiyesi, açık faturaları ve vadesi geçen tutarları cari ekranda görünür
        ve ekstre PDF olarak indirilebilir. Başlangıç için{" "}
        <InternalLink href="/cari-hesap-programi">
          cari hesap programı
        </InternalLink>{" "}
        ve{" "}
        <InternalLink href="/tahsilat-takip-programi">
          tahsilat takip programı
        </InternalLink>{" "}
        sayfalarına bakabilirsiniz. Borç ve alacak kavramlarını daha ayrıntılı
        okumak için{" "}
        <InternalLink href="/blog/borc-alacak-takibi">
          borç ve alacak takibi
        </InternalLink>{" "}
        yazımızı inceleyin.
      </P>

      <ArticleCta>
        <p>
          Cari hesaplarınızı tek panelden yönetmeye başlayın. Faturalar, tahsilat
          ve ödemeler aynı akışta kaydedilir, bakiyeler güncel kalır.
        </p>
      </ArticleCta>
    </article>
  );
}