"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useTenantStore } from "@/lib/tenantStore";
import { Session } from "@supabase/supabase-js";

interface User {
  id: string;
  email?: string | null;
  name?: string | null;
  tenantId: string;
}

interface AuthContextType {
  user: User | null;
  tenantId: string | null;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function buildUser(session: Session): User {
  const u = session.user;
  const tenantId =
    u.user_metadata?.tenant_id && /^[0-9a-f-]{36}$/i.test(u.user_metadata.tenant_id)
      ? u.user_metadata.tenant_id
      : u.id;

  return {
    id: u.id,
    email: u.email,
    name: u.user_metadata?.name ?? u.email,
    tenantId,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('AUTH CONTEXT: Initializing with isLoading:', isLoading);
    
    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((event, session) => {
        console.log("AUTH EVENT:", event, !!session);
        console.log('AUTH CONTEXT: Event received, current isLoading:', isLoading, 'current user:', !!user);

        if (event === "INITIAL_SESSION") {
          // INITIAL_SESSION is fired during initialization and should not affect user state
          // Only update loading state, don't change user/session data
          console.log('AUTH CONTEXT: Handling INITIAL_SESSION, setting isLoading to false');
          setIsLoading(false);
          return;
        }

        if (!session) {
          console.log('AUTH CONTEXT: No session, resetting state');
          setUser(null);
          setTenantId(null);
          useTenantStore.getState().setTenantId(null);
          setIsLoading(false);
          return;
        }

        const userData = buildUser(session);
        console.log('AUTH CONTEXT: Setting user data:', userData);
        setUser(userData);
        setTenantId(userData.tenantId);
        useTenantStore.getState().setTenantId(userData.tenantId);
        console.log('AUTH CONTEXT: Setting isLoading to false after setting user');
        setIsLoading(false);
      });

    return () => {
      console.log('AUTH CONTEXT: Unsubscribing from auth state change');
      subscription.unsubscribe();
    };
  }, [isLoading, user]);

  const logout = async () => {
    useTenantStore.getState().setTenantId(null);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, tenantId, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}