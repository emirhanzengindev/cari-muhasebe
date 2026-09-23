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
  slug: "stok-takibi-nasil-yapilir",
  title: "Stok Takibi Nasıl Yapılır?",
  description:
    "Stok takibi nasıl yapılır? Ürün ve depo yapısının kurulması, stok hareketlerinin kaydı, kritik seviye belirleme ve sayım sürecini adım adım anlatıyoruz.",
  excerpt:
    "Doğru stok takibi için ürün kartları, depo yapısı, hareket kayıtları ve kritik seviye takibinin nasıl kurgulandığını anlatıyoruz.",
  datePublished: "2026-09-10",
  keywords: [
    "stok takibi nasıl yapılır",
    "stok takip programı",
    "stok hareketleri",
    "kritik stok seviyesi",
  ],
  readingMinutes: 6,
  relatedPages: ["/stok-takip-programi", "/fatura-programi"],
};

export default function Content() {
  return (
    <article>
      <Lead>
        Stok takibi, hangi üründen ne kadar elinizde olduğunun ve bu miktarın
        hangi hareketlerle değiştiğinin kayıt altında tutulmasıdır. Amaç, satış
        yaparken stokta ne olduğunu tahmin etmek zorunda kalmamaktır.
      </Lead>

      <P>
        Stok takibi yalnızca depo sorumlusunun işi değildir. Satın alma, satış
        ve muhasebe aynı stok verisini kullanır. Bu nedenle kayıtların tek bir
        sistemde tutulması, bölümler arası tutarsızlığı önler.
      </P>

      <H2>Stok Takibine Nereden Başlanır?</H2>
      <P>
        Sağlıklı bir stok yapısı üç temel unsur üzerine kurulur: ürün kartları,
        depo yapısı ve hareket kayıtları.
      </P>
      <OL>
        <LI>
          <strong className="font-semibold text-[#122B3A]">Ürün kartlarını oluşturun.</strong>{" "}
          Ürün adı, SKU veya barkod, birim, kategori ve maliyet bilgisi eksiksiz
          olmalıdır.
        </LI>
        <LI>
          <strong className="font-semibold text-[#122B3A]">Depo yapısını belirleyin.</strong>{" "}
          Tek depo kullanıyorsanız bile depo tanımlamak, ileride şube veya
          ikinci depo açıldığında geçişi kolaylaştırır.
        </LI>
        <LI>
          <strong className="font-semibold text-[#122B3A]">Açılış miktarlarını girin.</strong>{" "}
          Sayım sonucunu tek seferde sisteme aktarın ve bundan sonraki tüm
          değişimleri hareket olarak kaydedin.
        </LI>
      </OL>

      <H2>Stok Hareketleri Nasıl Kaydedilir?</H2>
      <P>
        Stok miktarı elle değiştirilmez; hareket ile değişir. Her giriş ve çıkış
        ayrı bir kayıttır ve hareketin kaynağı bellidir.
      </P>
      <H3>Stok girişleri</H3>
      <UL>
        <LI>Alış faturası ile gelen ürünler</LI>
        <LI>İade edilen ürünler</LI>
        <LI>Sayım sonucu oluşan düzeltmeler</LI>
      </UL>
      <H3>Stok çıkışları</H3>
      <UL>
        <LI>Satış faturası ile sevk edilen ürünler</LI>
        <LI>Fire, kayıp veya hasar kayıtları</LI>
        <LI>Depolar arası transferler</LI>
      </UL>
      <Note>
        Stok miktarını doğrudan değiştirmek yerine hareket kaydetmek, geçmişi
        izlenebilir kılar. Bir tutarsızlık görüldüğünde hangi hareketin
        miktarı değiştirdiği kolayca bulunur.
      </Note>

      <H2>Kritik Seviye Belirlemek</H2>
      <P>
        Her ürün için bir kritik seviye tanımlanması, stok bitmeden sipariş
        vermeyi sağlar. Kritik seviye belirlenirken ürünün tedarik süresi ve
        ortalama satış hızı dikkate alınmalıdır.
      </P>
      <UL>
        <LI>Tedarik süresi uzun ürünlerde seviyeyi yükseltin.</LI>
        <LI>Hızlı satılan ürünleri daha sık kontrol edin.</LI>
        <LI>Sezonluk ürünlerde seviyeyi dönemsel güncelleyin.</LI>
      </UL>

      <H2>Sayım ve Düzeltme</H2>
      <P>
        Stok kayıtları ne kadar düzenli tutulsa da belirli aralıklarla fiziksel
        sayım yapılmalıdır. Sayım sonucu ile sistemdeki miktar arasındaki fark,
        düzeltme hareketi olarak kaydedilir. Böylece farkın nedeni
        kaybedilmeden kayda geçmiş olur.
      </P>

      <H2>Stok ve Cari Süreçler Birlikte Yürümeli</H2>
      <P>
        Bir satış işlemi aslında üç kayıt üretir: stok çıkışı, satış faturası ve
        cari hareket. Bu üç kaydın aynı işlem sırasında oluşması, stok ve cari
        bakiyelerin tutarlı kalmasını sağlar. Aksi halde depoda olmayan ürün
        satılmış ya da fatura kesilmiş ama bakiyeye işlenmemiş olabilir.
      </P>

      <H2>CariOnline ile Stok Takibi</H2>
      <P>
        CariOnline&apos;da ürün, kategori ve depo tanımlarını oluşturup stok
        hareketlerini ürün bazında izleyebilirsiniz. Kritik seviyenin altına
        düşen ürünler ayrı görünür, ürün listesi Excel ile toplu olarak
        aktarılabilir. Satış sırasında oluşan stok çıkışı ile{" "}
        <InternalLink href="/fatura-programi">fatura</InternalLink> ve cari
        hareket aynı akışta kaydedilir. Ayrıntılar için{" "}
        <InternalLink href="/stok-takip-programi">
          stok takip programı
        </InternalLink>{" "}
        sayfasına göz atabilirsiniz.
      </P>

      <ArticleCta>
        <p>
          Stok, fatura ve cari hareketleri tek panelden yönetmeye başlayın.
        </p>
      </ArticleCta>
    </article>
  );
}