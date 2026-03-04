"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabase";

const menuItems = [
  { label: "MODULLER", href: "#moduller" },
  { label: "IS AKISI", href: "#is-akisi" },
  { label: "RAPORLAR", href: "#raporlar" },
  { label: "GUVENLIK", href: "#guvenlik" },
];

const projectModules = [
  "Cari Hesaplar",
  "Stok Yonetimi",
  "Faturalar",
  "Hizli Satis",
  "Finans",
  "Raporlar",
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
      const msg = (error.message || "").toLowerCase();
      const isNetwork = msg.includes("failed to fetch") || msg.includes("network") || msg.includes("name_not_resolved");
      setError(isNetwork ? "Sunucuya baglanilamadi. Internet ve API ayarlarini kontrol et." : "Gecersiz e-posta veya sifre");
      setLoading(false);
      return;
    }

    if (data.session) router.push("/");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 text-gray-900">
      <header className="sticky top-0 z-30 border-b border-blue-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-2xl font-bold tracking-tight text-blue-700">
            carionline
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            {menuItems.map((item) => (
              <a key={item.label} href={item.href} className="text-sm font-semibold text-gray-700 hover:text-blue-700">
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/signup"
              className="rounded-full border border-blue-600 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
            >
              KAYIT OL
            </Link>
            <span className="text-sm font-semibold text-blue-700">GIRIS</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10">
        <section className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border border-blue-100 bg-white p-8 shadow-sm">
            <p className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
              PROJE OZETI
            </p>
            <h1 className="mt-4 text-4xl font-bold text-gray-900">Tum operasyonu tek panelde yonet</h1>
            <p className="mt-4 text-lg text-gray-700">
              Bu uygulama; cari hesap, stok, fatura, hizli satis, finans ve rapor sureclerini tek bir akista toplar.
            </p>

            <div id="moduller" className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {projectModules.map((m) => (
                <div key={m} className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm font-medium text-gray-800">
                  {m}
                </div>
              ))}
            </div>

            <div id="is-akisi" className="mt-6 rounded-xl border border-gray-200 bg-blue-50 p-4">
              <p className="text-sm font-semibold text-blue-800">Is Akisi</p>
              <p className="mt-2 text-sm text-gray-700">
                Satis ve fatura islemleri stok hareketlerini etkiler, cari bakiyeler finans kayitlariyla birlikte guncellenir.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-white p-8 shadow-sm">
            <h2 className="text-center text-4xl font-semibold text-gray-900">Hesabina giris yap</h2>

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
                placeholder="Sifre"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white p-3 text-gray-900 placeholder-gray-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md bg-blue-600 p-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Giris yapiliyor..." : "Giris Yap"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-700">
              Hesabin yok mu?{" "}
              <Link href="/auth/signup" className="font-semibold text-blue-700 hover:text-blue-800">
                Kayit ol
              </Link>
            </p>

            <div id="raporlar" className="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-900">Raporlar ve Ozetler</p>
              <p className="mt-2 text-sm text-gray-700">
                Dashboard ozetleri ile satis, bakiye ve stok durumunu tek ekranda goruntule.
              </p>
            </div>
            <div id="guvenlik" className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-900">Guvenlik ve Yetkilendirme</p>
              <p className="mt-2 text-sm text-gray-700">
                Kimlik dogrulama, tenant bazli veri ayrimi ve API tarafinda yetki kontrolleri aktif.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
