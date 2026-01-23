"use client";

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useTenantStore } from "@/lib/tenantStore";
import { supabase } from "@/lib/supabase";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  tenantId: string;
}

interface AuthContextType {
  user: User | null;
  tenantId: string | null;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to build User object from session
function buildUser(session: Session): User {
  const u = session.user;
  const uuidRegex = /^[0-9a-f-]{36}$/i;

  let tenantId = u.user_metadata?.tenant_id;
  if (!tenantId || !uuidRegex.test(tenantId)) {
    tenantId = u.id;
  }

  return {
    id: u.id,
    email: u.email,
    name: u.user_metadata?.name ?? u.email,
    tenantId
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const lastHandledSessionId = useRef<string | null>(null);

  useEffect(() => {
    console.log('DEBUG: Setting up auth state change listener');
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('DEBUG: AuthContext received event:', event, 'session:', !!session);
      
      if (event === 'INITIAL_SESSION') {
        console.log('DEBUG: INITIAL_SESSION event received');
        setIsLoading(false);
        return;
      }

      if (event === 'SIGNED_OUT') {
        console.log('DEBUG: SIGNED_OUT event received');
        setUser(null);
        setTenantId(null);
        useTenantStore.getState().setTenantId(null);
        lastHandledSessionId.current = null; // Clear the last handled session ID
        setIsLoading(false);
        return;
      }

      if (session) {
        const sessionId = session.user.id;
        console.log('DEBUG: Session received in AuthContext:', sessionId);
        
        // Prevent processing the same session multiple times
        if (lastHandledSessionId.current === sessionId) {
          console.log('DEBUG: SIGNED_IN already handled for session', sessionId);
          setIsLoading(false);
          return;
        }
        
        lastHandledSessionId.current = sessionId;
        const userData = buildUser(session);

        setUser(userData);
        setTenantId(userData.tenantId);
        useTenantStore.getState().setTenantId(userData.tenantId);

        if (typeof window !== 'undefined' && window.location.pathname.startsWith('/auth')) {
          console.log('DEBUG: Redirecting from auth page to home');
          // Mark that AuthContext handled this session so signin page can skip manual redirect
          try {
            sessionStorage.setItem(`sessionHandled:${sessionId}`, '1');
          } catch (e) {
            /* ignore sessionStorage errors */
          }
          // Add small delay to ensure signin page has time to finish its process
          setTimeout(() => {
            if (typeof window !== 'undefined' && window.location.pathname.startsWith('/auth')) {
              router.replace('/');
            }
          }, 100);
        }
      }

      setIsLoading(false);
    });

    return () => {
      console.log('DEBUG: Cleaning up auth state change listener');
      subscription.unsubscribe();
    };
  }, [router]);

  const logout = async () => {
    // Clear tenant ID from the tenant store
    useTenantStore.getState().setTenantId(null);
    
    // Clear localStorage entries on logout
    if (typeof window !== 'undefined') {
      // Clear all tenant-related storage
      const keysToRemove = [
        'tenant-storage',
        'tenantId',
        'auth-token',
        'sb-access-token',
        'sb-refresh-token'
      ];
      
      keysToRemove.forEach(key => {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
        }
      });
      
      // Also clear all Supabase-related items
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-')) {
          localStorage.removeItem(key);
        }
      });
    }
    
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Sign out error:", error);
    }
    
    // Don't redirect here since middleware handles it
  };

  const value = {
    user,
    tenantId,
    isLoading,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}