'use client';

import { useEffect } from 'react';
import { useTenantStore } from '@/lib/tenantStore';

export default function TenantProvider({ children }: { children: React.ReactNode }) {
  const setTenantId = useTenantStore(state => state.setTenantId);

  useEffect(() => {
    // Initialize tenant ID
    // Actual user's tenant ID will be set by AuthProvider when it detects login
    setTenantId('demo-tenant-id');
  }, [setTenantId]);

  return <>{children}</>;
}