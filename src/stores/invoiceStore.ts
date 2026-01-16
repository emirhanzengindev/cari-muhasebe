import { create } from 'zustand';
import { Invoice } from '@/types';
import { useTenantStore } from '@/lib/tenantStore';

// Helper function to make API requests
const makeApiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const tenantId = useTenantStore.getState().tenantId;
    console.log('DEBUG: Raw tenantId from store in invoiceStore:', tenantId);
  
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