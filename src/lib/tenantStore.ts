import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TenantState {
  tenantId: string | null;
  setTenantId: (tenantId: string | null) => void;
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set) => ({
      tenantId: null,
      setTenantId: (tenantId: string | null) => {
        console.log('DEBUG: TenantStore setting tenantId:', tenantId);
        if (tenantId && tenantId.includes('ENANT_ID')) {
          console.error('WARNING: Tenant ID contains ENANT_ID suffix!', tenantId);
        }
        set({ tenantId });
      },
    }),
    {
      name: 'tenant-storage', // name of the item in the storage (must be unique)
    }
  )
);