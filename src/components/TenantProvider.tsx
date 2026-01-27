'use client';

import { useEffect } from 'react';
import { useTenantStore } from '@/lib/tenantStore';

export default function TenantProvider({ children }: { children: React.ReactNode }) {
  const setTenantId = useTenantStore(state => state.setTenantId);

  useEffect(() => {
    // Don't initialize tenant ID here - AuthProvider will set it when user authenticates
    // This prevents demo-tenant-id from overriding real user's tenant ID
  }, []); // Empty dependency array since we only need this to run once

  return <>{children}</>;
}