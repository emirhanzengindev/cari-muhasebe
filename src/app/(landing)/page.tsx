import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/marketing/JsonLd";
import Mountains from "@/components/marketing/Mountains";
import SiteFooter, { CreamBand } from "@/components/marketing/SiteFooter";
import SiteHeader from "@/components/marketing/SiteHeader";
import {
  organizationSchema,
  softwareApplicationSchema,
  websiteSchema,
} from "@/components/marketing/structuredData";
import RevealRoot from "@/components/landing/RevealRoot";
import ScrollStatement from "@/components/landing/ScrollStatement";
import WorkflowSteps, {
  Arrow,
  type WorkflowStep,
} from "@/components/landing/WorkflowSteps";
import s from "@/components/landing/landing.module.css";
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

const workFlowSteps: WorkflowStep[] = [
  {
    title: "Cari hesabı oluşturun",
    description:
      "Müşteri veya tedarikçi hesabını bilgileriyle kaydedin. Aktif ve pasif hesapları ayırarak listeyi düzenli tutun.",
    label: "Cari oluşturuluyor",
    pills: ["Müşteri", "Tedarikçi"],
  },
  {
    title: "Faturayı kesin",
    description:
      "Satış faturasını kalemleriyle oluşturun. Fatura kaydedildiği anda ilgili cari hesaba borç kaydı işlenir.",
    label: "Fatura kaydediliyor",
    pills: ["Satış", "Alış"],
  },
  {
    title: "Stok hareketini izleyin",
    description:
      "Faturaya eklenen ürünlerin stok miktarı düşer; ürün bazında hareket geçmişini görebilirsiniz.",
    label: "Stok güncelleniyor",
    pills: ["Giriş", "Çıkış"],
  },
  {
    title: "Tahsilatı eşleştirin",
    description:
      "Gelen ödemeyi kaydedin ve kapatacağı faturayı seçin. Kısmi ödemelerde kalan tutar açık kalır.",
    label: "Tahsilat eşleşiyor",
    pills: ["Tam", "Kısmi"],
  },
  {
    title: "Durumu raporlayın",
    description:
      "Panel özeti ve raporlar üzerinden alacak, borç, stok değeri ve satış tablosunu değerlendirin.",
    label: "Rapor hazırlanıyor",
    pills: ["Excel", "PDF"],
  },
];

const accessNotes = [
  {
    title: "Tarayıcıdan erişim",
    description:
      "CariOnline tarayıcı üzerinden çalışır; ayrı bir kurulum adımı gerekmez.",
    icon: (
      <>
        <rect x="2" y="3" width="12" height="9" rx="1.5" />
        <path d="M5 14h6" />
      </>
    ),
  },
  {
    title: "İşletme bazlı veri ayrımı",
    description:
      "Her işletmenin kayıtları kendi hesabı altında tutulur; kullanıcılar yalnızca yetkili oldukları işletmenin verisini görür.",
    icon: <path d="M2 5h12M2 11h12M5 2v12M11 2v12" />,
  },
  {
    title: "Oturum güvenliği",
    description:
      "Panele erişim oturum doğrulamasıyla korunur. Oturum açmadan uygulama sayfalarına erişilemez.",
    icon: (
      <>
        <rect x="3" y="7" width="10" height="7" rx="1.5" />
        <path d="M5 7V5a3 3 0 016 0v2" />
      </>
    ),
  },
];

/** Hero'daki örnek panel — temsili veriler, gerçek kayıt değildir. */
const sampleRows = [
  { initials: "AY", color: "#6b8e6b", name: "Aydın Yapı Ltd.", last: "Fatura #2026-1184", status: "Ödendi", tone: s.tOk },
  { initials: "KG", color: "#b07a4f", name: "Kaya Gıda", last: "Tahsilat ₺18.400", status: "Ödendi", tone: s.tOk },
  { initials: "DM", color: "#5d6a8a", name: "Demir Mobilya", last: "Fatura #2026-1179", status: "Kısmi", tone: s.tWarn },
  { initials: "ŞT", color: "#8a5d7a", name: "Şahin Tekstil", last: "Çek · vade 28.11", status: "Bekliyor", tone: s.tWarn },
  { initials: "ÖE", color: "#a35a4f", name: "Özkan Elektrik", last: "Fatura #2026-1162", status: "Gecikti", tone: s.tBad },
];

const heroModules = ["Cari Hesap", "Stok Takip", "Fatura", "Tahsilat", "Kasa & Banka", "Raporlama"];

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
    <RevealRoot className={s.page}>
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

      <a href="#main-content" className={s.skip}>
        İçeriğe geç
      </a>

      <SiteHeader />

      <main id="main-content">
        {/* ================= HERO ================= */}
        <section className={s.hero}>
          <div className={s.heroSky} />
          <Mountains className={s.heroMountains} idPrefix="lp" />

          <div className={`${s.wrap} ${s.heroInner}`}>
            <div>
              <h1>Online Cari Hesap ve Ön Muhasebe Programı</h1>
              <p className={s.heroLead}>
                Cari hesap, stok, fatura, tahsilat ve finansal hareketlerinizi
                tek panelden yönetin. CariOnline ile işletmenizin operasyonu
                daha net ve düzenli takip edilir.
              </p>
              <div className={s.heroActions}>
                <Link href="/auth/signup" className={`${s.btn} ${s.btnLime}`}>
                  Hesap Oluştur <Arrow />
                </Link>
                <Link href="/auth/signin" className={s.textLink}>
                  Hesabım var, giriş yap
                </Link>
              </div>
            </div>

            <div className={s.dash} aria-hidden="true">
              <div className={s.dashHead}>
                <span>Cari Hesap Özeti</span>
                <span>Örnek görünüm</span>
              </div>
              <div className={s.dashBody}>
                <div className={s.dashMain}>
                  <div className={s.stats}>
                    <div className={s.stat}>
                      <b>₺284K</b>
                      <small>Toplam alacak</small>
                    </div>
                    <div className={s.stat}>
                      <b>12</b>
                      <small>Vadesi yaklaşan</small>
                    </div>
                    <div className={s.stat}>
                      <b>%86</b>
                      <small>Tahsilat oranı</small>
                    </div>
                  </div>
                  <table>
                    <thead>
                      <tr>
                        <th>Cari</th>
                        <th>Son hareket</th>
                        <th>Durum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sampleRows.map((row) => (
                        <tr key={row.name}>
                          <td>
                            <div className={s.who}>
                              <span className={s.av} style={{ background: row.color }}>
                                {row.initials}
                              </span>
                              {row.name}
                            </div>
                          </td>
                          <td>{row.last}</td>
                          <td>
                            <span className={`${s.tag} ${row.tone}`}>{row.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className={s.dashSide}>
                  <span>Cariler</span>
                  <span>Stok</span>
                  <span>Faturalar</span>
                  <span>Tahsilat</span>
                  <span>Kasa &amp; Banka</span>
                  <span>Raporlar</span>
                </div>
              </div>
            </div>
          </div>

          <div className={s.heroStrip}>
            <ul className={s.wrap} aria-label="Modüller">
              {heroModules.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* ================= WORKFLOW ================= */}
        <section className={s.section} aria-labelledby="isleyis-baslik">
          <div className={s.wrap}>
            <div className={s.chip} data-reveal>
              <i aria-hidden="true">◎</i>Günlük işleyiş
            </div>
            <h2 id="isleyis-baslik" className={s.h2} data-reveal>
              <span className={s.soft}>Faturadan tahsilata,</span> her hareket
              diğerini otomatik günceller
            </h2>
            <WorkflowSteps steps={workFlowSteps} />
          </div>
        </section>

        {/* ================= MODULES ================= */}
        <section className={s.section} style={{ paddingTop: 40 }} aria-labelledby="panel-baslik">
          <div className={s.wrap}>
            <div className={s.chip} data-reveal>
              <i aria-hidden="true">▦</i>Panel
            </div>
            <h2 id="panel-baslik" className={s.h2} data-reveal>
              Tek panelde birleşen iş akışı{" "}
              <span className={s.soft}>— modüller birbirinden bağımsız değil.</span>
            </h2>
            <ul className={s.modules} data-reveal>
              {panelFeatures.map((f, i) => (
                <li key={f.title} className={s.mod}>
                  <span className={s.num} aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3>{f.title}</h3>
                  <p>{f.description}</p>
                  {f.points?.map((pt) => (
                    <p key={pt}>{pt}</p>
                  ))}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ================= STATEMENT ================= */}
        <section className={s.statement}>
          <div className={s.wrap}>
            <ScrollStatement text="İşletmeler CariOnline ile cari, stok, fatura ve tahsilatı tek panelde birleştirir; hangi verinin güncel olduğunu aramak yerine işlerine odaklanır." />
          </div>
        </section>

        {/* ================= ACCESS (dark) ================= */}
        <section className={s.dark} aria-labelledby="erisim-baslik">
          <div className={`${s.wrap} ${s.darkGrid}`}>
            <div className={s.darkIntro} data-reveal>
              <h2 id="erisim-baslik">Panele erişim ve veri ayrımı</h2>
              <p>
                İşletme verisi, oturum doğrulaması ve işletme bazlı ayrım ile
                korunur.
              </p>
            </div>
            <ul className={s.darkItems}>
              {accessNotes.map((n) => (
                <li key={n.title} className={s.darkItem} data-reveal>
                  <span className={s.ico} aria-hidden="true">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
                      {n.icon}
                    </svg>
                  </span>
                  <div>
                    <h3>{n.title}</h3>
                    <p>{n.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ================= LINKS ================= */}
        <section className={s.section} aria-labelledby="baglanti-baslik">
          <div className={s.wrap}>
            <div className={s.chip} data-reveal>
              <i aria-hidden="true">↗</i>Bağlantılar
            </div>
            <h2 id="baglanti-baslik" className={s.h2} data-reveal>
              Programlar <span className={s.soft}>ve ön muhasebe rehberleri</span>
            </h2>
            <div className={s.linksGrid}>
              <div data-reveal>
                <h3>Programlar</h3>
                <ul>
                  {productPages.map((page) => (
                    <li key={page.href}>
                      <Link href={page.href}>
                        {page.title} <span aria-hidden="true">→</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div data-reveal>
                <h3>Blog</h3>
                <ul>
                  {blogPosts.map((post) => (
                    <li key={post.slug}>
                      <Link href={getBlogPostPath(post.slug)}>
                        {post.title} <span aria-hidden="true">→</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      <CreamBand>
        <section className={s.cta}>
          <div className={s.wrap}>
            <h2 data-reveal>
              Hesaplarınız tek panelde.
              <br />
              Siz işinize odaklanın.
            </h2>
            <div className={s.ctaActions} data-reveal>
              <Link href="/auth/signin" className={`${s.btn} ${s.btnOutline}`}>
                Giriş Yap
              </Link>
              <Link href="/auth/signup" className={`${s.btn} ${s.btnLime}`}>
                Hesap Oluştur <Arrow />
              </Link>
            </div>
          </div>
        </section>
        <SiteFooter />
      </CreamBand>
    </RevealRoot>
  );
}

