import { create } from 'zustand';
import { CurrentAccount } from '@/types';
import { useTenantStore } from '@/lib/tenantStore';

// Helper function to make API requests
const makeApiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const tenantId = useTenantStore.getState().tenantId;
    console.log('DEBUG: Raw tenantId from store in currentAccountsStore:', tenantId);
  
  console.log('DEBUG: makeApiRequest called for endpoint:', endpoint);
  console.log('DEBUG: Retrieved tenantId:', tenantId);
  
  if (!tenantId) {
    console.error('ERROR: Tenant ID not available');
    throw new Error('Tenant ID not available');
  }
  
  // Conditionally add Content-Type header only for requests that have a body
  const headers: any = {
    ...options.headers,
  };
  
  console.log('DEBUG: Headers being sent:', headers);
  
  // Add Content-Type for methods that typically have a body
  const method = options.method?.toUpperCase();
  if (method === 'POST' || method === 'PUT' || method === 'PATCH' || (method === undefined && options.body !== undefined)) {
    headers['Content-Type'] = 'application/json';
  }
  
  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });
  
  console.log('DEBUG: API response status:', response.status);
  
  if (!response.ok) {
    console.error('ERROR: API request failed with status:', response.status);
    const errorText = await response.text();
    console.error('ERROR: API response text:', errorText);
    
    // Check if it's an auth session error
    if (response.status === 401 && errorText.includes('Auth session missing')) {
      console.error('AUTH SESSION ERROR: Redirecting to login');
      // Optionally redirect to login
      // window.location.href = '/auth/signin';
    }
    
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
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

  accounts: [],
  loading: false,
  error: null,

  // Account actions
  fetchAccounts: async () => {
    set({ loading: true, error: null });
    try {
      const accounts = await makeApiRequest('/current-accounts');
      set({ accounts, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch accounts', loading: false });
    }
  },

  addAccount: async (accountData) => {
    try {
      const newAccount = await makeApiRequest('/current-accounts', {
        method: 'POST',
        body: JSON.stringify(accountData),
      });

      set((state) => {
        const updatedAccounts = [...state.accounts, newAccount];
        return { accounts: updatedAccounts };
      });
    } catch (error) {
      set({ error: 'Failed to add account' });
    }
  },

  updateAccount: async (id, accountData) => {
    try {
      const updatedAccount = await makeApiRequest(`/current-accounts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(accountData),
      });

      set((state) => {
        const updatedAccounts = state.accounts.map((account) =>
          account.id === id ? updatedAccount : account
        );
        return { accounts: updatedAccounts };
      });
    } catch (error) {
      set({ error: 'Failed to update account' });
    }
  },

  deleteAccount: async (id) => {
    try {
      await makeApiRequest(`/current-accounts/${id}`, {
        method: 'DELETE',
      });

      set((state) => {
        const updatedAccounts = state.accounts.filter((account) => account.id !== id);
        return { accounts: updatedAccounts };
      });
    } catch (error) {
      set({ error: 'Failed to delete account' });
    }
  },

  toggleAccountStatus: async (id) => {
    try {
      const currentAccount = get().accounts.find(acc => acc.id === id);
      if (!currentAccount) return;
      
      const updatedAccount = await makeApiRequest(`/current-accounts/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !currentAccount.isActive }),
      });

      set((state) => {
        const updatedAccounts = state.accounts.map((account) =>
          account.id === id ? updatedAccount : account
        );
        return { accounts: updatedAccounts };
      });
    } catch (error) {
      set({ error: 'Failed to toggle account status' });
    }
  },

  updateAccountBalance: async (id, amount, type) => {
    try {
      const currentAccount = get().accounts.find(acc => acc.id === id);
      if (!currentAccount) return;
      
      const newBalance = type === 'SALES' ? currentAccount.balance + amount : currentAccount.balance - amount;
      
      const updatedAccount = await makeApiRequest(`/current-accounts/${id}/balance`, {
        method: 'PUT',
        body: JSON.stringify({ balance: newBalance }),
      });

      set((state) => {
        const updatedAccounts = state.accounts.map((account) =>
          account.id === id ? updatedAccount : account
        );
        return { accounts: updatedAccounts };
      });
    } catch (error) {
      set({ error: 'Failed to update account balance' });
    }
  }
}));