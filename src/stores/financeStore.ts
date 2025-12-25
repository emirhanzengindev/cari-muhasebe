import { create } from 'zustand';
import { Safe, Bank, Transaction, Cheque } from '@/types';
import { useTenantStore } from '@/lib/tenantStore';

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
      // In a real app, this would be an API call
      // const response = await fetch('/api/safes');
      // const safes = await response.json();
      
      // Empty array for safes
      const safes: Safe[] = [];
      
      set({ safes, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch safes', loading: false });
    }
  },

  addSafe: async (safeData) => {
    try {
      // In a real app, this would be an API call
      // const response = await fetch('/api/safes', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(safeData),
      // });
      // const newSafe = await response.json();
      
      // Mock implementation
      const newSafe: Safe = {
        ...safeData,
        id: Math.random().toString(36).substr(2, 9),
        balance: 0,
        tenantId: useTenantStore.getState().tenantId || 'default-tenant',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      set((state) => ({
        safes: [...state.safes, newSafe],
      }));
    } catch (error) {
      set({ error: 'Failed to add safe' });
    }
  },

  updateSafe: async (id, safeData) => {
    try {
      // In a real app, this would be an API call
      // const response = await fetch(`/api/safes/${id}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(safeData),
      // });
      // const updatedSafe = await response.json();
      
      // Mock implementation
      set((state) => ({
        safes: state.safes.map((safe) =>
          safe.id === id ? { ...safe, ...safeData, updatedAt: new Date() } : safe
        ),
      }));
    } catch (error) {
      set({ error: 'Failed to update safe' });
    }
  },

  deleteSafe: async (id) => {
    try {
      // In a real app, this would be an API call
      // await fetch(`/api/safes/${id}`, { method: 'DELETE' });
      
      // Mock implementation
      set((state) => ({
        safes: state.safes.filter((safe) => safe.id !== id),
      }));
    } catch (error) {
      set({ error: 'Failed to delete safe' });
    }
  },

  // Bank actions
  fetchBanks: async () => {
    set({ loading: true, error: null });
    try {
      // In a real app, this would be an API call
      // const response = await fetch('/api/banks');
      // const banks = await response.json();
      
      // Empty array for banks
      const banks: Bank[] = [];
      
      set({ banks, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch banks', loading: false });
    }
  },

  addBank: async (bankData) => {
    try {
      // In a real app, this would be an API call
      // const response = await fetch('/api/banks', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(bankData),
      // });
      // const newBank = await response.json();
      
      // Mock implementation
      const newBank: Bank = {
        ...bankData,
        id: Math.random().toString(36).substr(2, 9),
        balance: 0,
        tenantId: useTenantStore.getState().tenantId || 'default-tenant',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      set((state) => ({
        banks: [...state.banks, newBank],
      }));
    } catch (error) {
      set({ error: 'Failed to add bank' });
    }
  },

  updateBank: async (id, bankData) => {
    try {
      // In a real app, this would be an API call
      // const response = await fetch(`/api/banks/${id}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(bankData),
      // });
      // const updatedBank = await response.json();
      
      // Mock implementation
      set((state) => ({
        banks: state.banks.map((bank) =>
          bank.id === id ? { ...bank, ...bankData, updatedAt: new Date() } : bank
        ),
      }));
    } catch (error) {
      set({ error: 'Failed to update bank' });
    }
  },

  deleteBank: async (id) => {
    try {
      // In a real app, this would be an API call
      // await fetch(`/api/banks/${id}`, { method: 'DELETE' });
      
      // Mock implementation
      set((state) => ({
        banks: state.banks.filter((bank) => bank.id !== id),
      }));
    } catch (error) {
      set({ error: 'Failed to delete bank' });
    }
  },

  // Transaction actions
  fetchTransactions: async () => {
    set({ loading: true, error: null });
    try {
      // In a real app, this would be an API call
      // const response = await fetch('/api/transactions');
      // const transactions = await response.json();
      
      // Empty array for transactions
      const transactions: Transaction[] = [];
      
      set({ transactions, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch transactions', loading: false });
    }
  },

  addTransaction: async (transactionData) => {
    try {
      // In a real app, this would be an API call
      // const response = await fetch('/api/transactions', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(transactionData),
      // });
      // const newTransaction = await response.json();
      
      // Mock implementation
      const newTransaction: Transaction = {
        ...transactionData,
        id: Math.random().toString(36).substr(2, 9),
        tenantId: useTenantStore.getState().tenantId || 'default-tenant',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
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
    } catch (error) {
      set({ error: 'Failed to add transaction' });
    }
  },

  updateTransaction: async (id, transactionData) => {
    try {
      // In a real app, this would be an API call
      // const response = await fetch(`/api/transactions/${id}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(transactionData),
      // });
      // const updatedTransaction = await response.json();
      
      // Mock implementation
      set((state) => ({
        transactions: state.transactions.map((transaction) =>
          transaction.id === id ? { ...transaction, ...transactionData, updatedAt: new Date() } : transaction
        ),
      }));
    } catch (error) {
      set({ error: 'Failed to update transaction' });
    }
  },

  deleteTransaction: async (id) => {
    try {
      // In a real app, this would be an API call
      // await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      
      // Mock implementation
      set((state) => ({
        transactions: state.transactions.filter((transaction) => transaction.id !== id),
      }));
    } catch (error) {
      set({ error: 'Failed to delete transaction' });
    }
  },

  // Cheque actions
  fetchCheques: async () => {
    set({ loading: true, error: null });
    try {
      // In a real app, this would be an API call
      // const response = await fetch('/api/cheques');
      // const cheques = await response.json();
      
      // Empty array for cheques
      const cheques: Cheque[] = [];
      
      set({ cheques, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch cheques', loading: false });
    }
  },

  addCheque: async (chequeData) => {
    try {
      // In a real app, this would be an API call
      // const response = await fetch('/api/cheques', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(chequeData),
      // });
      // const newCheque = await response.json();
      
      // Mock implementation
      const newCheque: Cheque = {
        ...chequeData,
        id: Math.random().toString(36).substr(2, 9),
        tenantId: useTenantStore.getState().tenantId || 'default-tenant',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      set((state) => ({
        cheques: [...state.cheques, newCheque],
      }));
    } catch (error) {
      set({ error: 'Failed to add cheque' });
    }
  },

  updateCheque: async (id, chequeData) => {
    try {
      // In a real app, this would be an API call
      // const response = await fetch(`/api/cheques/${id}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(chequeData),
      // });
      // const updatedCheque = await response.json();
      
      // Mock implementation
      set((state) => ({
        cheques: state.cheques.map((cheque) =>
          cheque.id === id ? { ...cheque, ...chequeData, updatedAt: new Date() } : cheque
        ),
      }));
    } catch (error) {
      set({ error: 'Failed to update cheque' });
    }
  },

  deleteCheque: async (id) => {
    try {
      // In a real app, this would be an API call
      // await fetch(`/api/cheques/${id}`, { method: 'DELETE' });
      
      // Mock implementation
      set((state) => ({
        cheques: state.cheques.filter((cheque) => cheque.id !== id),
      }));
    } catch (error) {
      set({ error: 'Failed to delete cheque' });
    }
  },
}));