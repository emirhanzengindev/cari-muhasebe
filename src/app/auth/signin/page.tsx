"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabase";

const topMenu = [
  { label: "NASIL ÇALIŞIR", href: "#nasil-calisir" },
  { label: "ÖZELLİKLER", href: "#ozellikler" },
  { label: "ENTEGRASYONLAR", href: "#entegrasyonlar" },
  { label: "FİYATLANDIRMA", href: "#fiyatlandirma" },
  { label: "BLOG", href: "#blog" },
];

const highlightFeatures = [
  "E-Fatura Entegrasyonu",
  "Mali Müşavir Panel Entegrasyonu",
  "Barkod Etiket Kullanımı",
  "Hızlı Satış Yönetimi",
  "Cari Hesap Yönetimi",
  "Depo & Stok Yönetimi",
];

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = getSupabaseBrowser();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const message = (error.message || "").toLowerCase();
      const isNetworkError =
        message.includes("failed to fetch") ||
        message.includes("network") ||
        message.includes("name_not_resolved");

      setError(
        isNetworkError
          ? "Sunucuya bağlanılamadı. İnternetini ve Supabase URL ayarını kontrol et."
          : "Geçersiz e-posta veya şifre"
      );
      setLoading(false);
      return;
    }

    if (data.session) {
      router.push("/");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900">
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-3xl font-light tracking-wider text-teal-600">
            cari
          </Link>
          <nav className="hidden items-center gap-7 lg:flex">
            {topMenu.map((item) => (
              <a key={item.label} href={item.href} className="text-sm font-semibold text-gray-700 hover:text-teal-600">
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/signup"
              className="rounded-full border border-teal-600 px-5 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-50"
            >
              ÜCRETSİZ DENEYİN
            </Link>
            <span className="text-sm font-semibold text-gray-800">GİRİŞ YAP</span>
          </div>
        </div>
      </header>

      <main>
        <section id="nasil-calisir" className="border-b border-gray-200 bg-white">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-12 lg:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-gradient-to-b from-white to-teal-50 p-8">
              <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">ONLINE ÖN MUHASEBE</p>
              <h1 className="mt-3 text-5xl font-light text-teal-600">Ön Muhasebe</h1>
              <p className="mt-6 text-2xl leading-relaxed text-gray-700">
                Cari, muhasebe süreçlerinizi ve işletme yönetimini tek bir panelde toplar.
              </p>
              <p className="mt-4 text-3xl font-semibold text-gray-900">işletmenizi kolay ve pratik yönetin</p>
              <Link
                href="/auth/signup"
                className="mt-8 inline-flex rounded-full bg-teal-500 px-7 py-3 text-lg font-semibold text-white hover:bg-teal-600"
              >
                hemen ücretsiz dene
              </Link>

              <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {highlightFeatures.map((item) => (
                  <div key={item} className="rounded-xl border border-gray-200 bg-white p-3 text-sm font-medium text-gray-800">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
              <h2 className="text-center text-4xl font-semibold text-gray-900">Hesabına giriş yap</h2>

              {error && <div className="mt-6 rounded-md bg-red-50 p-3 text-red-700">{error}</div>}

              <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                <input
                  type="email"
                  placeholder="E-posta"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white p-3 text-gray-900 placeholder-gray-500"
                />

                <input
                  type="password"
                  placeholder="Şifre"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white p-3 text-gray-900 placeholder-gray-500"
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-md bg-blue-600 p-3 font-semibold text-white disabled:opacity-50"
                >
                  {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-700">
                Hesabın yok mu?{" "}
                <Link href="/auth/signup" className="font-semibold text-blue-600 hover:text-blue-700">
                  Kayıt ol
                </Link>
              </p>

              <div className="mt-8 rounded-xl border border-gray-200 bg-slate-50 p-4 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Yeni Sanal Pos</p>
                <p className="mt-2 text-3xl font-light text-gray-900">
                  <span className="text-teal-600">Cari POS</span> Pratik
                </p>
                <p className="mt-2 text-gray-700">tahsilat sistemine hemen geçiş yapın</p>
              </div>
            </div>
          </div>
        </section>

        <section id="ozellikler" className="bg-white py-12">
          <div className="mx-auto max-w-7xl px-4">
            <h3 className="text-3xl font-bold">Sistem Özellikleri</h3>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                "Gelir / Gider Yönetimi",
                "Ödeme & Tahsilat Yönetimi",
                "Cari Hesap Yönetimi",
                "Depo & Stok Yönetimi",
                "Çek & Senet Yönetimi",
                "Ürün Reçetesi Yönetimi",
                "Taksit (Vade) Takip",
                "Sipariş Modülü",
                "İnsan Kaynakları Yönetimi",
              ].map((item) => (
                <div key={item} className="rounded-xl border border-gray-200 bg-slate-50 p-4 text-sm font-medium text-gray-800">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="entegrasyonlar" className="py-12">
          <div className="mx-auto max-w-7xl px-4">
            <h3 className="text-3xl font-bold">Sistem Entegrasyonları</h3>
            <p className="mt-2 text-gray-700">
              GİB, e-Arşiv, mali müşavir paneli, sanal POS ve mobil kullanım altyapısı ile entegre bir yapı sunulur.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              {["GİB", "e-Arşiv", "Mali Müşavir", "Sanal POS", "iOS", "Android", "API", "e-Ticaret"].map((item) => (
                <div key={item} className="rounded-lg border border-gray-200 bg-white p-4 text-center text-sm font-semibold text-gray-700">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="fiyatlandirma" className="bg-white py-12">
          <div className="mx-auto max-w-7xl px-4">
            <h3 className="text-3xl font-bold">Fiyatlandırma</h3>
            <p className="mt-2 text-gray-700">
              Temel kullanım uygun maliyetlidir. Yan modüller ihtiyaç doğrultusunda ayrıca planlanır.
            </p>
          </div>
        </section>

        <section id="blog" className="py-12">
          <div className="mx-auto max-w-7xl px-4">
            <h3 className="text-3xl font-bold">Sistem Bilgilendirme</h3>
            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
              <article className="rounded-xl border border-gray-200 bg-white p-5">
                <h4 className="font-semibold">Türkiye'nin En Uygun Pratik Ön Muhasebe Programı</h4>
                <p className="mt-2 text-sm text-gray-700">Sade arayüz, hızlı işlem, ekonomik kullanım yaklaşımı.</p>
              </article>
              <article className="rounded-xl border border-gray-200 bg-white p-5">
                <h4 className="font-semibold">e-Fatura başvurusu nasıl yapılır?</h4>
                <p className="mt-2 text-sm text-gray-700">Adım adım geçiş süreci ve teknik hazırlık rehberi.</p>
              </article>
              <article className="rounded-xl border border-gray-200 bg-white p-5">
                <h4 className="font-semibold">Geliştirme yol haritası</h4>
                <p className="mt-2 text-sm text-gray-700">İK, banka entegrasyonu, QR tahsilat ve pazaryeri modülleri.</p>
              </article>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-10 md:grid-cols-4">
          <div>
            <p className="text-lg font-bold text-teal-700">CARİ HAKKINDA</p>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>Hakkımızda</li>
              <li>Cari Blog</li>
              <li>Özellikler</li>
              <li>Fiyatlandırma</li>
              <li>Entegrasyonlar</li>
              <li>Belgeler</li>
              <li>İletişim</li>
            </ul>
          </div>
          <div>
            <p className="text-lg font-bold text-teal-700">ÖN MUHASEBE</p>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>e-Fatura Entegrasyonu</li>
              <li>Mali Müşavir Paneli</li>
              <li>Barkod Etiket Kullanımı</li>
              <li>GİB e-Arşiv Entegrasyonu</li>
              <li>Hızlı Satış Yönetimi</li>
              <li>İnsan Kaynakları Yönetimi</li>
            </ul>
          </div>
          <div>
            <p className="text-lg font-bold text-teal-700">ÖZELLİKLER</p>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>Gelir / Gider Yönetimi</li>
              <li>Cari Hesap Yönetimi</li>
              <li>Depo & Stok Yönetimi</li>
              <li>Çek & Senet Yönetimi</li>
              <li>Ürün Reçetesi Yönetimi</li>
            </ul>
          </div>
          <div>
            <p className="text-lg font-bold text-teal-700">BİLGİLENDİRME</p>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>Gizlilik Sözleşmesi</li>
              <li>Müşteri Aydınlatma Metni</li>
              <li>Hesabımı Nasıl Silebilirim?</li>
              <li>KVKK Politikası</li>
              <li>Çerez Politikası</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
