'use client';

import { useEffect } from 'react';
import { useTenantStore } from '@/lib/tenantStore';
import { useAuth } from '@/contexts/AuthContext';

export default function TenantProvider({ children }: { children: React.ReactNode }) {
  const setTenantId = useTenantStore(state => state.setTenantId);
  const { user, isLoading } = useAuth();

  useEffect(() => {
    // Set tenant ID from authenticated user, fallback to demo for unauthenticated users
    if (!isLoading) {
      if (user && user.tenantId) {
        setTenantId(user.tenantId);
      } else {
        // Only use demo tenant ID as fallback when not authenticated
        setTenantId('demo-tenant-id');
      }
    }
  }, [user, isLoading, setTenantId]);

  return <>{children}</>;
}