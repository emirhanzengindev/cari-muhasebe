"use client";

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
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
  console.log('BUILD USER: Processing session user:', session.user);
  
  const u = session.user;
  
  // Validate required fields
  if (!u.id || !u.email) {
    console.error('BUILD USER: Missing required fields:', { id: u.id, email: u.email });
    throw new Error('Invalid user data in session');
  }
  
  const tenantId =
    u.user_metadata?.tenant_id && /^[0-9a-f-]{36}$/i.test(u.user_metadata.tenant_id)
      ? u.user_metadata.tenant_id
      : u.id;
      
  console.log('BUILD USER: tenantId determined:', tenantId);

  const userData = {
    id: u.id,
    email: u.email,
    name: u.user_metadata?.name ?? u.email,
    tenantId,
  };
  
  console.log('BUILD USER: Final user data:', userData);
  return userData;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const userRef = useRef<User | null>(null);
  const initializedRef = useRef(false);
  const cleanupRef = useRef<(() => void) | null>(null);
  
  // Only log once to prevent spam
  useEffect(() => {
    if (!initializedRef.current) {
      console.log('AuthProvider initialized');
      initializedRef.current = true;
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let cleanupFunction: (() => void) | null = null;
    
    const initializeAuth = async () => {
      // Use immediate timeout to ensure DOM is hydrated
      setTimeout(async () => {
        if (!mounted) return;
        
        try {
          const supabase = getSupabaseBrowser();
          
          // Get initial session
          const { data: { session } } = await supabase.auth.getSession();
          
          if (!mounted) return;
          
          if (session) {
            const userData = buildUser(session);
            if (mounted) {
              userRef.current = userData;
              setUser(userData);
              setTenantId(userData.tenantId);
              useTenantStore.getState().setTenantId(userData.tenantId);
            }
          }
          
          if (mounted) {
            setIsLoading(false);
          }
          
          // Set up auth state listener with proper cleanup
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
            if (!mounted) return;
            
            console.log("AUTH EVENT:", event, !!session);
            
            // Use setTimeout for state updates to prevent hydration issues
            setTimeout(() => {
              if (!mounted) return;
              
              if (event === "SIGNED_IN" && session) {
                const userData = buildUser(session);
                userRef.current = userData;
                setUser(userData);
                setTenantId(userData.tenantId);
                useTenantStore.getState().setTenantId(userData.tenantId);
                setIsLoading(false);
              } else if (event === "SIGNED_OUT" || !session) {
                userRef.current = null;
                setUser(null);
                setTenantId(null);
                useTenantStore.getState().setTenantId(null);
                setIsLoading(false);
              }
            }, 0);
          });
          
          // Store cleanup function
          cleanupFunction = () => {
            subscription.unsubscribe();
          };
          cleanupRef.current = cleanupFunction;
          
        } catch (error) {
          console.error('AUTH CONTEXT: Error in auth setup:', error);
          if (mounted) {
            setIsLoading(false);
          }
        }
      }, 0);
    };
    
    initializeAuth();
    
    return () => {
      mounted = false;
      // Clean up subscription
      if (cleanupFunction) {
        cleanupFunction();
      } else if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, []);

  const logout = async () => {
    useTenantStore.getState().setTenantId(null);
    try {
      const supabase = getSupabaseBrowser();
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error during logout:', error);
    }
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