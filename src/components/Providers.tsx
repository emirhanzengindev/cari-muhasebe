'use client';

import { AuthProvider } from "@/contexts/AuthContext";
import TenantProvider from "./TenantProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <TenantProvider>
        {children}
      </TenantProvider>
    </AuthProvider>
  );
}
