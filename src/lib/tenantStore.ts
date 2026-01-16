import { create } from 'zustand';

interface TenantState {
  tenantId: string | null;
  setTenantId: (tenantId: string | null) => void;
}

export const useTenantStore = create<TenantState>()(
  (set) => ({
    tenantId: null,
    setTenantId: (tenantId: string | null) => {
      console.log('DEBUG: TenantStore setting tenantId:', tenantId);
      if (tenantId && tenantId.includes('ENANT_ID')) {
        console.error('WARNING: Tenant ID contains ENANT_ID suffix!', tenantId);
      }
      set({ tenantId });
    },
  })
);