import { create } from 'zustand';
import { CurrentAccount } from '@/types';
import { useTenantStore } from '@/lib/tenantStore';

// Load accounts from localStorage on initial load
const loadAccountsFromLocalStorage = (): CurrentAccount[] => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('currentAccounts');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed;
      } catch (e) {
        console.error('Failed to parse accounts from localStorage', e);
        return [];
      }
    }
  }
  return [];
};

// Save accounts to localStorage
const saveAccountsToLocalStorage = (accounts: CurrentAccount[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('currentAccounts', JSON.stringify(accounts));
  }
};

interface CurrentAccountState {
  accounts: CurrentAccount[];
  loading: boolean;
  error: string | null;
  
  // Account actions
  fetchAccounts: () => Promise<void>;
  addAccount: (account: Omit<CurrentAccount, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateAccount: (id: string, account: Partial<CurrentAccount>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  toggleAccountStatus: (id: string) => Promise<void>;
  updateAccountBalance: (id: string, amount: number, type: 'SALES' | 'PURCHASE') => Promise<void>;
}

export const useCurrentAccountsStore = create<CurrentAccountState>((set, get) => ({

  accounts: loadAccountsFromLocalStorage(),
  loading: false,
  error: null,

  // Account actions
  fetchAccounts: async () => {
    set({ loading: true, error: null });
    try {
      // Get current tenantId from tenant store
      const currentTenantId = useTenantStore.getState().tenantId || 'default-tenant';
                
      // Load existing accounts from localStorage
      const existingAccounts = get().accounts;
          
      // Filter accounts by tenantId (in real app, this would be dynamic)
      const tenantAccounts = existingAccounts.filter(account => account.tenantId === currentTenantId);
          
      set({ accounts: tenantAccounts, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch accounts', loading: false });
    }
  },

  addAccount: async (accountData) => {
    try {
      // Mock implementation - use dynamic tenantId
      const currentTenantId = useTenantStore.getState().tenantId || 'default-tenant';
      const newAccount: CurrentAccount = {
        ...accountData,
        id: Math.random().toString(36).substr(2, 9),
        balance: 0,
        isActive: true,
        tenantId: currentTenantId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      set((state) => {
        const updatedAccounts = [...state.accounts, newAccount];
        saveAccountsToLocalStorage(updatedAccounts);
        return { accounts: updatedAccounts };
      });
    } catch (error) {
      set({ error: 'Failed to add account' });
    }
  },

  updateAccount: async (id, accountData) => {
    try {
      // Mock implementation
      set((state) => {
        const updatedAccounts = state.accounts.map((account) =>
          account.id === id ? { ...account, ...accountData, updatedAt: new Date() } : account
        );
        saveAccountsToLocalStorage(updatedAccounts);
        return { accounts: updatedAccounts };
      });
    } catch (error) {
      set({ error: 'Failed to update account' });
    }
  },

  deleteAccount: async (id) => {
    try {
      // Mock implementation
      set((state) => {
        const updatedAccounts = state.accounts.filter((account) => account.id !== id);
        saveAccountsToLocalStorage(updatedAccounts);
        return { accounts: updatedAccounts };
      });
    } catch (error) {
      set({ error: 'Failed to delete account' });
    }
  },

  toggleAccountStatus: async (id) => {
    try {
      // Mock implementation
      set((state) => {
        const updatedAccounts = state.accounts.map((account) =>
          account.id === id ? { ...account, isActive: !account.isActive, updatedAt: new Date() } : account
        );
        saveAccountsToLocalStorage(updatedAccounts);
        return { accounts: updatedAccounts };
      });
    } catch (error) {
      set({ error: 'Failed to toggle account status' });
    }
  },

  updateAccountBalance: async (id, amount, type) => {
    try {
      // Mock implementation
      set((state) => {
        const updatedAccounts = state.accounts.map((account) =>
          account.id === id 
            ? { 
                ...account, 
                balance: type === 'SALES' ? account.balance + amount : account.balance - amount,
                updatedAt: new Date() 
              } 
            : account
        );
        saveAccountsToLocalStorage(updatedAccounts);
        return { accounts: updatedAccounts };
      });
    } catch (error) {
      set({ error: 'Failed to update account balance' });
    }
  },
}));