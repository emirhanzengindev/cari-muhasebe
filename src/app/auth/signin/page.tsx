"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export default function SignIn() {
  const router = useRouter();
  const { user, isLoading: authIsLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Geçersiz e-posta veya şifre");
      setLoading(false);
      return;
    }

    console.log('SIGNIN PAGE: Authentication completed, useEffect will handle redirect');
    // 🔥 Note: useEffect handles redirect after auth state updates
    // All navigation logic is in useEffect to prevent redirect race conditions
  };

  useEffect(() => {
    console.log('SIGNIN PAGE EFFECT TRIGGERED', { authIsLoading, user: !!user });
    // Redirect to homepage when user is authenticated
    // Even if authIsLoading is true, if we have a user, redirect immediately
    // Use router.push instead of replace for better UX
    if (user) {
      console.log('SIGNIN PAGE: User authenticated, executing redirect to /');
      // Small delay to ensure state is fully settled
      // Use setTimeout to avoid multiple redirects
      if (!window.location.pathname.startsWith('/')) {
        setTimeout(() => {
          router.push('/');
        }, 100);
      }
    } else if (!authIsLoading && !user) {
      console.log('SIGNIN PAGE: Auth loaded but no user, staying on signin page');
    } else {
      console.log('SIGNIN PAGE: Waiting for auth state', { authIsLoading, user: !!user });
    }
  }, [authIsLoading, user, router]);

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