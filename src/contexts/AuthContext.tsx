"use client";

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
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

let mountCounter = 0;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const userRef = useRef<User | null>(null);
  // Track if listener is already registered to prevent duplicates
  const listenerRegisteredRef = useRef(false);
  
  mountCounter++;
  console.log('AuthProvider mounted, isLoading:', isLoading, 'mount count:', mountCounter, 'stack:', new Error().stack);
  
  // Debug: Log when user state changes
  useEffect(() => {
    console.log('AUTH CONTEXT: User state changed to:', user);
  }, [user]);

  useEffect(() => {
    console.log('AUTH CONTEXT: Initializing with isLoading:', isLoading);
    
    if (!listenerRegisteredRef.current) {
      listenerRegisteredRef.current = true;
      
      const { data: { subscription } } =
        supabase.auth.onAuthStateChange((event, session) => {
          console.log("AUTH EVENT:", event, !!session);
          console.log('AUTH CONTEXT: Event received, current isLoading:', isLoading, 'current user:', !!userRef.current);

          if (event === "INITIAL_SESSION") {
            // INITIAL_SESSION is fired during initialization and should not affect user state
            // Only update loading state, don't change user/session data
            // 🔐 If user is already set by SIGNED_IN, don't touch the state
            if (userRef.current) {
              console.log('AUTH CONTEXT: INITIAL_SESSION ignored, user already set by SIGNED_IN');
              setIsLoading(false);
              return;
            }
            console.log('AUTH CONTEXT: Handling INITIAL_SESSION', { hasSession: !!session, session: session ? 'exists' : 'null' });
            // Always set isLoading to false after processing INITIAL_SESSION
            if (session) {
              // Process the session from INITIAL_SESSION
              console.log('AUTH CONTEXT: Building user from session:', session.user);
              const userData = buildUser(session);
              console.log('AUTH CONTEXT: Setting user data from INITIAL_SESSION:', userData);
              userRef.current = userData;
              setUser(userData);
              setTenantId(userData.tenantId);
              console.log('AUTH CONTEXT: Setting tenantId in context:', userData.tenantId);
              useTenantStore.getState().setTenantId(userData.tenantId);
              console.log('AUTH CONTEXT: User set successfully, userRef:', !!userRef.current);
            } else {
              // No session, user is not logged in
              console.log('AUTH CONTEXT: No session found, user not logged in');
            }
            // Always set isLoading to false to prevent infinite loop
            console.log('AUTH CONTEXT: Setting isLoading to false');
            setIsLoading(false);
            return;
          }

          if (event === "SIGNED_IN" && userRef.current) {
            // Prevent duplicate SIGNED_IN events when user is already set
            console.log('AUTH CONTEXT: SIGNED_IN ignored, user already set');
            setIsLoading(false);
            return;
          }

          if (!session) {
            console.log('AUTH CONTEXT: No session, resetting state');
            userRef.current = null;
            setUser(null);
            setTenantId(null);
            useTenantStore.getState().setTenantId(null);
            setIsLoading(false);
            return;
          }

          const userData = buildUser(session);
          console.log('AUTH CONTEXT: Setting user data:', userData);
          userRef.current = userData;
          setUser(userData);
          setTenantId(userData.tenantId);
          useTenantStore.getState().setTenantId(userData.tenantId);
          console.log('AUTH CONTEXT: Setting isLoading to false after setting user');
          setIsLoading(false);
        });

      return () => {
        console.log('AUTH CONTEXT: Unsubscribing from auth state change');
        listenerRegisteredRef.current = false;
        subscription.unsubscribe();
      };
    }
  }, []); // Empty dependency array - should run only once

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