import { create } from 'zustand';

interface TenantState {
  tenantId: string | null;
  setTenantId: (tenantId: string | null) => void;
}

export const useTenantStore = create<TenantState>()(
  (set, get) => ({
    tenantId: null,
    setTenantId: (tenantId: string | null) => {
      console.log('DEBUG: TenantStore setting tenantId:', tenantId);
      console.log('DEBUG: Previous tenantId was:', get().tenantId);
      if (tenantId && tenantId.includes('ENANT_ID')) {
        console.error('WARNING: Tenant ID contains ENANT_ID suffix!', tenantId);
      }
      set({ tenantId });
    },
  })
);