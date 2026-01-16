"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useTenantStore } from "@/lib/tenantStore";
import { supabase } from "@/lib/supabase";
import { User as SupabaseUser } from "@supabase/supabase-js";

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  tenantId?: string;
}

interface AuthContextType {
  user: User | null;
  tenantId: string | null;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Clear problematic localStorage entries on app start
    const clearLocalStorage = () => {
      console.log('🧹 Clearing localStorage entries...');
      
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
          console.log(`🗑️  Removing localStorage key: ${key}`);
          localStorage.removeItem(key);
        }
      });
      
      // Also clear all Supabase-related items
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-')) {
          console.log(`🗑️  Removing Supabase key: ${key}`);
          localStorage.removeItem(key);
        }
      });
      
      console.log('✅ localStorage cleanup completed!');
    };
    
    // Run cleanup once on app start
    clearLocalStorage();
    
    // Check active session
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Auth session error:", error);
        setIsLoading(false);
        return;
      }

      if (!session) {
        router.push("/auth/signin");
        setIsLoading(false);
        return;
      }

      // Convert Supabase user to our User type
      const supabaseUser = session.user;
      // Use user.id as tenantId since it's the correct UUID
      const rawTenantId = supabaseUser.id;
      
      const userData: User = {
        id: supabaseUser.id,
        name: supabaseUser.user_metadata?.name || supabaseUser.email,
        email: supabaseUser.email,
        tenantId: rawTenantId
      };
      
      console.log('DEBUG: Setting tenantId from auth context:', userData.tenantId);
      console.log('DEBUG: User ID from session:', supabaseUser.id);
      console.log('DEBUG: User metadata tenant_id:', supabaseUser.user_metadata?.tenant_id);
      console.log('DEBUG: Raw tenantId before any processing:', rawTenantId);
      
      // Warn if user metadata contains corrupted tenant_id
      if (supabaseUser.user_metadata?.tenant_id && supabaseUser.user_metadata.tenant_id.includes('ENANT_ID')) {
        console.warn('⚠️  CORRUPTED tenant_id in user metadata detected! Using user.id instead.');
        console.warn('Corrupted value:', supabaseUser.user_metadata.tenant_id);
      }

      setUser(userData);
      setTenantId(userData.tenantId || null);
      useTenantStore.getState().setTenantId(userData.tenantId || null);
      setIsLoading(false);
    };

    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        const supabaseUser = session.user;
        // Use user.id as tenantId since it's the correct UUID
        const rawTenantId = supabaseUser.id;
        
        const userData: User = {
          id: supabaseUser.id,
          name: supabaseUser.user_metadata?.name || supabaseUser.email,
          email: supabaseUser.email,
          tenantId: rawTenantId
        };
        
        console.log('DEBUG: Setting tenantId from auth state change:', userData.tenantId);
        console.log('DEBUG: User ID from state change:', supabaseUser.id);
        console.log('DEBUG: User metadata tenant_id in state change:', supabaseUser.user_metadata?.tenant_id);
        console.log('DEBUG: Raw tenantId before any processing in state change:', rawTenantId);
        
        // Warn if user metadata contains corrupted tenant_id
        if (supabaseUser.user_metadata?.tenant_id && supabaseUser.user_metadata.tenant_id.includes('ENANT_ID')) {
          console.warn('⚠️  CORRUPTED tenant_id in user metadata detected! Using user.id instead.');
          console.warn('Corrupted value:', supabaseUser.user_metadata.tenant_id);
        }

        setUser(userData);
        setTenantId(userData.tenantId || null);
        useTenantStore.getState().setTenantId(userData.tenantId || null);
      } else {
        setUser(null);
        setTenantId(null);
        useTenantStore.getState().setTenantId(null);
        router.push("/auth/signin");
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const logout = async () => {
    // Clear tenant ID from the tenant store
    useTenantStore.getState().setTenantId(null);
    // Also clear from localStorage to prevent persistence across sessions
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tenant-storage');
    }
    
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Sign out error:", error);
    }
    
    // Redirect to signin page
    router.push("/auth/signin");
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