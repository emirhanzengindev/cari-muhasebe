"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase";

export default function SignIn() {
  console.log('SIGNIN PAGE: Component mounted');
  const router = useRouter();
  const [user, setUser] = useState(null); // Mock user state
  const [authIsLoading, setAuthIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const hasRedirected = useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    console.log('LOGIN ATTEMPT:', { email });
    
    const supabase = supabaseBrowser;
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log("LOGIN RESULT:", data);
    console.log("LOGIN ERROR:", error);
    

    if (error) {
      console.error("LOGIN ERROR DETAILS:", error);
      alert(`Login Error: ${error.message}`);
      setError("Geçersiz e-posta veya şifre");
      setLoading(false);
      return;
    }

    console.log('LOGIN SUCCESS, SESSION:', data.session);
    console.log('SIGNIN PAGE: Authentication completed, redirecting to /');
    
    // Redirect to homepage
    router.push('/');
    
    setLoading(false);
  };

  // AuthProvider disabled - no auth state to monitor

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <h2 className="text-center text-3xl font-bold">
          Hesabınıza giriş yapın
        </h2>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="E-posta"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border p-2 rounded"
          />

          <input
            type="password"
            placeholder="Şifre"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border p-2 rounded"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white p-2 rounded disabled:opacity-50"
          >
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>

        <p className="text-center text-sm">
          Hesabın yok mu?{" "}
          <Link href="/auth/signup" className="text-blue-600">
            Kayıt ol
          </Link>
        </p>
      </div>
    </div>
  );
}
