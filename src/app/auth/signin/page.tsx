"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const router = useRouter();
  
  // Reset redirect states when component mounts or when returning to signin page
  useEffect(() => {
    setHasRedirected(false);
    setIsRedirecting(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If already submitting, redirected, redirecting, or if we're no longer on the signin page, don't process
    if (isSubmitting || hasRedirected || isRedirecting || (typeof window !== 'undefined' && window.location.pathname !== '/auth/signin')) {
      console.log('DEBUG: Submit already in progress, redirected, redirecting, or page changed, ignoring submit');
      return;
    }
    
    setIsSubmitting(true);
    setLoading(true);
    setError("");

    try {
      console.log('DEBUG: Attempting sign in with email:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('DEBUG: Supabase auth response:', { data: !!data, error: !!error });
      
      if (error) {
        console.log('DEBUG: Auth error:', error.message);
        setError("Geçersiz e-posta veya şifre");
      } else if (data.session) {
        console.log('DEBUG: Auth successful, session created');
        // Wait longer for AuthContext to process the session and redirect
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Check if we're still on the signin page (shouldn't be if AuthContext worked)
        if (typeof window !== 'undefined' && window.location.pathname === '/auth/signin') {
          // Check if AuthContext has already handled the redirect
          let handled = false;
          const sessionId = data.session.user.id;
          try {
            if (sessionId && sessionStorage.getItem(`sessionHandled:${sessionId}`) === '1') {
              handled = true;
              sessionStorage.removeItem(`sessionHandled:${sessionId}`);
            }
          } catch (e) {
            /* ignore sessionStorage access errors */
          }
          
          if (!handled) {
            console.log('DEBUG: AuthContext did not redirect within timeout, doing manual redirect');
            setIsRedirecting(true);
            setHasRedirected(true);
            router.replace('/');
          } else {
            console.log('DEBUG: Already redirected by AuthContext, skipping manual redirect');
            setHasRedirected(true);
          }
        } else {
          console.log('DEBUG: Already redirected by AuthContext, skipping manual redirect');
          setHasRedirected(true);
        }
      } else {
        console.log('DEBUG: No session in response');
        setError("Oturum oluşturulamadı");
      }
    } catch (err) {
      console.log('DEBUG: Unexpected error:', err);
      setError("Beklenmeyen bir hata oluştu");
    } finally {
      // Only set states to false if we're still on the signin page
      if (typeof window !== 'undefined' && window.location.pathname === '/auth/signin') {
        setIsSubmitting(false);
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Hesabınıza giriş yapın
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Veya{" "}
            <Link href="/auth/signup" className="font-medium text-blue-600 hover:text-blue-500">
              yeni hesap oluşturun
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                E-posta adresi
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="E-posta adresi"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Şifre
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Şifre"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || isSubmitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : null}
              {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}