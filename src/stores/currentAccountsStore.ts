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
            
      // Mock data for now
      const mockAccounts: CurrentAccount[] = [
        {
          id: '1',
          name: 'Apple Inc.',
          email: 'contact@apple.com',
          phone: '+1-800-123-4567',
          address: '1 Infinite Loop, Cupertino, CA',
          taxOffice: 'California Tax Office',
          taxNumber: '123456789',
          accountType: 'CUSTOMER',
          balance: 15000.0,
          isActive: true,
          tenantId: currentTenantId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          name: 'Google LLC',
          email: 'contact@google.com',
          phone: '+1-800-789-0123',
          address: '1600 Amphitheatre Parkway, Mountain View, CA',
          taxOffice: 'California Tax Office',
          taxNumber: '987654321',
          accountType: 'CUSTOMER',
          balance: 25000.0,
          isActive: true,
          tenantId: currentTenantId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '3',
          name: 'Microsoft Corporation',
          email: 'contact@microsoft.com',
          phone: '+1-800-456-7890',
          address: 'One Microsoft Way, Redmond, WA',
          taxOffice: 'Washington Tax Office',
          taxNumber: '456789123',
          accountType: 'CUSTOMER',
          balance: 30000.0,
          isActive: true,
          tenantId: currentTenantId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '12',
          name: 'Samsung Electronics',
          email: 'contact@samsung.com',
          phone: '+82-2-123-4567',
          address: '129, Samsung-ro, Yeongtong-gu, Suwon-si',
          taxOffice: 'Korean Tax Office',
          taxNumber: '789123456',
          accountType: 'SUPPLIER',
          balance: 40000.0,
          isActive: true,
          tenantId: currentTenantId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '13',
          name: 'LG Electronics',
          email: 'contact@lge.com',
          phone: '+82-2-987-6543',
          address: '10, LG Science Park, LG-ro, Magok-dong, Gangseo-gu',
          taxOffice: 'Korean Tax Office',
          taxNumber: '321654987',
          accountType: 'SUPPLIER',
          balance: 20000.0,
          isActive: true,
          tenantId: currentTenantId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '14',
          name: 'Sony Corporation',
          email: 'contact@sony.com',
          phone: '+81-3-1234-5678',
          address: '1-7-1 Konan, Minato-ku, Tokyo',
          taxOffice: 'Japanese Tax Office',
          taxNumber: '654987321',
          accountType: 'SUPPLIER',
          balance: 18000.0,
          isActive: true,
          tenantId: currentTenantId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Merge existing accounts with mock data to avoid duplicates
      const existingAccounts = get().accounts;
      const mergedAccounts = [...existingAccounts];
      mockAccounts.forEach(mockAccount => {
        if (!mergedAccounts.some(acc => acc.id === mockAccount.id)) {
          mergedAccounts.push(mockAccount);
        }
      });

      // Filter accounts by tenantId (in real app, this would be dynamic)
      const tenantAccounts = mergedAccounts.filter(account => account.tenantId === currentTenantId);

      set({ accounts: tenantAccounts, loading: false });
      saveAccountsToLocalStorage(mergedAccounts);
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