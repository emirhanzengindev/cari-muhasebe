'use client';

import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/contexts/AuthContext";
import TenantProvider from "./TenantProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        <TenantProvider>
          {children}
        </TenantProvider>
      </AuthProvider>
    </SessionProvider>
  );
}
