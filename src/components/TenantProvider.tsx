'use client';

import { useEffect } from 'react';
import { useTenantStore } from '@/lib/tenantStore';
import { useAuth } from '@/contexts/AuthContext';

export default function TenantProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const setTenantId = useTenantStore(state => state.setTenantId);

  useEffect(() => {
    if (user?.tenantId) {
      setTenantId(user.tenantId);
    }
  }, [user, setTenantId]);

  return <>{children}</>;
}