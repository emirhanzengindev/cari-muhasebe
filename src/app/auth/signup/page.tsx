"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const topMenu = [
  { label: "NASIL ÇALIŞIR", href: "#nasil-calisir" },
  { label: "ÖZELLİKLER", href: "#ozellikler" },
  { label: "ENTEGRASYONLAR", href: "#entegrasyonlar" },
  { label: "FİYATLANDIRMA", href: "#fiyatlandirma" },
  { label: "BLOG", href: "#blog" },
];

const freeSystemFeatures = [
  "E-Fatura Entegrasyonu",
  "Mali Müşavir Panel Entegrasyonu",
  "Barkod Etiket Kullanımı",
  "GİB e-Arşiv Entegrasyonu",
  "Hızlı Satış Yönetimi",
  "İnsan Kaynakları Yönetimi",
  "Sipariş Modülü",
  "Gelir / Gider Yönetimi",
  "Ödeme & Tahsilat Yönetimi",
  "Cari Hesap Yönetimi",
  "Depo & Stok Yönetimi",
  "Çek & Senet Yönetimi",
  "Ürün Reçetesi (Mamül) Yönetimi",
  "Taksit (Vade) İşlem Takip Yönetimi",
];

const accountingFeatures = [
  "Sanal Pos Tahsilat",
  "e-Fatura Başvuru",
  "Sanal Pos (URL) Ödeme Tahsilat",
  "Mükellef ve Mali Müşavir Entegrasyonu",
  "Mobil (iOS & Android) Kullanımı",
  "Hızlı Satış ve Fatura Akışı",
];

export default function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Şifreler eşleşmiyor");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalıdır");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          companyName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Kayıt sırasında bir hata oluştu");
      } else {
        router.push("/auth/signin?registered=true");
      }
    } catch {
      setError("Beklenmeyen bir hata oluştu");
    } finally {
      setLoading(false);
    }
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
            <a
              href="#kayit"
              className="rounded-full border border-teal-600 px-5 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-50"
            >
              ÜCRETSİZ DENEYİN
            </a>
            <Link href="/auth/signin" className="text-sm font-semibold text-gray-700 hover:text-teal-700">
              GİRİŞ YAP
            </Link>
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
                Cari; muhasebe süreçlerinizi, e-fatura/e-arşiv geçişlerinizi ve günlük finans akışınızı tek panelde
                yönetmenizi sağlar.
              </p>
              <p className="mt-4 text-3xl font-semibold text-gray-900">tüm kullanıcılara en uygun şekilde</p>
              <a
                href="#kayit"
                className="mt-8 inline-flex rounded-full bg-teal-500 px-7 py-3 text-lg font-semibold text-white hover:bg-teal-600"
              >
                hemen ücretsiz dene
              </a>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-8">
              <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">YENİ SANAL POS</p>
              <h2 className="mt-3 text-6xl font-light leading-tight">
                <span className="text-teal-600">Cari POS</span> Pratik
              </h2>
              <p className="mt-4 text-5xl leading-tight text-gray-800">tahsilat sistemine hemen geçiş yapın</p>
              <button className="mt-8 rounded-full bg-emerald-500 px-7 py-3 text-lg font-semibold text-white hover:bg-emerald-600">
                hemen başvur
              </button>
              <div className="mt-8 grid grid-cols-3 gap-3 text-center text-xs font-semibold text-gray-600">
                <span className="rounded-lg border border-gray-200 bg-gray-50 p-2">Ziraat</span>
                <span className="rounded-lg border border-gray-200 bg-gray-50 p-2">Garanti</span>
                <span className="rounded-lg border border-gray-200 bg-gray-50 p-2">Akbank</span>
              </div>
            </div>
          </div>
        </section>

        <section id="kayit" className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-12 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-8">
            <h3 className="text-3xl font-bold">Sistem Özellikleri</h3>
            <p className="mt-3 text-gray-700">
              Modüller tek bir arayüz üzerinde birbiriyle bağlantılı çalışır. İşletmenizin günlük iş yükünü sadeleştirir.
            </p>
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {freeSystemFeatures.map((feature) => (
                <div key={feature} className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm font-medium text-gray-800">
                  {feature}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-2xl font-bold text-gray-900">Kayıt Ol</h3>
            <p className="mt-2 text-sm text-gray-600">Hemen ücretsiz hesap aç ve tüm modülleri kullanmaya başla.</p>

            {error && <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

            <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
              <input
                type="text"
                required
                placeholder="Adınız Soyadınız"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                type="text"
                required
                placeholder="İşletme Adı"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
              <input
                type="email"
                required
                placeholder="E-posta"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                type="password"
                required
                placeholder="Şifre (en az 6 karakter)"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <input
                type="password"
                required
                placeholder="Şifre Tekrar"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md bg-teal-600 px-4 py-2 font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
              >
                {loading ? "Kayıt yapılıyor..." : "Ücretsiz Hesap Oluştur"}
              </button>
            </form>

            <p className="mt-4 text-center text-sm text-gray-700">
              Hesabın var mı?{" "}
              <Link href="/auth/signin" className="font-semibold text-teal-700 hover:text-teal-800">
                Giriş Yap
              </Link>
            </p>
          </div>
        </section>

        <section id="ozellikler" className="bg-white py-12">
          <div className="mx-auto max-w-7xl px-4">
            <h3 className="text-3xl font-bold">Ön Muhasebe Özellikleri</h3>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {accountingFeatures.map((feature) => (
                <div key={feature} className="rounded-xl border border-gray-200 bg-slate-50 p-4 text-sm font-medium text-gray-800">
                  {feature}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="entegrasyonlar" className="py-12">
          <div className="mx-auto max-w-7xl px-4">
            <h3 className="text-3xl font-bold">Sistem Entegrasyonları</h3>
            <p className="mt-2 text-gray-700">
              e-Fatura / e-Arşiv, mali müşavir paneli, sanal POS ve mobil kullanım entegrasyonları aktif geliştirme
              akışında.
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
              Temel paket sade ve ekonomik yapıdadır. Sanal POS ve API gibi yan modüller ayrı ücretlendirilebilir.
            </p>
            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
              <div className="rounded-xl border border-gray-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-gray-500">BAŞLANGIÇ</p>
                <p className="mt-2 text-3xl font-bold">Ücretsiz</p>
                <p className="mt-2 text-sm text-gray-700">Temel ön muhasebe modülleri</p>
              </div>
              <div className="rounded-xl border-2 border-teal-500 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-teal-700">POPÜLER</p>
                <p className="mt-2 text-3xl font-bold">Standart</p>
                <p className="mt-2 text-sm text-gray-700">e-Fatura/e-Arşiv ve gelişmiş süreçler</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-gray-500">EK MODÜLLER</p>
                <p className="mt-2 text-3xl font-bold">Opsiyonel</p>
                <p className="mt-2 text-sm text-gray-700">Sanal POS, API, özel entegrasyonlar</p>
              </div>
            </div>
          </div>
        </section>

        <section id="blog" className="py-12">
          <div className="mx-auto max-w-7xl px-4">
            <h3 className="text-3xl font-bold">Sistem Bilgilendirme</h3>
            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
              <article className="rounded-xl border border-gray-200 bg-white p-5">
                <h4 className="font-semibold">Türkiye'nin En Uygun Pratik Ön Muhasebe Programı</h4>
                <p className="mt-2 text-sm text-gray-700">Sade yapı, temel işlemler, ekonomik kullanım yaklaşımı.</p>
              </article>
              <article className="rounded-xl border border-gray-200 bg-white p-5">
                <h4 className="font-semibold">Tüm süreçleriyle e-Fatura başvurusu nasıl yapılır?</h4>
                <p className="mt-2 text-sm text-gray-700">Adım adım geçiş süreci ve teknik hazırlık noktaları.</p>
              </article>
              <article className="rounded-xl border border-gray-200 bg-white p-5">
                <h4 className="font-semibold">Cari'de sıradaki geliştirme süreçleri</h4>
                <p className="mt-2 text-sm text-gray-700">İK, banka entegrasyonu, QR tahsilat ve pazaryeri adımları.</p>
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
              <li>Sipariş Modülü</li>
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
              <li>Taksit (Vade) Takip</li>
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
              <li>KVKK Başvuru Formu</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-200 px-4 py-4 text-center text-sm text-gray-600">
          Cari® kelime markası ve logoları, Technoone Yazılım Sist. Ltd. Şti.'ye ait tescilli ticari markasıdır. ©
          2023 Cari. Her hakkı saklıdır.
        </div>
      </footer>
    </div>
  );
}
