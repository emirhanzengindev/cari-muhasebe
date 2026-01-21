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
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    // Only clear localStorage on explicit logout, not on app start
    // This prevents removing valid session tokens during app initialization
      
    // Flag to prevent multiple checkSession executions
    let isCheckSessionRunning = false;
      
    // Check active session with delay to avoid race conditions
    const checkSession = async () => {
      if (isCheckSessionRunning) return; // Prevent concurrent executions
      isCheckSessionRunning = true;
        
      // Increased delay to ensure auth state is properly initialized
      await new Promise(resolve => setTimeout(resolve, 500));
        
      const { data: { session }, error } = await supabase.auth.getSession();
        
      if (error) {
        console.error("Auth session error:", error);
        setIsLoading(false);
        isCheckSessionRunning = false;
        return;
      }
  
      if (!session) {
        console.log('DEBUG: No session found in checkSession, redirecting to login');
        // Only redirect if we're not already on auth pages
        if (!window.location.pathname.startsWith('/auth')) {
          setTimeout(() => {
            router.push("/auth/signin");
          }, 100);
        }
        setIsLoading(false);
        isCheckSessionRunning = false;
        return;
      }
  
      // Convert Supabase user to our User type
      const supabaseUser = session.user;
      // Check if user metadata contains valid tenant_id, otherwise use user.id
      let rawTenantId = supabaseUser.id;
            
      const userData: User = {
        id: supabaseUser.id,
        name: supabaseUser.user_metadata?.name || supabaseUser.email,
        email: supabaseUser.email,
        tenantId: rawTenantId
      };
            
      // Validate user metadata tenant_id
      const metadataTenantId = supabaseUser.user_metadata?.tenant_id;
      if (metadataTenantId && typeof metadataTenantId === 'string' && metadataTenantId.length > 0) {
        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(metadataTenantId) && !metadataTenantId.includes('ENANT_ID')) {
          console.log('DEBUG: Using tenant_id from user metadata in checkSession:', metadataTenantId);
          rawTenantId = metadataTenantId;
          // Update userData with the correct tenantId
          userData.tenantId = rawTenantId;
        } else {
          console.warn('⚠️  Invalid tenant_id in metadata in checkSession, using user.id instead:', metadataTenantId);
        }
      }
        
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
      setSessionChecked(true);
      isCheckSessionRunning = false;
    };
    
    if (!sessionChecked) {
      checkSession();
    }
  
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('DEBUG: Auth state change event:', event);
      
      // Prevent processing the same session repeatedly
      if (event === 'INITIAL_SESSION' && user && session?.user.id === user.id) {
        console.log('DEBUG: Skipping duplicate initial session event for same user');
        setIsLoading(false);
        return;
      }
      
      if (session) {
        // Delay to ensure session is fully established
        await new Promise(resolve => setTimeout(resolve, 300));
          
        const supabaseUser = session.user;
        // Check if user metadata contains valid tenant_id, otherwise use user.id
        let rawTenantId = supabaseUser.id;
          
        // Create userData first to have access to it
        const userData: User = {
          id: supabaseUser.id,
          name: supabaseUser.user_metadata?.name || supabaseUser.email,
          email: supabaseUser.email,
          tenantId: rawTenantId
        };
                
        // Validate user metadata tenant_id
        const metadataTenantId = supabaseUser.user_metadata?.tenant_id;
        if (metadataTenantId && typeof metadataTenantId === 'string' && metadataTenantId.length > 0) {
          // Validate UUID format
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          if (uuidRegex.test(metadataTenantId) && !metadataTenantId.includes('ENANT_ID')) {
            // Only log if it's different from current stored value to reduce noise
            if (rawTenantId !== userData.tenantId) {
              console.log('DEBUG: Using tenant_id from user metadata:', metadataTenantId);
            }
            rawTenantId = metadataTenantId;
            // Update userData with the correct tenantId
            userData.tenantId = rawTenantId;
          } else {
            console.warn('⚠️  Invalid tenant_id in metadata, using user.id instead:', metadataTenantId);
          }
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
        console.log('DEBUG: Auth state change triggered logout - event:', event);
        setUser(null);
        setTenantId(null);
        useTenantStore.getState().setTenantId(null);
        // Only redirect if not already on auth pages
        if (!window.location.pathname.startsWith('/auth')) {
          setTimeout(() => {
            router.push("/auth/signin");
          }, 100);
        }
      }
      setIsLoading(false);
    });
  
    return () => {
      subscription.unsubscribe();
    };
  }, [router, sessionChecked]);

  const logout = async () => {
    // Clear tenant ID from the tenant store
    useTenantStore.getState().setTenantId(null);
    
    // Clear problematic localStorage entries on logout
    if (typeof window !== 'undefined') {
      console.log('🧹 Clearing localStorage entries on logout...');
      
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
      
      console.log('✅ localStorage cleanup completed on logout!');
    }
    
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Sign out error:", error);
    }
    
    // Redirect to signin page
    setTimeout(() => {
      router.push("/auth/signin");
    }, 100);
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