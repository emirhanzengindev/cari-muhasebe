import { create } from 'zustand';
import { Invoice } from '@/types';
import { useTenantStore } from '@/lib/tenantStore';

// Helper function to make API requests
const makeApiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const tenantId = useTenantStore.getState().tenantId;
  
  if (!tenantId) {
    throw new Error('Tenant ID not available');
  }
  
  // Conditionally add Content-Type header only for requests that have a body
  const headers: any = {
    'x-tenant-id': tenantId,
    ...options.headers,
  };
  
  // Add Content-Type for methods that typically have a body
  const method = options.method?.toUpperCase();
  if (method === 'POST' || method === 'PUT' || method === 'PATCH' || (method === undefined && options.body !== undefined)) {
    headers['Content-Type'] = 'application/json';
  }
  
  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
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

  invoices: [],
  loading: false,
  error: null,

  // Invoice actions
  fetchInvoices: async () => {
    set({ loading: true, error: null });
    try {
      const invoices = await makeApiRequest('/invoices');
      set({ invoices, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch invoices', loading: false });
    }
  },

  addInvoice: async (invoiceData) => {
    try {
      const newInvoice = await makeApiRequest('/invoices', {
        method: 'POST',
        body: JSON.stringify(invoiceData),
      });
      
      set((state) => {
        const updatedInvoices = [...state.invoices, newInvoice];
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
      const updatedInvoice = await makeApiRequest(`/invoices/${id}`, {
        method: 'PUT',
        body: JSON.stringify(invoiceData),
      });
      
      set((state) => {
        const updatedInvoices = state.invoices.map((invoice) =>
          invoice.id === id ? updatedInvoice : invoice
        );
        return { invoices: updatedInvoices };
      });
    } catch (error) {
      set({ error: 'Failed to update invoice' });
    }
  },

  deleteInvoice: async (id) => {
    try {
      await makeApiRequest(`/invoices/${id}`, {
        method: 'DELETE',
      });
      
      set((state) => {
        const updatedInvoices = state.invoices.filter((invoice) => invoice.id !== id);
        return { invoices: updatedInvoices };
      });
    } catch (error) {
      set({ error: 'Failed to delete invoice' });
    }
  },

  getInvoiceById: (id) => {
    const invoices = get().invoices;
    return invoices.find(invoice => invoice.id === id);
  },

  clearAllInvoices: async () => {
    try {
      set({ invoices: [] });
    } catch (error) {
      set({ error: 'Failed to clear invoices' });
    }
  },
}));