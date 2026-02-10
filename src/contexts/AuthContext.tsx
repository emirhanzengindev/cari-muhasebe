"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
} from "react";
import { Session, AuthChangeEvent } from "@supabase/supabase-js";
import { getSupabaseBrowser } from "@/lib/supabase";
import { useTenantStore } from "@/lib/tenantStore";

/* ================= TYPES ================= */

interface User {
  id: string;
  email: string | null;
  name: string;
  tenantId: string;
}

interface AuthContextType {
  user: User | null;
  tenantId: string | null;
  isLoading: boolean;
  logout: () => Promise<void>;
}

/* ================= CONTEXT ================= */

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* ================= HELPERS ================= */

function buildUser(session: Session): User | null {
  const u = session.user;

  console.log("BUILD USER: Processing session user:", u);

  if (!u?.id) {
    console.warn("BUILD USER: user id missing");
    return null;
  }

  const tenantId =
    typeof u.user_metadata?.tenant_id === "string" &&
    /^[0-9a-f-]{36}$/i.test(u.user_metadata.tenant_id)
      ? u.user_metadata.tenant_id
      : u.id;

  const userData: User = {
    id: u.id,
    email: u.email ?? null,
    name: u.user_metadata?.name ?? u.email ?? "User",
    tenantId,
  };

  console.log("BUILD USER: Final user data:", userData);
  return userData;
}

/* ================= PROVIDER ================= */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const initializedRef = useRef(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  /* ---- init log (once) ---- */
  useEffect(() => {
    if (!initializedRef.current) {
      console.log("AuthProvider initialized");
      initializedRef.current = true;
    }
  }, []);

  /* ---- auth bootstrap ---- */
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const supabase = getSupabaseBrowser();

        /* INITIAL SESSION */
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (session) {
          const userData = buildUser(session);
          if (userData) {
            setUser(userData);
            setTenantId(userData.tenantId);
            useTenantStore.getState().setTenantId(userData.tenantId);
          }
        }

        setIsLoading(false);

        /* AUTH EVENTS */
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(
          (event: AuthChangeEvent, session: Session | null) => {
            if (!mounted) return;

            console.log("AUTH EVENT:", event, !!session);

            if (session) {
              const userData = buildUser(session);
              if (!userData) return;

              setUser(userData);
              setTenantId(userData.tenantId);
              useTenantStore.getState().setTenantId(userData.tenantId);
            } else {
              setUser(null);
              setTenantId(null);
              useTenantStore.getState().setTenantId(null);
            }
          }
        );

        cleanupRef.current = () => {
          subscription.unsubscribe();
        };
      } catch (err) {
        console.error("AUTH CONTEXT ERROR:", err);
        if (mounted) setIsLoading(false);
      }
    };

    initAuth();

    return () => {
      mounted = false;
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, []);

  /* ---- logout ---- */
  const logout = async () => {
    try {
      const supabase = getSupabaseBrowser();
      await supabase.auth.signOut();
    } finally {
      setUser(null);
      setTenantId(null);
      useTenantStore.getState().setTenantId(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, tenantId, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/* ================= HOOK ================= */

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
