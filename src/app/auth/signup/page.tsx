"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
      setError("Sifreler eslesmiyor");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Sifre en az 6 karakter olmalidir");
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
        setError(data.error || "Kayit sirasinda bir hata olustu");
      } else {
        router.push("/auth/signin?registered=true");
      }
    } catch {
      setError("Beklenmeyen bir hata olustu");
    } finally {
      setLoading(false);
    }
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
            <span className="rounded-full border border-blue-600 px-4 py-2 text-sm font-semibold text-blue-700">
              KAYIT
            </span>
            <Link href="/auth/signin" className="text-sm font-semibold text-blue-700 hover:text-blue-800">
              GIRIS YAP
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10">
        <section className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border border-blue-100 bg-white p-8 shadow-sm">
            <p className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
              PROJE OZETI
            </p>
            <h1 className="mt-4 text-4xl font-bold text-gray-900">On Muhasebe akisini hemen baslat</h1>
            <p className="mt-4 text-lg text-gray-700">
              Hesap olusturduktan sonra cari, stok, fatura, hizli satis, finans ve rapor modullerine dogrudan erisirsin.
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
                Uygulama icindeki moduller birbirine bagli calisir; hareketler tekil tablolarda degil entegre akista ilerler.
              </p>
            </div>
            <div id="raporlar" className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-900">Raporlar</p>
              <p className="mt-2 text-sm text-gray-700">Gunluk ozetler ve trendler ile finansal durumu hizli gor.</p>
            </div>
            <div id="guvenlik" className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-900">Guvenlik</p>
              <p className="mt-2 text-sm text-gray-700">
                Kimlik dogrulama ve tenant tabanli veri ayrimi ile her kullanici sadece kendi verisini gorur.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-white p-8 shadow-sm">
            <h2 className="text-center text-4xl font-semibold text-gray-900">Hesap olustur</h2>
            <p className="mt-2 text-center text-sm text-gray-600">Dakikalar icinde kuruluma basla.</p>

            {error && <div className="mt-6 rounded-md bg-red-50 p-3 text-red-700">{error}</div>}

            <form className="mt-6 space-y-3" onSubmit={handleSubmit}>
              <input
                type="text"
                required
                placeholder="Ad Soyad"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                type="text"
                required
                placeholder="Isletme Adi"
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
                placeholder="Sifre (en az 6 karakter)"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <input
                type="password"
                required
                placeholder="Sifre Tekrar"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Kayit yapiliyor..." : "Ucretsiz Hesap Olustur"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-700">
              Hesabin var mi?{" "}
              <Link href="/auth/signin" className="font-semibold text-blue-700 hover:text-blue-800">
                Giris Yap
              </Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
