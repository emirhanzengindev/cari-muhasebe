import { create } from 'zustand';
import { Safe, Bank, Transaction, Cheque } from '@/types';
import { useTenantStore } from '@/lib/tenantStore';
import { getSupabaseBrowser } from '../lib/supabase';

// Helper function to make API requests
const makeApiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const tenantId = useTenantStore.getState().tenantId;
  
  if (!tenantId) {
    console.warn('WARNING: Tenant ID not available, skipping request for endpoint:', endpoint);
    return null;
  }
  
  // Get Supabase session token
  const supabase = getSupabaseBrowser();
  const { data: { session } } = await supabase.auth.getSession();
    
  // Conditionally add Content-Type header only for requests that have a body
  const headers: any = {
    ...options.headers,
  };
  
  // Add Authorization header if session exists
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
    
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
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

interface FinanceState {
  safes: Safe[];
  banks: Bank[];
  transactions: Transaction[];
  cheques: Cheque[];
  loading: boolean;
  error: string | null;
  
  // Safe actions
  fetchSafes: () => Promise<void>;
  addSafe: (safe: Omit<Safe, 'id' | 'balance' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateSafe: (id: string, safe: Partial<Safe>) => Promise<void>;
  deleteSafe: (id: string) => Promise<void>;
  
  // Bank actions
  fetchBanks: () => Promise<void>;
  addBank: (bank: Omit<Bank, 'id' | 'balance' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateBank: (id: string, bank: Partial<Bank>) => Promise<void>;
  deleteBank: (id: string) => Promise<void>;
  
  // Transaction actions
  fetchTransactions: () => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  
  // Cheque actions
  fetchCheques: () => Promise<void>;
  addCheque: (cheque: Omit<Cheque, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCheque: (id: string, cheque: Partial<Cheque>) => Promise<void>;
  deleteCheque: (id: string) => Promise<void>;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  safes: [],
  banks: [],
  transactions: [],
  cheques: [],
  loading: false,
  error: null,

  // Safe actions
  fetchSafes: async () => {
    set({ loading: true, error: null });
    try {
      const safes = await makeApiRequest('/safes');
      
      if (safes !== null) {
        set({ safes, loading: false });
      } else {
        // API call failed, keep safes as empty array
        set({ safes: [], loading: false });
      }
    } catch (error) {
      set({ error: 'Failed to fetch safes', loading: false, safes: [] });
    }
  },

  addSafe: async (safeData) => {
    try {
      const newSafe = await makeApiRequest('/safes', {
        method: 'POST',
        body: JSON.stringify(safeData),
      });
      
      if (newSafe !== null) {
        set((state) => ({
          safes: [...state.safes, newSafe],
        }));
      }
    } catch (error) {
      set({ error: 'Failed to add safe' });
    }
  },

  updateSafe: async (id, safeData) => {
    try {
      const updatedSafe = await makeApiRequest(`/safes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(safeData),
      });
      
      if (updatedSafe !== null) {
        set((state) => ({
          safes: state.safes.map((safe) =>
            safe.id === id ? updatedSafe : safe
          ),
        }));
      }
    } catch (error) {
      set({ error: 'Failed to update safe' });
    }
  },

  deleteSafe: async (id) => {
    try {
      const result = await makeApiRequest(`/safes/${id}`, {
        method: 'DELETE',
      });
      
      if (result !== null) {
        set((state) => ({
          safes: state.safes.filter((safe) => safe.id !== id),
        }));
      }
    } catch (error) {
      set({ error: 'Failed to delete safe' });
    }
  },

  // Bank actions
  fetchBanks: async () => {
    set({ loading: true, error: null });
    try {
      const banks = await makeApiRequest('/banks');
      
      if (banks !== null) {
        set({ banks, loading: false });
      } else {
        set({ loading: false });
      }
    } catch (error) {
      set({ error: 'Failed to fetch banks', loading: false });
    }
  },

  addBank: async (bankData) => {
    try {
      const newBank = await makeApiRequest('/banks', {
        method: 'POST',
        body: JSON.stringify(bankData),
      });
      
      if (newBank !== null) {
        set((state) => ({
          banks: [...state.banks, newBank],
        }));
      }
    } catch (error) {
      set({ error: 'Failed to add bank' });
    }
  },

  updateBank: async (id, bankData) => {
    try {
      const updatedBank = await makeApiRequest(`/banks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(bankData),
      });
      
      if (updatedBank !== null) {
        set((state) => ({
          banks: state.banks.map((bank) =>
            bank.id === id ? updatedBank : bank
          ),
        }));
      }
    } catch (error) {
      set({ error: 'Failed to update bank' });
    }
  },

  deleteBank: async (id) => {
    try {
      const result = await makeApiRequest(`/banks/${id}`, {
        method: 'DELETE',
      });
      
      if (result !== null) {
        set((state) => ({
          banks: state.banks.filter((bank) => bank.id !== id),
        }));
      }
    } catch (error) {
      set({ error: 'Failed to delete bank' });
    }
  },

  // Transaction actions
  fetchTransactions: async () => {
    set({ loading: true, error: null });
    try {
      const transactions = await makeApiRequest('/transactions');
      
      if (transactions !== null) {
        set({ transactions, loading: false });
      } else {
        set({ loading: false });
      }
    } catch (error) {
      set({ error: 'Failed to fetch transactions', loading: false });
    }
  },

  addTransaction: async (transactionData) => {
    try {
      const newTransaction = await makeApiRequest('/transactions', {
        method: 'POST',
        body: JSON.stringify(transactionData),
      });
      
      if (newTransaction !== null) {
        set((state) => ({
          transactions: [...state.transactions, newTransaction],
        }));
        
        // Update safe or bank balance
        if (transactionData.safeId) {
          const safe = get().safes.find(s => s.id === transactionData.safeId);
          if (safe) {
            const newBalance = transactionData.transactionType === 'COLLECTION' 
              ? safe.balance + transactionData.amount 
              : safe.balance - transactionData.amount;
            
            set((state) => ({
              safes: state.safes.map(s => 
                s.id === transactionData.safeId 
                  ? { ...s, balance: newBalance, updatedAt: new Date() } 
                  : s
              ),
            }));
          }
        }
        
        if (transactionData.bankId) {
          const bank = get().banks.find(b => b.id === transactionData.bankId);
          if (bank) {
            const newBalance = transactionData.transactionType === 'COLLECTION' 
              ? bank.balance + transactionData.amount 
              : bank.balance - transactionData.amount;
            
            set((state) => ({
              banks: state.banks.map(b => 
                b.id === transactionData.bankId 
                  ? { ...b, balance: newBalance, updatedAt: new Date() } 
                  : b
              ),
            }));
          }
        }
      }
    } catch (error) {
      set({ error: 'Failed to add transaction' });
    }
  },

  updateTransaction: async (id, transactionData) => {
    try {
      const updatedTransaction = await makeApiRequest(`/transactions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(transactionData),
      });
      
      if (updatedTransaction !== null) {
        set((state) => ({
          transactions: state.transactions.map((transaction) =>
            transaction.id === id ? updatedTransaction : transaction
          ),
        }));
      }
    } catch (error) {
      set({ error: 'Failed to update transaction' });
    }
  },

  deleteTransaction: async (id) => {
    try {
      const result = await makeApiRequest(`/transactions/${id}`, {
        method: 'DELETE',
      });
      
      if (result !== null) {
        set((state) => ({
          transactions: state.transactions.filter((transaction) => transaction.id !== id),
        }));
      }
    } catch (error) {
      set({ error: 'Failed to delete transaction' });
    }
  },

  // Cheque actions
  fetchCheques: async () => {
    set({ loading: true, error: null });
    try {
      const cheques = await makeApiRequest('/cheques');
      
      if (cheques !== null) {
        set({ cheques, loading: false });
      } else {
        set({ loading: false });
      }
    } catch (error) {
      set({ error: 'Failed to fetch cheques', loading: false });
    }
  },

  addCheque: async (chequeData) => {
    try {
      const newCheque = await makeApiRequest('/cheques', {
        method: 'POST',
        body: JSON.stringify(chequeData),
      });
      
      if (newCheque !== null) {
        set((state) => ({
          cheques: [...state.cheques, newCheque],
        }));
      }
    } catch (error) {
      set({ error: 'Failed to add cheque' });
    }
  },

  updateCheque: async (id, chequeData) => {
    try {
      const updatedCheque = await makeApiRequest(`/cheques/${id}`, {
        method: 'PUT',
        body: JSON.stringify(chequeData),
      });
      
      if (updatedCheque !== null) {
        set((state) => ({
          cheques: state.cheques.map((cheque) =>
            cheque.id === id ? updatedCheque : cheque
          ),
        }));
      }
    } catch (error) {
      set({ error: 'Failed to update cheque' });
    }
  },

  deleteCheque: async (id) => {
    try {
      const result = await makeApiRequest(`/cheques/${id}`, {
        method: 'DELETE',
      });
      
      if (result !== null) {
        set((state) => ({
          cheques: state.cheques.filter((cheque) => cheque.id !== id),
        }));
      }
    } catch (error) {
      set({ error: 'Failed to delete cheque' });
    }
  },
}));
