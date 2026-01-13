"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTenantStore } from "@/lib/tenantStore";

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  tenantId?: string;
}

interface AuthContextType {
  user: User | null;
  tenantId: string | null;
  isLoading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tenantId, setTenantId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (session?.user) {
      const userTenantId = (session.user as User).tenantId || null;
      setTenantId(userTenantId);
      useTenantStore.getState().setTenantId(userTenantId);
    }
  }, [session, status, router]);

  const logout = () => {
    signOut({ callbackUrl: "/auth/signin" });
  };

  const value = {
    user: session?.user ? session.user as User : null,
    tenantId,
    isLoading: status === "loading",
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