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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <h2 className="text-center text-3xl font-bold text-gray-900">Hesabına giriş yap</h2>

        {error && <div className="bg-red-50 text-red-700 p-3 rounded">{error}</div>}

        <form className="space-y-4" onSubmit={handleSubmit}>
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

        <p className="text-center text-sm text-gray-700">
          Hesabın yok mu?{" "}
          <Link href="/auth/signup" className="text-blue-600">
            Kayıt ol
          </Link>
        </p>
      </div>
    </div>
  );
}
