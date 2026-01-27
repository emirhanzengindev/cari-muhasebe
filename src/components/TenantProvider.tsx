'use client';

import { useEffect } from 'react';
import { useTenantStore } from '@/lib/tenantStore';

export default function TenantProvider({ children }: { children: React.ReactNode }) {
  const setTenantId = useTenantStore(state => state.setTenantId);

  useEffect(() => {
    // Set a default tenant ID for demo purposes
    setTenantId('demo-tenant-id');
  }, [setTenantId]);

  return <>{children}</>;
}