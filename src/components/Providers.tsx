'use client';

import TenantProvider from "./TenantProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TenantProvider>
      {children}
    </TenantProvider>
  );
}
