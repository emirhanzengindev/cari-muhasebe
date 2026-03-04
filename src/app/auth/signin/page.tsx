"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabase";

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log("SIGNIN PAGE: mounted");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    console.log("LOGIN ATTEMPT:", { email });

    const supabase = getSupabaseBrowser();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log("LOGIN RESULT:", data);
    console.log("LOGIN ERROR:", error);

    if (error) {
      console.error("LOGIN ERROR DETAILS:", error);
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

    console.log("LOGIN SUCCESS, SESSION:", data.session);
    console.log("SIGNIN PAGE: Authentication completed, redirecting to /");
    router.push("/");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-gray-100 to-blue-50">
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-10 items-stretch">
          <section className="rounded-2xl border border-gray-200 bg-white/95 p-6 md:p-8 shadow-sm">
            <p className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
              Cari Muhasebe Platformu
            </p>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
              İşletmeni tek panelden yönet
            </h1>
            <p className="mt-4 text-gray-700">
              Cari hesap, stok, fatura ve finans süreçlerini aynı akışta takip et.
              Giriş yaptıktan sonra tüm operasyon ekranları hazır.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-900">Cari Hesaplar</p>
                <p className="mt-1 text-xs text-gray-700">Tahsilat, ödeme ve bakiye takibi</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-900">Stok Yönetimi</p>
                <p className="mt-1 text-xs text-gray-700">Kritik stok ve depo bazlı kontrol</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-900">Fatura Modülü</p>
                <p className="mt-1 text-xs text-gray-700">Satış ve alış faturalarını yönet</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-900">Raporlar</p>
                <p className="mt-1 text-xs text-gray-700">Karar için hızlı özetler ve trendler</p>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-xl border border-gray-200">
              <img
                src="https://images.unsplash.com/photo-1554224154-22dec7ec8818?auto=format&fit=crop&w=1200&q=80"
                alt="Muhasebe dashboard ekranı"
                className="h-44 w-full object-cover"
                loading="lazy"
              />
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 md:p-8 shadow-sm flex flex-col justify-center">
            <h2 className="text-center text-3xl font-bold text-gray-900">Hesabına giriş yap</h2>

            {error && <div className="mt-6 bg-red-50 text-red-700 p-3 rounded">{error}</div>}

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <input
                type="email"
                placeholder="E-posta"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border p-2 rounded bg-white text-gray-900 placeholder-gray-500"
              />

              <input
                type="password"
                placeholder="Şifre"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border p-2 rounded bg-white text-gray-900 placeholder-gray-500"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white p-2 rounded disabled:opacity-50"
              >
                {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-gray-700">
              Hesabın yok mu?{" "}
              <Link href="/auth/signup" className="text-blue-600">
                Kayıt ol
              </Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
