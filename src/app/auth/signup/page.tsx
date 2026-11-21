"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell, {
  AuthAlert,
  authInputClass,
  authLabelClass,
  authSubmitClass,
} from "@/components/auth/AuthShell";
import { ArrowIcon } from "@/components/marketing/SiteHeader";

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
      setError("Şifreler eşleşmiyor.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalıdır.");
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
        setError(data.error || "Kayıt sırasında bir hata oluştu.");
      } else {
        router.push("/auth/signin?registered=true");
      }
    } catch {
      setError("Beklenmeyen bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Hesap oluşturun"
      description="İşletmenizi tanımlayın; cari, stok, fatura ve tahsilat modüllerine hemen erişin."
      topLink={{ prompt: "Hesabınız var mı?", label: "Giriş yapın", href: "/auth/signin" }}
    >
      {error ? <AuthAlert tone="error">{error}</AuthAlert> : null}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={authLabelClass}>Ad Soyad</span>
            <input
              type="text"
              name="name"
              autoComplete="name"
              required
              className={authInputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="block">
            <span className={authLabelClass}>İşletme adı</span>
            <input
              type="text"
              name="companyName"
              autoComplete="organization"
              required
              className={authInputClass}
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </label>
        </div>
        <label className="block">
          <span className={authLabelClass}>E-posta</span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            placeholder="ornek@firma.com"
            required
            className={authInputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block">
          <span className={authLabelClass}>Şifre</span>
          <input
            type="password"
            name="password"
            autoComplete="new-password"
            placeholder="En az 6 karakter"
            required
            className={authInputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <label className="block">
          <span className={authLabelClass}>Şifre tekrar</span>
          <input
            type="password"
            name="confirmPassword"
            autoComplete="new-password"
            required
            className={authInputClass}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </label>
        <div className="pt-3">
          <button type="submit" disabled={loading} className={authSubmitClass}>
            {loading ? "Kayıt yapılıyor…" : (
              <>
                Hesap Oluştur <ArrowIcon />
              </>
            )}
          </button>
        </div>
      </form>
    </AuthShell>
  );
}
