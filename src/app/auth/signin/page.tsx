"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabase";
import { ArrowRight, BarChart3, Check, CircleDollarSign, LockKeyhole, Sparkles } from "lucide-react";

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

    if (data.session) {
      // Force a full navigation so middleware sees the fresh auth cookies immediately.
      window.location.assign("/");
      return;
    }

    setError("Oturum olusturulamadi. Lutfen tekrar deneyin.");
    setLoading(false);
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#eef3f5] text-[#182230]">
      <header className="relative z-20 border-b border-white/10 bg-[#122b3a] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#d9f1f1] text-[#122b3a]"><CircleDollarSign size={20} /></span>
            <span><span className="block text-sm font-bold tracking-wide">On Muhasebe</span><span className="block text-[9px] uppercase tracking-[0.2em] text-slate-400">Business OS</span></span>
          </Link>
          <Link href="/auth/signup" className="inline-flex items-center gap-2 rounded-lg border border-[#a8d5d5]/50 px-4 py-2 text-sm font-semibold text-[#d9f1f1] transition-colors hover:bg-white/10"><span>Hesap olustur</span><ArrowRight size={15} /></Link>
        </div>
      </header>

      <main className="relative mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl grid-cols-1 gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-20 lg:py-16">
        <div className="auth-orbit auth-orbit-one" aria-hidden="true" />
        <div className="auth-orbit auth-orbit-two" aria-hidden="true" />
        <section className="relative animate-[auth-rise_700ms_ease-out_both]">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#b7dfe0] bg-white/70 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[#176b87]"><Sparkles size={14} /> Operasyon merkezi</div>
          <h1 className="max-w-2xl text-4xl font-bold leading-[1.08] tracking-tight text-[#122b3a] sm:text-6xl">Tum operasyonu tek panelde yonet.</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">Cari, stok, fatura ve finans hareketlerini sakin, net ve kontrol edilebilir bir akista toplayin.</p>
          <div className="mt-10 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
            {projectModules.map((module, index) => <div key={module} className="flex items-center gap-3 rounded-xl border border-white bg-white/70 px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur transition-transform duration-300 hover:-translate-y-1" style={{ animationDelay: `${index * 70}ms` }}><span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#d9f1f1] text-[#176b87]"><Check size={14} /></span>{module}</div>)}
          </div>
          <div className="mt-8 flex items-center gap-6 text-sm text-slate-500"><span className="inline-flex items-center gap-2"><LockKeyhole size={16} className="text-[#176b87]" /> Tenant bazli guvenlik</span><span className="inline-flex items-center gap-2"><BarChart3 size={16} className="text-[#176b87]" /> Anlik ozetler</span></div>
        </section>

        <section className="relative animate-[auth-rise_700ms_180ms_ease-out_both]">
          <div className="rounded-[28px] border border-white/80 bg-white/90 p-6 shadow-[0_25px_70px_rgba(18,43,58,0.14)] backdrop-blur sm:p-9">
            <div className="mb-8"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#176b87]">Calisma alani</p><h2 className="mt-2 text-3xl font-bold tracking-tight text-[#122b3a]">Hesabina giris yap</h2><p className="mt-2 text-sm text-slate-500">Operasyon panelin seni bekliyor.</p></div>
            {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
            <form className="space-y-5" onSubmit={handleSubmit}>
              <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">E-posta</span><input type="email" placeholder="ornek@firma.com" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-[#176b87] focus:bg-white focus:ring-4 focus:ring-[#d9f1f1]" /></label>
              <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Sifre</span><input type="password" placeholder="Sifrenizi girin" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-[#176b87] focus:bg-white focus:ring-4 focus:ring-[#d9f1f1]" /></label>
              <button type="submit" disabled={loading} className="group flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-[#176b87] font-semibold text-white shadow-lg shadow-[#176b87]/20 transition-all hover:-translate-y-0.5 hover:bg-[#0f526b] disabled:cursor-wait disabled:opacity-60">{loading ? "Giris yapiliyor..." : <>Giris Yap <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" /></>}</button>
            </form>
            <p className="mt-7 text-center text-sm text-slate-600">Hesabin yok mu? <Link href="/auth/signup" className="font-bold text-[#176b87] hover:text-[#0f526b]">Kayit ol</Link></p>
          </div>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500"><LockKeyhole size={13} /> Verileriniz guvenli oturumla korunur</div>
        </section>
      </main>
    </div>
  );
}
