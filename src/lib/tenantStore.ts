import { create } from 'zustand';

interface TenantState {
  tenantId: string | null;
  setTenantId: (tenantId: string | null) => void;
}

export const useTenantStore = create<TenantState>()(
  (set, get) => ({
    tenantId: null,
    setTenantId: (tenantId: string | null) => {
      const previousId = get().tenantId;
      // Only log when there's an actual change
      if (previousId !== tenantId) {
        console.log('DEBUG: TenantStore tenantId changed from', previousId, 'to', tenantId);
        if (tenantId && tenantId.includes('ENANT_ID')) {
          console.error('WARNING: Tenant ID contains ENANT_ID suffix!', tenantId);
        }
      }
      set({ tenantId });
    },
  })
);