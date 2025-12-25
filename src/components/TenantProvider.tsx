'use client';

import { useEffect } from 'react';
import { useTenantStore } from '@/lib/tenantStore';
import { useAuth } from '@/contexts/AuthContext';

export default function TenantProvider({ children }: { children: React.ReactNode }) {
  const { tenantId } = useAuth();
  const setTenantId = useTenantStore((state) => state.setTenantId);

  useEffect(() => {
    setTenantId(tenantId);
  }, [tenantId, setTenantId]);

  return <>{children}</>;
}