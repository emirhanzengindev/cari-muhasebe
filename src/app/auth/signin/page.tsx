"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import AuthShell, {
  AuthAlert,
  authInputClass,
  authLabelClass,
  authSubmitClass,
} from "@/components/auth/AuthShell";
import { ArrowIcon } from "@/components/marketing/SiteHeader";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  // Kayıt sonrası /auth/signin?registered=true ile gelinir.
  // useSearchParams yerine burada okunuyor; sayfa statik kalsın, Suspense gerekmesin.
  useEffect(() => {
    setRegistered(
      new URLSearchParams(window.location.search).get("registered") === "true"
    );
  }, []);

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
      setError(isNetwork ? "Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin." : "Geçersiz e-posta veya şifre.");
      setLoading(false);
      return;
    }

    if (data.session) {
      // Force a full navigation so middleware sees the fresh auth cookies immediately.
      window.location.assign("/dashboard");
      return;
    }

    setError("Oturum oluşturulamadı. Lütfen tekrar deneyin.");
    setLoading(false);
  };

  return (
    <AuthShell
      title="Hesabınıza giriş yapın"
      description="Paneliniz kaldığınız yerden devam etmeye hazır."
      topLink={{ prompt: "Hesabınız yok mu?", label: "Hesap oluşturun", href: "/auth/signup" }}
    >
      {registered && !error ? (
        <AuthAlert tone="success">Hesabınız oluşturuldu. Şimdi giriş yapabilirsiniz.</AuthAlert>
      ) : null}
      {error ? <AuthAlert tone="error">{error}</AuthAlert> : null}

      <form className="space-y-5" onSubmit={handleSubmit}>
        <label className="block">
          <span className={authLabelClass}>E-posta</span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            placeholder="ornek@firma.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={authInputClass}
          />
        </label>
        <label className="block">
          <span className={authLabelClass}>Şifre</span>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            placeholder="Şifrenizi girin"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={authInputClass}
          />
        </label>
        <div className="pt-2">
          <button type="submit" disabled={loading} className={authSubmitClass}>
            {loading ? "Giriş yapılıyor…" : (
              <>
                Giriş Yap <ArrowIcon />
              </>
            )}
          </button>
        </div>
      </form>
    </AuthShell>
  );
}
