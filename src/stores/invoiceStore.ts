import { create } from 'zustand';
import { Invoice } from '@/types';
import { useTenantStore } from '@/lib/tenantStore';

// Load invoices from localStorage on initial load
const loadInvoicesFromLocalStorage = (): Invoice[] => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('invoices');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Convert date strings back to Date objects
        return parsed.map((invoice: any) => ({
          ...invoice,
          date: new Date(invoice.date),
          createdAt: new Date(invoice.createdAt),
          updatedAt: new Date(invoice.updatedAt)
        }));
      } catch (e) {
        console.error('Failed to parse invoices from localStorage', e);
        return [];
      }
    }
  }
  return [];
};

// Save invoices to localStorage
const saveInvoicesToLocalStorage = (invoices: Invoice[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('invoices', JSON.stringify(invoices));
  }
};

// Clear all invoices from localStorage
const clearInvoicesFromLocalStorage = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('invoices');
  }
};

interface InvoiceState {
  invoices: Invoice[];
  loading: boolean;
  error: string | null;
  
  // Invoice actions
  fetchInvoices: () => Promise<void>;
  addInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Invoice>;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  getInvoiceById: (id: string) => Invoice | undefined;
  clearAllInvoices: () => Promise<void>; // Yeni eklenen fonksiyon
}

export const useInvoiceStore = create<InvoiceState>((set, get) => ({

  invoices: loadInvoicesFromLocalStorage(),
  loading: false,
  error: null,

  // Invoice actions
  fetchInvoices: async () => {
    set({ loading: true, error: null });
    try {
      // Get current tenantId from tenant store
      const currentTenantId = useTenantStore.getState().tenantId || 'default-tenant';
            
      // Load existing invoices from localStorage
      const existingInvoices = get().invoices;
      
      // Filter invoices by tenantId (in real app, this would be dynamic)
      const tenantInvoices = existingInvoices.filter(invoice => invoice.tenantId === currentTenantId);
      
      set({ invoices: tenantInvoices, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch invoices', loading: false });
    }
  },

  addInvoice: async (invoiceData) => {
    try {
      // In a real app, this would be an API call
      // const response = await fetch('/api/invoices', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(invoiceData),
      // });
      // const newInvoice = await response.json();
      
      // Mock implementation - use dynamic tenantId
      const currentTenantId = useTenantStore.getState().tenantId || 'default-tenant';
      const newInvoice: Invoice = {
        ...invoiceData,
        id: Math.random().toString(36).substr(2, 9),
        tenantId: currentTenantId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      set((state) => {
        const updatedInvoices = [...state.invoices, newInvoice];
        saveInvoicesToLocalStorage(updatedInvoices);
        return { invoices: updatedInvoices };
      });
      
      return newInvoice;
    } catch (error) {
      set({ error: 'Failed to add invoice' });
      throw error;
    }
  },

  updateInvoice: async (id, invoiceData) => {
    try {
      // In a real app, this would be an API call
      // const response = await fetch(`/api/invoices/${id}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(invoiceData),
      // });
      // const updatedInvoice = await response.json();
      
      // Mock implementation
      set((state) => {
        const updatedInvoices = state.invoices.map((invoice) =>
          invoice.id === id ? { ...invoice, ...invoiceData, updatedAt: new Date() } : invoice
        );
        saveInvoicesToLocalStorage(updatedInvoices);
        return { invoices: updatedInvoices };
      });
    } catch (error) {
      set({ error: 'Failed to update invoice' });
    }
  },

  deleteInvoice: async (id) => {
    try {
      // In a real app, this would be an API call
      // await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
      
      // Mock implementation
      set((state) => {
        const updatedInvoices = state.invoices.filter((invoice) => invoice.id !== id);
        saveInvoicesToLocalStorage(updatedInvoices);
        return { invoices: updatedInvoices };
      });
    } catch (error) {
      set({ error: 'Failed to delete invoice' });
    }
  },

  getInvoiceById: (id) => {
    // Filter by tenantId as well
    const currentTenantId = useTenantStore.getState().tenantId || 'default-tenant';
    const invoices = get().invoices;
    const invoice = invoices.find(invoice => invoice.id === id);
    return invoice && invoice.tenantId === currentTenantId ? invoice : undefined;
  },

  clearAllInvoices: async () => {
    try {
      set({ invoices: [] });
      clearInvoicesFromLocalStorage();
    } catch (error) {
      set({ error: 'Failed to clear invoices' });
    }
  },
}));